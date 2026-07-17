from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import shutil
import os
import tempfile

from . import models, schemas
from .database import engine, get_db
from .services.speech_to_text import transcribe_audio
from .services.sentiment import analyze_sentiment

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
def upload_audio(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Receives an audio file, transcribes it, analyzes sentiment, 
    stores the interaction in the database, and returns the result.
    """
    print(f"--- Received request to upload file: {file.filename} ---")
    # 1. Save the uploaded file to a temporary location
    try:
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {e}")
    finally:
        file.file.close()

    try:
        # 2. Transcribe the audio
        transcription = transcribe_audio(tmp_path)
        
        # 3. Analyze Sentiment
        sentiment_result = analyze_sentiment(transcription)
        
        # 4. Save to Database
        db_interaction = models.Interaction(
            filename=file.filename,
            duration_seconds=0.0, # Optionally calculate duration later using librosa or wave
            transcription=transcription,
            sentiment_score=sentiment_result["score"],
            sentiment_label=sentiment_result["label"]
        )
        db.add(db_interaction)
        db.commit()
        db.refresh(db_interaction)
        
        return db_interaction
        
    except Exception as e:
        print(f"--- ERROR during upload/processing: {e} ---")
        raise HTTPException(status_code=500, detail=f"Error processing audio: {e}")
    finally:
        # Clean up the temporary file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

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
