# Use Cases

## Use Case 1: Live Voice Recording & Analysis
**Actor:** Customer Service Agent / Manager
**Goal:** Record a live customer interaction and immediately analyze sentiment.
**Flow:**
1. User clicks "Record" on the dashboard.
2. User speaks into the microphone (simulating a customer or recording one).
3. User clicks "Stop".
4. Application automatically uploads the recording to the backend.
5. Backend processes the audio, returning the transcription and a "Happy" or "Sad" label.
6. The dashboard displays the result.

## Use Case 2: Audio File Upload
**Actor:** QA Manager
**Goal:** Analyze a pre-recorded call audio file (.wav, .mp3).
**Flow:**
1. User drags and drops an audio file into the upload zone on the dashboard.
2. Application uploads the file to the backend.
3. Backend transcribes the file and performs sentiment analysis.
4. The dashboard displays the transcription, sentiment score, and label.

## Use Case 3: View Historical Interactions
**Actor:** Manager / Data Analyst
**Goal:** Review past interactions and overall sentiment trends.
**Flow:**
1. User accesses the dashboard.
2. The application requests `/api/interactions` from the backend.
3. Backend retrieves historical records from the SQLite database.
4. Dashboard populates a list or table showing previous recordings, their transcripts, and their sentiment labels.
