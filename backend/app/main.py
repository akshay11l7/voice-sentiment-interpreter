from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import shutil
import os
import tempfile
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

from . import models, schemas
from .database import engine, get_db
from .auth import SECRET_KEY, ALGORITHM, create_access_token, get_password_hash, verify_password, ACCESS_TOKEN_EXPIRE_MINUTES
from jose import JWTError, jwt
from datetime import timedelta
from .services.speech_to_text import transcribe_audio
from .services.sentiment import analyze_sentiment
from .services.audio_processing import reduce_noise
from .services.diarization import diarize_audio
import json

# Create tables if they don't exist
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Voice-to-Text and Sentiment Interpreter API")

# Allow CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Voice-to-Text and Sentiment Interpreter API"}

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

@app.post("/api/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password, full_name=user.full_name)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Audit Log
    log = models.AuditLog(user_id=db_user.id, action_type="REGISTER", description=f"Registered account for {user.email}")
    db.add(log)
    db.commit()

    return db_user

@app.post("/api/login", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password", headers={"WWW-Authenticate": "Bearer"})
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user.email}, expires_delta=access_token_expires)

    # Audit Log
    log = models.AuditLog(user_id=user.id, action_type="LOGIN", description=f"User logged in")
    db.add(log)
    db.commit()

    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.put("/api/me/settings", response_model=schemas.UserResponse)
