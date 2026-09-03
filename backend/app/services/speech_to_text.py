import whisper
import warnings
import os

# Suppress some common warnings from PyTorch/Whisper for a cleaner log
warnings.filterwarnings("ignore", message="FP16 is not supported on CPU; using FP32 instead")

import threading

_models_cache = {}
_cache_lock = threading.Lock()

def get_whisper_model(model_name: str = "small"):
    allowed_models = ["tiny", "base", "small", "medium"]
    if model_name not in allowed_models:
        model_name = "small"
        
    with _cache_lock:
        if model_name not in _models_cache:
            print(f"Loading Whisper model ({model_name}) into memory... This may take a moment on first run.")
            _models_cache[model_name] = whisper.load_model(model_name)
            print(f"Whisper model ({model_name}) loaded successfully.")
        return _models_cache[model_name]

def transcribe_audio(file_path: str, task: str = "transcribe", model_name: str = "small") -> dict:
    """
    Transcribes (or translates) an audio file at the given path using OpenAI Whisper.
    Returns the full transcription result dictionary containing text, segments, and timestamps.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Audio file not found: {file_path}")

    model_instance = get_whisper_model(model_name)
    # Transcribe or translate the audio file
    result = model_instance.transcribe(file_path, task=task)
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
