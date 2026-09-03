from transformers import pipeline
import logging

import threading

logger = logging.getLogger(__name__)

_classifiers_cache = {}
_cache_lock = threading.Lock()

DEFAULT_SENTIMENT_MODEL = "j-hartmann/emotion-english-distilroberta-base"

def get_sentiment_classifier(model_name: str = DEFAULT_SENTIMENT_MODEL):
    if not model_name:
        model_name = DEFAULT_SENTIMENT_MODEL
        
    with _cache_lock:
        if model_name not in _classifiers_cache:
            logger.info(f"Loading HuggingFace Classifier ({model_name})...")
            _classifiers_cache[model_name] = pipeline("text-classification", model=model_name)
            logger.info(f"Classifier ({model_name}) loaded successfully.")
        return _classifiers_cache[model_name]

# Comprehensive map to normalize HuggingFace emotion & sentiment model labels
LABEL_MAP = {
    # 7-class emotion model
    "anger": "Angry",
    "disgust": "Disgust",
    "fear": "Fear",
    "joy": "Happy",
    "neutral": "Neutral",
    "sadness": "Sad",
    "surprise": "Surprise",
    
    # Standard 3-class sentiment models (positive / neutral / negative)
    "positive": "Happy",
    "negative": "Sad",
    "pos": "Happy",
    "neg": "Sad",
    "neu": "Neutral",
    
    # Additional common HF label variants
    "label_0": "Sad",
    "label_1": "Neutral",
    "label_2": "Happy"
}

def analyze_sentiment(text: str, model_name: str = DEFAULT_SENTIMENT_MODEL) -> dict:
    """
    Analyzes the emotion or sentiment of a given text using a HuggingFace model.
    Returns a dictionary with the confidence score and the emotion label.
    """
    if not text or not text.strip():
        return {"score": 0.0, "label": "Neutral"}

    try:
        classifier_instance = get_sentiment_classifier(model_name)
        # Truncate text roughly to avoid max token length issues
        truncated_text = text[:1500] 
        result = classifier_instance(truncated_text)[0]
        raw_label = str(result['label']).lower()
        score = result['score']
        
        mapped_label = LABEL_MAP.get(raw_label, raw_label.capitalize())
        
        return {
            "score": round(score, 4),
            "label": mapped_label
        }
    except Exception as e:
        logger.error(f"Error during sentiment analysis: {e}", exc_info=True)
        return {"score": 0.0, "label": "Neutral"}

if __name__ == "__main__":
    import sys
    print("--- Emotion Analysis Module Test ---")
    test_strings = [
        "I am so happy and thrilled with the service!",
        "This is the worst experience I have ever had.",
        "The product is okay, nothing special.",
        "I can't believe you did this to me, I'm furious!"
    ]
    
    for s in test_strings:
        result = analyze_sentiment(s)
        print(f"Text: '{s}'")
        print(f"Result: {result}\n")

