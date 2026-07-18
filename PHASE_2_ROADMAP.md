# Phase 2 Roadmap & Context

## Project Context
I am building a **Voice-to-Text and Sentiment Interpreter**. 
- **Tech Stack:** FastAPI (Backend), React/Vite with Vanilla CSS (Frontend), SQLite (Database), OpenAI Whisper (Speech-to-Text), and VADER (Sentiment Analysis).
- **Current State:** Phase 1 is fully complete. The MVP successfully allows users to upload `.wav`/`.mp3` files or record live audio via the browser microphone. The backend transcribes the audio and scores it (Happy, Sad, Neutral). The React UI displays the results and historical uploads. The code is version-controlled via Git on the `develop` branch.

## Immediate Tasks (Manager Feedback)
Before starting the advanced AI features, I need to implement the following immediate feedback from my manager:
1. **Update UI with User Guidelines:** Add a section to the frontend explaining supported files (WAV, MP3, WEBM) and languages.
2. **Graceful Error Handling:** Add validation to prevent users from uploading unsupported files (like PDFs or images), log errors cleanly in the backend, and display user-friendly error messages (toast/pop-ups) in the UI instead of network crashes.

## Phase 2 Features (Advanced AI Roadmap)
Once the immediate tasks are done, we will implement these features in strategic order:

1. **Historical Text Viewing:** Update the UI so users can click on a past interaction in the Upload History table to view the full transcribed text.
2. **Multi-Language & Translation:** Add a UI dropdown to utilize Whisper's native translation capabilities, allowing users to transcribe non-English audio and optionally translate it to English.
3. **Granular Emotion Detection:** Replace the basic VADER model with a HuggingFace emotion classifier (e.g., RoBERTa) to detect emotions like Angry, Frustrated, and Excited.
4. **Audio Preprocessing (Noise Reduction):** Implement a Python library (like `noisereduce`) in the backend to clean up background noise before transcription.
5. **Speaker Diarization & Analytics:** Integrate `pyannote.audio` to recognize multiple voices in an audio file (e.g., Agent vs. Client) and calculate average conversation sentiment and a "Client Satisfaction" metric.
