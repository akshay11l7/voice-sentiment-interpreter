# Voice-to-Text and Sentiment Interpreter 🎙️

An AI-powered, full-stack web application designed for customer service analytics. This platform allows users to upload customer interaction audio files, instantly transcribes them using OpenAI Whisper, and analyzes the conversational sentiment (Happy, Sad, Neutral) using VADER NLP.

## 🚀 Tech Stack
* **Frontend**: React, Vite, Vanilla CSS
* **Backend**: Python, FastAPI
* **Database**: SQLite, SQLAlchemy
* **AI & NLP**: OpenAI Whisper (`tiny` model), VADER Sentiment Intensity Analyzer

---

## 🛠️ Setup Instructions

### 1. Backend Setup
Navigate to the `backend` directory and set up the Python virtual environment:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```
Run the FastAPI server:
```bash
uvicorn app.main:app --reload
```
*The API will be available at `http://localhost:8000` (Swagger UI at `/docs`).*

### 2. Frontend Setup
Navigate to the `frontend` directory and install the Node dependencies:
```bash
cd frontend
npm install
```
Start the Vite development server:
```bash
npm run dev
```
*The React Dashboard will be available at `http://localhost:5173`.*

---

## 📅 Daily Implementation Log

### Day 1: Project Architecture & Planning
* **Objective:** Establish the project foundation and system architecture.
* **Accomplishments:**
  * Defined the overall project scope and requirements.
  * Created the system architecture document and use-case workflows.
  * Designed the frontend wireframe for the React Dashboard.
  * Initialized the Python backend, set up SQLite via SQLAlchemy, and defined the `Interaction` database model.

### Day 2: Backend Core Services
* **Objective:** Build a modular, independently testable backend AI pipeline.
* **Accomplishments:**
  * Developed the `sentiment.py` module using VADER for offline NLP scoring.
  * Developed the `speech_to_text.py` module utilizing OpenAI Whisper to transcribe `.wav` and `.mp3` files.
  * Integrated both modules into a FastAPI application exposing a `/api/upload` endpoint.
  * Configured local environment dependencies (including system `ffmpeg` for audio decoding).
  * Validated the end-to-end data pipeline using automated API testing.

### Day 3: Frontend Dashboard & Integration
* **Objective:** Build the user interface and integrate it with the backend API.
* **Accomplishments:**
  * Initialized a Vite + React application.
  * Developed a premium UI using Vanilla CSS and modern grid layouts.
  * Built interactive components: a drag-and-drop Audio Uploader, a dynamic Results Panel (with audio playback functionality), and a Database History table.
  * Integrated the frontend `fetch` API to communicate directly with the FastAPI backend.
  * Implemented a history deletion feature.
  * **Result:** A stable, end-to-end minimum viable product (MVP) ready for demonstration.

---

## 🔮 Future Work
* Integrate live microphone capture directly from the browser using the `MediaRecorder` API.
* Implement advanced analytics (e.g., aggregate sentiment trends over time).
* Containerize the application using Docker for easier deployment.
