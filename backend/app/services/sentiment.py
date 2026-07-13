from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

analyzer = SentimentIntensityAnalyzer()

def analyze_sentiment(text: str) -> dict:
    """
    Analyzes the sentiment of a given text and returns a dictionary with the score and label.
    Score ranges from -1.0 (most negative) to +1.0 (most positive).
    """
    if not text or not text.strip():
        return {"score": 0.0, "label": "Neutral"}

    scores = analyzer.polarity_scores(text)
    compound_score = scores['compound']
    
    # Classify as Happy or Sad based on compound score
    # Usually compound >= 0.05 is positive, <= -0.05 is negative
    if compound_score >= 0.05:
        label = "Happy"
    elif compound_score <= -0.05:
        label = "Sad"
    else:
        label = "Neutral"

    return {
        "score": compound_score,
        "label": label
    }

if __name__ == "__main__":
    import sys
    print("--- Sentiment Analysis Module Test ---")
    test_strings = [
        "I am so happy and thrilled with the service!",
        "This is the worst experience I have ever had.",
        "The product is okay, nothing special."
    ]
    
    for s in test_strings:
        result = analyze_sentiment(s)
        print(f"Text: '{s}'")
        print(f"Result: {result}\n")
