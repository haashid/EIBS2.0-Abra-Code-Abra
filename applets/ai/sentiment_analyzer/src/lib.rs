use serde::{Deserialize, Serialize};
use weil_macros::{constructor, query, smart_contract, WeilType};

trait SentimentAnalyzer {
    fn new() -> Result<Self, String> where Self: Sized;
    fn analyze(&self, text: String) -> Result<SentimentResult, String>;
    fn execute(&self, input: String) -> Result<String, String>;
    fn tools(&self) -> String;
    fn prompts(&self) -> String;
}

#[derive(Serialize, Deserialize, WeilType)]
pub struct SentimentAnalyzerContractState {}

#[derive(Serialize, Deserialize)]
pub struct SentimentResult {
    pub sentiment: String,  // "positive", "negative", or "neutral"
    pub score: f64,         // -1.0 to 1.0
    pub confidence: f64,    // 0.0 to 1.0
}

#[derive(Deserialize)]
struct ExecuteInput {
    text: String,
}

#[smart_contract]
impl SentimentAnalyzer for SentimentAnalyzerContractState {
    #[constructor]
    fn new() -> Result<Self, String> {
        Ok(Self {})
    }

    #[query]
    fn analyze(&self, text: String) -> Result<SentimentResult, String> {
        // Simple sentiment analysis based on keyword matching
        // In production, this would call an AI model or use a proper NLP library
        
        let text_lower = text.to_lowercase();
        
        // Positive keywords
        let positive_words = vec![
            "good", "great", "excellent", "amazing", "wonderful", "fantastic",
            "love", "best", "perfect", "awesome", "brilliant", "outstanding",
            "happy", "joy", "delighted", "pleased", "satisfied", "beautiful"
        ];
        
        // Negative keywords
        let negative_words = vec![
            "bad", "terrible", "awful", "horrible", "worst", "hate",
            "poor", "disappointing", "useless", "waste", "disgusting",
            "sad", "angry", "frustrated", "annoyed", "upset", "disappointed"
        ];
        
        let mut positive_count = 0;
        let mut negative_count = 0;
        
        for word in positive_words {
            positive_count += text_lower.matches(word).count();
        }
        
        for word in negative_words {
            negative_count += text_lower.matches(word).count();
        }
        
        let total_sentiment_words = positive_count + negative_count;
        
        let (sentiment, score, confidence) = if total_sentiment_words == 0 {
            ("neutral".to_string(), 0.0, 0.5)
        } else {
            let pos_ratio = positive_count as f64 / total_sentiment_words as f64;
            let neg_ratio = negative_count as f64 / total_sentiment_words as f64;
            
            let score = pos_ratio - neg_ratio;
            let confidence = (total_sentiment_words as f64 / 10.0).min(1.0);
            
            let sentiment = if score > 0.2 {
                "positive"
            } else if score < -0.2 {
                "negative"
            } else {
                "neutral"
            };
            
            (sentiment.to_string(), score, confidence)
        };
        
        Ok(SentimentResult {
            sentiment,
            score,
            confidence,
        })
    }

    #[query]
    fn execute(&self, input: String) -> Result<String, String> {
        // Parse input JSON
        let parsed: ExecuteInput = serde_json::from_str(&input)
            .map_err(|e| format!("Invalid input format: {}", e))?;
        
        let result = self.analyze(parsed.text)?;
        
        serde_json::to_string(&result)
            .map_err(|e| format!("Failed to serialize result: {}", e))
    }

    #[query]
    fn tools(&self) -> String {
        r#"[
  {
    "type": "function",
    "function": {
      "name": "analyze",
      "description": "Analyzes the sentiment of text and returns positive, negative, or neutral classification",
      "parameters": {
        "type": "object",
        "properties": {
          "text": {
            "type": "string",
            "description": "The text to analyze for sentiment"
          }
        },
        "required": ["text"]
      }
    }
  }
]"#.to_string()
    }

    #[query]
    fn prompts(&self) -> String {
        r#"{
  "prompts": [
    {
      "name": "analyze_sentiment",
      "description": "Analyze the emotional tone of text",
      "arguments": [
        {
          "name": "text",
          "description": "The text to analyze",
          "required": true
        }
      ]
    }
  ]
}"#.to_string()
    }
}
