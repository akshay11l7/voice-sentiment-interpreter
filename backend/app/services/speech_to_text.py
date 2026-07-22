import whisper
import warnings
import os

# Suppress some common warnings from PyTorch/Whisper for a cleaner log
warnings.filterwarnings("ignore", message="FP16 is not supported on CPU; using FP32 instead")

print("Loading Whisper model (small) into memory... This may take a moment on first run.")
# Load the model once when the module is imported
# 'tiny' is used for speed. Can be changed to 'base' or 'small' for better accuracy.
model = whisper.load_model("small")
print("Whisper model loaded successfully.")

def transcribe_audio(file_path: str, task: str = "transcribe") -> dict:
    """
    Transcribes (or translates) an audio file at the given path using OpenAI Whisper.
    Returns the full transcription result dictionary containing text, segments, and timestamps.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Audio file not found: {file_path}")

    # Transcribe or translate the audio file
    result = model.transcribe(file_path, task=task)
    return result

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python3 speech_to_text.py <path_to_audio_file>")
        sys.exit(1)
        
    audio_file = sys.argv[1]
    print(f"Transcribing {audio_file}...")
    try:
        text = transcribe_audio(audio_file)
        print(f"\n--- Transcription Result ---\n{text}\n--------------------------")
    except Exception as e:
        print(f"Error transcribing audio: {e}")
