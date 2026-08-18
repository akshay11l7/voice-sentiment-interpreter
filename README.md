# Voice-to-Text and Sentiment Interpreter 🎙️

An AI-powered, full-stack web application designed for customer service analytics. This platform allows users to upload customer interaction audio files, instantly transcribes them using OpenAI Whisper, separates speakers using PyAnnote diarization, and analyzes conversational emotion using a HuggingFace RoBERTa model.

## 🚀 Tech Stack
* **Frontend**: React, Vite, Vanilla CSS, Nginx
* **Backend**: Python, FastAPI
* **Database**: PostgreSQL (Production) / SQLite (Local Dev), SQLAlchemy
* **AI & NLP**: OpenAI Whisper, HuggingFace `distilroberta-base` (Emotion), PyAnnote Audio (Diarization)
* **DevOps**: Docker, Docker Compose, pgAdmin

---

## 🛠️ Production Setup (Docker)

The application is fully containerized for easy deployment and scalability.

### Prerequisites
- Install [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/).
- Obtain a HuggingFace Access Token (to download the PyAnnote models).

### Installation
1. Clone the repository and navigate to the project root.
2. In the `backend` directory, create a `.env` file and add your HuggingFace token:
   ```env
   HF_AUTH_TOKEN=your_huggingface_token_here
   ```
3. Run the following command from the project root to build and start all services:
   ```bash
   docker-compose up --build -d
   ```

*Note: On the first boot, the backend container will download ~500MB of AI models. The database tables will not be created until this download finishes (typically 5-8 minutes depending on connection speed).*

### Accessing the Services
Once all containers are successfully running, you can access the following services in your browser:
* **Web Application (React + Nginx):** `http://localhost`
* **FastAPI Backend (Swagger API Docs):** `http://localhost:8000/docs`
* **pgAdmin Database Dashboard:** `http://localhost/pgadmin` (or `http://localhost:5050` if direct port access is enabled)
  * **Login Email:** `admin@admin.com`
  * **Password:** `admin`
  * *Note: For access from a company laptop, use `http://10.20.41.36/pgadmin/` (if on the same LAN) or set up an SSH tunnel: `ssh -L 8080:localhost:80 pablo@10.20.41.36` and navigate to `http://localhost:8080/pgadmin/`.*

---

## 💻 Local Development Setup (Without Docker)

If you wish to develop without Docker or test the frontend rapidly, you can run the services locally. The backend will automatically fall back to an SQLite database if the PostgreSQL `DATABASE_URL` environment variable is not found.

### Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
*Note: You must have `ffmpeg` installed on your host system for audio processing.*

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 📅 Implementation Roadmap

### Phase 1: MVP Core Pipeline
* Built the React frontend and FastAPI backend framework.
* Integrated OpenAI Whisper for transcription and basic VADER sentiment analysis.
* Established local SQLite database structure.

### Phase 2: AI Enhancements & Authentication
* Implemented speaker diarization using PyAnnote (distinguishing between Agent/Customer).
* Upgraded sentiment analysis to HuggingFace Emotion RoBERTa for deep contextual understanding.
* Added full user authentication (JWT tokens) and data silos.
* Redesigned the UI with Dark Mode, Glassmorphism, and micro-animations.

### Phase 3: Production Readiness (Current)
* Fully containerized the stack using Docker and Docker Compose.
* Migrated from ephemeral SQLite to a persistent PostgreSQL database using Docker Volumes.
* Integrated pgAdmin for professional database administration.
* Optimized build sizes by targeting CPU-only PyTorch and pinned dependencies to resolve security/compatibility conflicts.
