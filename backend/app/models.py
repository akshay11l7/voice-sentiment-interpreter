from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from .database import Base

class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    filename = Column(String, nullable=False)
    duration_seconds = Column(Float, nullable=True)
    transcription = Column(String, nullable=True)
    sentiment_score = Column(Float, nullable=True) # Float from -1.0 (sad) to 1.0 (happy)
    sentiment_label = Column(String, nullable=True) # "Happy" or "Sad"
    average_sentiment = Column(Float, nullable=True)
    client_satisfaction = Column(Float, nullable=True) # 1.0 to 10.0 scale
    diarization_data = Column(String, nullable=True) # JSON string of segments
    created_at = Column(DateTime, default=datetime.utcnow)