def update_user_settings(
    settings: schemas.UserSettingsUpdate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """
    Updates configuration settings (Whisper model, Sentiment model, Diarization, Noise Reduction) for the authenticated user.
    """
    current_user.whisper_model = settings.whisper_model
    current_user.sentiment_model = settings.sentiment_model
    current_user.enable_diarization = settings.enable_diarization
    current_user.enable_noise_reduction = settings.enable_noise_reduction
    
    db.commit()
    db.refresh(current_user)
    
    # Audit log
    log = models.AuditLog(
        user_id=current_user.id, 
        action_type="SETTINGS_UPDATE", 
        description=f"Updated settings (Whisper: {settings.whisper_model}, Sentiment: {settings.sentiment_model})"
    )
    db.add(log)
    db.commit()
    
    return current_user

@app.post("/api/upload", response_model=schemas.InteractionResponse)
def upload_audio(file: UploadFile = File(...), task: str = Form("transcribe"), db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Receives an audio file, transcribes it, analyzes sentiment, 
    stores the interaction in the database, and returns the result.
    """
    logger.info(f"Received request to upload file: {file.filename} (Content-Type: {file.content_type})")
    
    # Validate file type
    valid_content_types = ["audio/wav", "audio/x-wav", "audio/mp3", "audio/mpeg", "audio/webm", "video/webm"]
    valid_extensions = [".wav", ".mp3", ".webm"]
    
    suffix = os.path.splitext(file.filename)[1].lower()
    
    if file.content_type not in valid_content_types and suffix not in valid_extensions:
        logger.warning(f"Rejected unsupported file upload: {file.filename} ({file.content_type})")
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload a WAV, MP3, or WEBM audio file.")

    # 1. Save the uploaded file to a temporary location
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name
    except Exception as e:
        logger.error(f"Could not save file {file.filename}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Could not save file on the server.")
    finally:
        file.file.close()

    try:
        # 1.5 Apply noise reduction if enabled
        if current_user.enable_noise_reduction:
            clean_tmp_path = tmp_path.replace(suffix, f"_clean{suffix}")
            try:
                reduce_noise(tmp_path, clean_tmp_path)
                process_path = clean_tmp_path
            except Exception as e:
                logger.warning(f"Noise reduction failed, proceeding with original audio: {e}")
                process_path = tmp_path
        else:
            logger.info("Noise reduction disabled by user settings.")
            process_path = tmp_path

        # 2. Transcribe the audio using the selected Whisper model
        transcription_result = transcribe_audio(
            process_path, 
            task=task, 
            model_name=current_user.whisper_model
        )
        whisper_text = transcription_result["text"].strip()
        whisper_segments = transcription_result.get("segments", [])

        # 3. Perform speaker diarization if enabled
        diarization_result = []
        if current_user.enable_diarization:
            wav_tmp_path = process_path.rsplit('.', 1)[0] + '_diarize.wav'
            try:
                import subprocess
                subprocess.run(
                    ['ffmpeg', '-y', '-i', process_path, '-ar', '16000', '-ac', '1', wav_tmp_path],
                    capture_output=True, check=True
                )
                diarize_path = wav_tmp_path
            except Exception as e:
                logger.warning(f"WAV conversion for diarization failed, using original: {e}")
                diarize_path = process_path
            
            diarization_result = diarize_audio(diarize_path)
        else:
            logger.info("Speaker diarization disabled by user settings.")

        # 4. Align Whisper segments with Diarization and analyze sentiment per segment
        aligned_segments = []
        for w_seg in whisper_segments:
            w_start = w_seg["start"]
            w_end = w_seg["end"]
            w_text = w_seg["text"].strip()
            if not w_text:
                continue

            best_speaker = "Unknown"
            max_overlap = 0
            if current_user.enable_diarization:
                for d_seg in diarization_result:
                    d_start = d_seg["start"]
                    d_end = d_seg["end"]
                    
                    overlap_start = max(w_start, d_start)
                    overlap_end = min(w_end, d_end)
                    overlap = max(0, overlap_end - overlap_start)
                    
                    if overlap > max_overlap:
                        max_overlap = overlap
                        best_speaker = d_seg["speaker"]
            
            # Analyze sentiment for this segment using user's selected sentiment model
            seg_sentiment = analyze_sentiment(
                w_text, 
                model_name=current_user.sentiment_model
            )
            
            aligned_segments.append({
                "speaker": best_speaker,
                "start": w_start,
                "end": w_end,
                "text": w_text,
                "sentiment": seg_sentiment["label"],
                "sentiment_score": seg_sentiment["score"]
            })

        # 5. Calculate Metrics using Segment-Weighted Sentiment
        EMOTION_SIGN_MAP = {
            "Happy": 1.0,
            "Surprise": 0.5,
            "Neutral": 0.0,
            "Sad": -1.0,
            "Angry": -1.0,
            "Fear": -0.8,
            "Disgust": -0.8
        }
        
        if aligned_segments:
            # Calculate average signed sentiment across all spoken segments
            signed_scores = []
            for s in aligned_segments:
                label = s["sentiment"]
                score = s["sentiment_score"]
                sign = EMOTION_SIGN_MAP.get(label, 0.0)
                signed_scores.append(sign * score)
            
            avg_signed_score = sum(signed_scores) / len(aligned_segments)
            
            # Determine overall sentiment label based on the average signed score
            if avg_signed_score < -0.15:
                neg_labels = [s["sentiment"] for s in aligned_segments if EMOTION_SIGN_MAP.get(s["sentiment"], 0.0) < 0]
                overall_label = max(set(neg_labels), key=neg_labels.count) if neg_labels else "Angry"
            elif avg_signed_score > 0.15:
                pos_labels = [s["sentiment"] for s in aligned_segments if EMOTION_SIGN_MAP.get(s["sentiment"], 0.0) > 0]
                overall_label = max(set(pos_labels), key=pos_labels.count) if pos_labels else "Happy"
            else:
                overall_label = "Neutral"
            
            overall_score = abs(avg_signed_score)
        else:
            # Fallback if no segments are detected
            overall_sentiment_result = analyze_sentiment(
                whisper_text, 
                model_name=current_user.sentiment_model
            )
            overall_label = overall_sentiment_result["label"]
            sign = EMOTION_SIGN_MAP.get(overall_label, 0.0)
            avg_signed_score = sign * overall_sentiment_result["score"]
            overall_score = overall_sentiment_result["score"]
            
        # Map average signed score (-1.0 to 1.0) to a 1.0 - 10.0 scale for client satisfaction
        client_satisfaction = round((avg_signed_score + 1.0) * 4.5 + 1.0, 1)
        
        diarization_json = json.dumps(aligned_segments)
        
        # 6. Save to Database
        db_interaction = models.Interaction(
            user_id=current_user.id,
            filename=file.filename,
            duration_seconds=0.0,
            transcription=whisper_text,
            sentiment_score=overall_score,
            sentiment_label=overall_label,
            average_sentiment=avg_signed_score,
            client_satisfaction=client_satisfaction,
            diarization_data=diarization_json
        )
        db.add(db_interaction)
        db.commit()
        db.refresh(db_interaction)
        
        # Audit Log
        log = models.AuditLog(user_id=current_user.id, action_type="UPLOAD", description=f"Uploaded and processed {file.filename}")
        db.add(log)
        db.commit()

        return db_interaction
        
    except Exception as e:
        logger.error(f"Error during upload/processing of {file.filename}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An error occurred while processing the audio.")
    finally:
        # Clean up the temporary files
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        if 'clean_tmp_path' in locals() and os.path.exists(clean_tmp_path):
            os.remove(clean_tmp_path)
        if 'wav_tmp_path' in locals() and os.path.exists(wav_tmp_path):
            os.remove(wav_tmp_path)

@app.get("/api/interactions", response_model=list[schemas.InteractionResponse])
def get_interactions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Fetches historical interactions for the logged in user from the database.
    """
    interactions = db.query(models.Interaction).filter(models.Interaction.user_id == current_user.id).order_by(models.Interaction.created_at.desc()).offset(skip).limit(limit).all()
    return interactions

@app.delete("/api/interactions/{interaction_id}")
def delete_interaction(interaction_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Deletes a historical interaction from the database (only if owned by current user).
    """
    interaction = db.query(models.Interaction).filter(models.Interaction.id == interaction_id, models.Interaction.user_id == current_user.id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found or you don't have permission to delete it")
    db.delete(interaction)
    
    # Audit Log
    log = models.AuditLog(user_id=current_user.id, action_type="DELETE", description=f"Deleted interaction {interaction.filename}")
    db.add(log)

    db.commit()
    return {"message": "Interaction deleted successfully"}

@app.get("/api/logs", response_model=list[schemas.AuditLogResponse])
def get_audit_logs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Fetches action history (audit logs) for the logged in user from the database.
    """
    logs = db.query(models.AuditLog).filter(models.AuditLog.user_id == current_user.id).order_by(models.AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    return logs
