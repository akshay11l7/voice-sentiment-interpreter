# System Architecture

## Overview
The Voice-to-Text and Sentiment Interpreter is a full-stack web application designed to ingest customer audio, transcribe it to text using a local speech-to-text model, and classify the underlying sentiment (Happy/Sad) using NLP techniques.

## Components
### 1. Frontend (React + Vite)
- **Audio Capture**: Handles live microphone recording and drag-and-drop file uploads.
- **Dashboard**: Displays past interactions, transcriptions, and color-coded sentiment labels.
- **API Client**: Communicates with the backend REST API.

### 2. Backend (FastAPI)
- **API Endpoints**: `/api/upload` for ingestion, `/api/interactions` for history.
- **Audio Service**: Preprocesses raw audio files.
- **STT Service (Whisper)**: Converts audio into text transcripts locally.
- **Sentiment Service**: Uses VADER/TextBlob to analyze transcripts and assign sentiment scores (-1.0 to 1.0) and labels.

### 3. Database (SQLite)
- **interactions table**: Stores metadata including filename, transcription, sentiment score, sentiment label, duration, and timestamp.

## Data Flow
1. User uploads audio or records voice on the Frontend.
2. Frontend sends `multipart/form-data` to the Backend `/api/upload` endpoint.
3. Backend saves the audio file locally for processing.
4. STT Service transcribes the audio file to text.
5. Sentiment Service analyzes the transcription for sentiment.
6. Backend persists the filename, transcription, and sentiment data to the SQLite Database.
7. Backend responds with the processed interaction record.
8. Frontend updates the UI with the transcription and sentiment badge.
