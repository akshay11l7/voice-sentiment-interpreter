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
    return db_user

@app.post("/api/login", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password", headers={"WWW-Authenticate": "Bearer"})
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user.email}, expires_delta=access_token_expires)
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(get_current_user)):
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
        # 1.5 Apply noise reduction
        clean_tmp_path = tmp_path.replace(suffix, f"_clean{suffix}") # Try to keep same suffix or .wav
        try:
            reduce_noise(tmp_path, clean_tmp_path)
            process_path = clean_tmp_path
        except Exception as e:
            logger.warning(f"Noise reduction failed, proceeding with original audio: {e}")
            process_path = tmp_path

        # 2. Transcribe the audio (now returns full dict with segments)
        transcription_result = transcribe_audio(process_path, task=task)
        whisper_text = transcription_result["text"].strip()
        whisper_segments = transcription_result.get("segments", [])

        # 3. Convert to WAV for diarization (PyAnnote needs precise sample counts)
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

        # 4. Align Whisper segments with Diarization and analyze sentiment per segment
        aligned_segments = []
        context_buffer = []  # Keep track of up to 3 segments (2 context + 1 current)
        for w_seg in whisper_segments:
            w_start = w_seg["start"]
            w_end = w_seg["end"]
            w_text = w_seg["text"].strip()
            if not w_text:
                continue

            best_speaker = "Unknown"
            max_overlap = 0
            for d_seg in diarization_result:
                d_start = d_seg["start"]
                d_end = d_seg["end"]
                
                overlap_start = max(w_start, d_start)
                overlap_end = min(w_end, d_end)
                overlap = max(0, overlap_end - overlap_start)
                
                if overlap > max_overlap:
                    max_overlap = overlap
                    best_speaker = d_seg["speaker"]
            
            # Context-Windowing: Append current text, trim to max 3 items
            context_buffer.append(w_text)
            if len(context_buffer) > 3:
                context_buffer.pop(0)
            
            # Analyze sentiment for this segment using the combined context
            context_text = " ".join(context_buffer)
            seg_sentiment = analyze_sentiment(context_text)
            
            aligned_segments.append({
                "speaker": best_speaker,
                "start": w_start,
                "end": w_end,
                "text": w_text,
                "sentiment": seg_sentiment["label"],
                "sentiment_score": seg_sentiment["score"]
            })

        # 5. Calculate Metrics
        overall_sentiment_result = analyze_sentiment(whisper_text)
        
        if aligned_segments:
            total_score = sum(s["sentiment_score"] for s in aligned_segments)
            avg_score = total_score / len(aligned_segments)
        else:
            avg_score = overall_sentiment_result["score"]
            
        # Map average score (-1.0 to 1.0) to a 1.0 - 10.0 scale for client satisfaction
        client_satisfaction = round((avg_score + 1.0) * 4.5 + 1.0, 1)
        
        diarization_json = json.dumps(aligned_segments)
        
        # 6. Save to Database
        db_interaction = models.Interaction(
            user_id=current_user.id,
            filename=file.filename,
            duration_seconds=0.0,
            transcription=whisper_text,
            sentiment_score=avg_score,
            sentiment_label=overall_sentiment_result["label"],
            average_sentiment=avg_score,
            client_satisfaction=client_satisfaction,
            diarization_data=diarization_json
        )
        db.add(db_interaction)
        db.commit()
        db.refresh(db_interaction)
        
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
    db.commit()
    return {"message": "Interaction deleted successfully"}
