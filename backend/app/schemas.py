from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

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
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class AuditLogBase(BaseModel):
    action_type: str
    description: Optional[str] = None

class AuditLogResponse(AuditLogBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
