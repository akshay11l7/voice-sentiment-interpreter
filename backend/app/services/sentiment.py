from transformers import pipeline
import logging

logger = logging.getLogger(__name__)

logger.info("Loading HuggingFace Emotion Classifier (j-hartmann/emotion-english-distilroberta-base)...")
classifier = pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base")
logger.info("Emotion Classifier loaded successfully.")

# Map HuggingFace labels to our desired frontend labels
LABEL_MAP = {
    "anger": "Angry",
    "disgust": "Disgust",
    "fear": "Fear",
    "joy": "Happy",
    "neutral": "Neutral",
    "sadness": "Sad",
    "surprise": "Surprise"
}

def analyze_sentiment(text: str) -> dict:
    """
    Analyzes the emotion of a given text using a HuggingFace model.
    Returns a dictionary with the confidence score and the emotion label.
    """
    if not text or not text.strip():
        return {"score": 0.0, "label": "Neutral"}

    try:
        # Truncate text roughly to avoid max token length issues
        truncated_text = text[:1500] 
        result = classifier(truncated_text)[0]
        raw_label = result['label']
        score = result['score']
        
        return {
            "score": round(score, 4),
            "label": LABEL_MAP.get(raw_label, "Neutral")
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

