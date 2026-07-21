import librosa
import soundfile as sf
import noisereduce as nr
import logging

logger = logging.getLogger(__name__)

def reduce_noise(input_path: str, output_path: str):
    """
    Reads an audio file, applies noise reduction, and saves it to the output path.
    """
    logger.info(f"Applying noise reduction to {input_path}")
    try:
        # Load audio data. sr=None preserves original sample rate
        y, sr = librosa.load(input_path, sr=None)
        
        # Apply noise reduction
        reduced_noise = nr.reduce_noise(y=y, sr=sr)
        
        # Save output
        sf.write(output_path, reduced_noise, sr)
        logger.info(f"Noise reduction complete. Saved to {output_path}")
    except Exception as e:
        logger.error(f"Error during noise reduction: {e}", exc_info=True)
        raise e
