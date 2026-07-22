from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class InteractionBase(BaseModel):
    filename: str
    duration_seconds: Optional[float] = None
    transcription: Optional[str] = None
    sentiment_score: Optional[float] = None
    sentiment_label: Optional[str] = None
    average_sentiment: Optional[float] = None
    client_satisfaction: Optional[float] = None
    diarization_data: Optional[str] = None

class InteractionResponse(InteractionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
