use serde::{Deserialize, Serialize};
use weil_macros::{constructor, query, smart_contract, WeilType};
use weil_rs::http::{HttpClient, HttpMethod};
use weil_rs::config::Secrets;

trait TextSummarizer {
    fn new() -> Result<Self, String> where Self: Sized;
    async fn summarize(&self, text: String) -> Result<String, String>;
    async fn execute(&self, input: String) -> Result<String, String>;
    fn tools(&self) -> String;
    fn prompts(&self) -> String;
}

#[derive(Serialize, Deserialize, WeilType)]
pub struct TextSummarizerContractState {
    // Config loaded from secrets
}

// OpenAI API request/response structures
#[derive(Serialize)]
struct OpenAIRequest {
    model: String,
    messages: Vec<Message>,
    max_tokens: u32,
}

#[derive(Serialize)]
struct Message {
    role: String,
    content: String,
}

#[derive(Deserialize)]
struct OpenAIResponse {
    choices: Vec<Choice>,
}

#[derive(Deserialize)]
struct Choice {
    message: ResponseMessage,
}

#[derive(Deserialize)]
struct ResponseMessage {
    content: String,
}

// Input structure for execute
#[derive(Deserialize)]
struct ExecuteInput {
    text: String,
}

#[smart_contract]
impl TextSummarizer for TextSummarizerContractState {
    #[constructor]
    fn new() -> Result<Self, String> {
        Ok(Self {})
    }

    #[query]
    async fn summarize(&self, text: String) -> Result<String, String> {
        // Get API key from secrets (stored in config.yaml during deploy)
        let api_key = Secrets::get("OPENAI_API_KEY")
            .ok_or("OpenAI API key not configured")?;

        let request = OpenAIRequest {
            model: "gpt-3.5-turbo".to_string(),
            messages: vec![
                Message {
                    role: "system".to_string(),
                    content: "You are a helpful assistant that summarizes text concisely. Provide a clear, brief summary.".to_string(),
                },
                Message {
                    role: "user".to_string(),
                    content: format!("Please summarize the following text:\n\n{}", text),
                },
            ],
            max_tokens: 500,
        };

        let body = serde_json::to_string(&request)
            .map_err(|e| format!("Failed to serialize request: {}", e))?;

        let response = HttpClient::request("https://api.openai.com/v1/chat/completions", HttpMethod::Post)
            .header("Content-Type", "application/json")
            .header("Authorization", &format!("Bearer {}", api_key))
            .body(&body)
            .send()
            .map_err(|e| format!("HTTP error: {}", e))?;

        if response.status() >= 200 && response.status() < 300 {
            let response_body: OpenAIResponse = serde_json::from_str(&response.text())
                .map_err(|e| format!("Failed to parse response: {}", e))?;

            if let Some(choice) = response_body.choices.first() {
                Ok(choice.message.content.clone())
            } else {
                Err("No response from AI".to_string())
            }
        } else {
            Err(format!("API error: HTTP {}", response.status()))
        }
    }

    #[query]
    async fn execute(&self, input: String) -> Result<String, String> {
        // Parse input JSON
        let parsed: ExecuteInput = serde_json::from_str(&input)
            .map_err(|e| format!("Invalid input format: {}", e))?;
        
        self.summarize(parsed.text).await
    }

    #[query]
    fn tools(&self) -> String {
        r#"[
  {
    "type": "function",
    "function": {
      "name": "summarize",
      "description": "Summarizes text into a concise version",
      "parameters": {
        "type": "object",
        "properties": {
          "text": {
            "type": "string",
            "description": "The text to summarize"
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
      "name": "summarize_document",
      "description": "Summarize a document or article",
      "arguments": [
        {
          "name": "text",
          "description": "The document text to summarize",
          "required": true
        }
      ]
    }
  ]
}"#.to_string()
    }
}
