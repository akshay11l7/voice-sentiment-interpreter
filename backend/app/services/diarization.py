import os
import torch
from pyannote.audio import Pipeline
import logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# Initialize the diarization pipeline
logger.info("Initializing pyannote.audio diarization pipeline...")
hf_token = os.environ.get("HF_AUTH_TOKEN")
if not hf_token:
    logger.warning("HF_AUTH_TOKEN not found in environment variables. Diarization may fail if the model is gated.")

try:
    pipeline = Pipeline.from_pretrained(
        "pyannote/speaker-diarization-3.1",
        use_auth_token=hf_token
    )
    
    # Send pipeline to GPU if available
    if torch.cuda.is_available():
        pipeline.to(torch.device("cuda"))
        logger.info("Diarization pipeline loaded and running on CUDA.")
    else:
        logger.info("Diarization pipeline loaded and running on CPU.")
except Exception as e:
    logger.error(f"Failed to load pyannote pipeline: {e}")
    pipeline = None

def diarize_audio(file_path: str) -> list:
    """
    Runs speaker diarization on the given audio file.
    Returns a list of dictionaries with start time, end time, and speaker label.
    """
    if pipeline is None:
        logger.error("Diarization pipeline is not initialized.")
        return []
        
    try:
        diarization = pipeline(file_path)
        segments = []
        for turn, _, speaker in diarization.itertracks(yield_label=True):
            segments.append({
                "start": turn.start,
                "end": turn.end,
                "speaker": speaker
            })
        return segments
    except Exception as e:
        logger.error(f"Error during diarization: {e}", exc_info=True)
        return []
