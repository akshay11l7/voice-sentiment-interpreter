from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    whisper_model = Column(String, default="small", nullable=False)
    sentiment_model = Column(String, default="j-hartmann/emotion-english-distilroberta-base", nullable=False)
    enable_diarization = Column(Boolean, default=True, nullable=False)
    enable_noise_reduction = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    interactions = relationship("Interaction", back_populates="owner")
    audit_logs = relationship("AuditLog", back_populates="owner")

class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    duration_seconds = Column(Float, nullable=True)
    transcription = Column(String, nullable=True)
    sentiment_score = Column(Float, nullable=True) # Float from -1.0 (sad) to 1.0 (happy)
    sentiment_label = Column(String, nullable=True) # "Happy" or "Sad"
    average_sentiment = Column(Float, nullable=True)
    client_satisfaction = Column(Float, nullable=True) # 1.0 to 10.0 scale
    diarization_data = Column(String, nullable=True) # JSON string of segments
    created_at = Column(DateTime, default=datetime.utcnow)
    owner = relationship("User", back_populates="interactions")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action_type = Column(String, index=True, nullable=False) # e.g. "LOGIN", "UPLOAD", "DELETE"
    description = Column(String, nullable=True) # e.g. "Uploaded file audio.wav"
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="audit_logs")
