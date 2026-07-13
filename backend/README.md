# Backend API Documentation & Testing

This directory contains the FastAPI backend for the Voice-to-Text and Sentiment Interpreter.

## Modular Testing

As per the architectural design, the core AI components are modularized so they can be tested independently of the web API.

### Test Sentiment Analyzer
Run the sentiment analyzer module as a script to verify that the NLP logic works:
```bash
python3 -m app.services.sentiment
```
This will print out sentiment scores for some sample predefined text strings.

### Test Speech-to-Text
Run the STT module independently by passing a path to an audio file. This avoids the HTTP upload overhead:
```bash
python3 -m app.services.speech_to_text <path_to_audio.wav>
```

## Running the API

1. Start the FastAPI server using Uvicorn:
```bash
uvicorn app.main:app --reload
```

2. Access the interactive API documentation at: `http://localhost:8000/docs`

## End-to-End API Testing with `curl`

Upload an audio file to the API to simulate the frontend behavior:
```bash
curl -X POST "http://localhost:8000/api/upload" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@<path_to_audio.wav>"
```

Fetch historical interactions:
```bash
curl -X GET "http://localhost:8000/api/interactions" -H "accept: application/json"
```
