# Sentiment Analysis & Client Satisfaction (CSAT) Calculation Guide

This guide explains how **AudioPro** calculates segment-level emotions, overall conversation sentiment, individual speaker average scores, and the Customer Satisfaction Score (CSAT).

---

## 1. Core Sentiment Mapping

The system uses a HuggingFace emotion classifier (`j-hartmann/emotion-english-distilroberta-base`) to predict emotions for individual text segments. To calculate overall statistics, each emotion label is assigned a **signed multiplier value** reflecting its positive or negative impact:

| Emotion Label | Multiplier Value | Impact |
| :--- | :--- | :--- |
| **Happy** | `+1.0` | Strongly Positive |
| **Surprise** | `+0.5` | Slightly Positive |
| **Neutral** | `0.0` | Neutral / No Impact |
| **Fear** | `-0.8` | Moderately Negative |
| **Disgust** | `-0.8` | Moderately Negative |
| **Sad** | `-1.0` | Strongly Negative |
| **Angry** | `-1.0` | Strongly Negative |

---

## 2. Customer Satisfaction (CSAT) Formula

The CSAT score translates the average signed sentiment score (which ranges from `-1.0` to `+1.0`) into a customer-friendly rating scale from **`1.0` to `10.0`**:

$$\text{CSAT} = (\text{Average Signed Score} + 1.0) \times 4.5 + 1.0$$

*   **Minimum Score (1.0 / 10)**: Achieved if the average signed sentiment is `-1.0` (all segments are purely angry or sad with $100\%$ confidence).
*   **Neutral Baseline (5.5 / 10)**: Achieved if the average signed sentiment is `0.0` (all segments are purely neutral).
*   **Maximum Score (10.0 / 10)**: Achieved if the average signed sentiment is `+1.0` (all segments are purely happy with $100\%$ confidence).

---

## 3. Scenario A: Single Speaker (e.g. Monologue / Voice Note)

When there is only one speaker (or if speaker diarization is skipped), all detected segments belong to the same person.

### Example Walkthrough:
Suppose a user uploads a 3-segment audio note:
1.  **Segment 1**: *"I am very happy with the service today."* 
    *   **Emotion**: `Happy` (Confidence Score: `0.90`)
    *   **Signed Score**: `0.90 * (+1.0)` = **`+0.90`**
2.  **Segment 2**: *"I had a small question about the package details."*
    *   **Emotion**: `Neutral` (Confidence Score: `0.70`)
    *   **Signed Score**: `0.70 * (0.0)` = **`0.00`**
3.  **Segment 3**: *"But it was resolved quickly, thanks."*
    *   **Emotion**: `Happy` (Confidence Score: `0.80`)
    *   **Signed Score**: `0.80 * (+1.0)` = **`+0.80`**

### Step-by-Step Calculations:
*   **Average Signed Score**:
    $$\text{Average} = \frac{+0.90 + 0.00 + 0.80}{3} = \frac{1.70}{3} \approx \mathbf{0.567}$$
*   **Overall Sentiment Label**: Since `0.567 > +0.15`, the overall classification is **`Happy`**.
*   **Overall Score**: `abs(0.567)` = **`0.567`**
*   **CSAT Calculation**:
    $$\text{CSAT} = (0.567 + 1.0) \times 4.5 + 1.0 = (1.567 \times 4.5) + 1.0 = 7.05 + 1.0 = \mathbf{8.1\ /\ 10}$$

---

## 4. Scenario B: Multiple Speakers (e.g. Customer Support Call)

When speaker diarization is active, the system aligns audio timeframes to separate speaker turns (e.g., `Speaker 1` and `Speaker 2`).

### Example Walkthrough (Based on your audio):
An agent (`Speaker 1`) talks with an upset customer (`Speaker 2`):
1.  **Segment 1** (`Speaker 1`): *"Hello, good morning, thank you for holding this strange package..."*
    *   **Emotion**: `Neutral` (Confidence: `0.42`)
    *   **Signed Score**: `0.42 * 0.0` = **`0.00`**
2.  **Segment 2** (`Speaker 2`): *"I am very upset. I have been waiting on the line..."*
    *   **Emotion**: `Angry` (Confidence: `0.67`)
    *   **Signed Score**: `0.67 * (-1.0)` = **`-0.67`**
3.  **Segment 3** (`Speaker 2`): *"Yeah, hello hello. Excuse me, I can't hear you..."*
    *   **Emotion**: `Neutral` (Confidence: `0.81`)
    *   **Signed Score**: `0.81 * 0.0` = **`0.00`**

### Step-by-Step Calculations:

#### 1. Individual Speaker Averages
Individual speaker scores are calculated by averaging the raw confidence scores of their respective segments.
*   **Speaker 1 Average**: `0.42 / 1 segment` = **`0.42`** (Emotion: `Neutral`)
*   **Speaker 2 Average**: `(0.67 + 0.81) / 2 segments` = **`0.74`** (Emotion: `Angry`, because the average negative signed score for Speaker 2 is `-0.67 / 2 = -0.335`, which is $< -0.15$)

#### 2. Conversation Overall Metrics (Aggregating all segments)
*   **Average Signed Score**:
    $$\text{Average} = \frac{0.00 + (-0.67) + 0.00}{3} = \frac{-0.67}{3} \approx \mathbf{-0.223}$$
*   **Overall Sentiment Label**: Since `-0.223 < -0.15`, the overall classification is negative. The dominant negative emotion among the segments is **`Angry`**.
*   **Overall Score**: `abs(-0.223)` = **`0.223`**
*   **CSAT Calculation**:
    $$\text{CSAT} = (-0.223 + 1.0) \times 4.5 + 1.0 = (0.777 \times 4.5) + 1.0 = 3.50 + 1.0 = \mathbf{4.5\ /\ 10}$$
