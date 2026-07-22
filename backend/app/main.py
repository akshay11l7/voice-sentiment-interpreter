from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException
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

@app.post("/api/upload", response_model=schemas.InteractionResponse)
def upload_audio(file: UploadFile = File(...), task: str = Form("transcribe"), db: Session = Depends(get_db)):
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

        # 3. Diarize the audio
        diarization_result = diarize_audio(process_path)

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
            for d_seg in diarization_result:
                d_start = d_seg["start"]
                d_end = d_seg["end"]
                
                overlap_start = max(w_start, d_start)
                overlap_end = min(w_end, d_end)
                overlap = max(0, overlap_end - overlap_start)
                
                if overlap > max_overlap:
                    max_overlap = overlap
                    best_speaker = d_seg["speaker"]
            
            # Analyze sentiment for this segment
            seg_sentiment = analyze_sentiment(w_text)
            
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

@app.get("/api/interactions", response_model=list[schemas.InteractionResponse])
def get_interactions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Fetches historical interactions from the database.
    """
    interactions = db.query(models.Interaction).order_by(models.Interaction.created_at.desc()).offset(skip).limit(limit).all()
    return interactions

@app.delete("/api/interactions/{interaction_id}")
def delete_interaction(interaction_id: int, db: Session = Depends(get_db)):
    """
    Deletes a historical interaction from the database.
    """
    interaction = db.query(models.Interaction).filter(models.Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    db.delete(interaction)
    db.commit()
    return {"message": "Interaction deleted successfully"}
