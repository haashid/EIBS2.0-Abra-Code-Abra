use serde::{Deserialize, Serialize};
use weil_macros::{constructor, mutate, query, smart_contract, WeilType};

/// Result of text processing
#[derive(Serialize, Deserialize, WeilType, Clone)]
pub struct TextStats {
    pub word_count: u32,
    pub char_count: u32,
    pub line_count: u32,
    pub avg_word_length: f32,
    pub input_hash: String,
}

/// Contract state
#[derive(Serialize, Deserialize, WeilType)]
pub struct TextProcessorState {
    total_processed: u32,
}

trait TextProcessor {
    fn new() -> Result<Self, String> where Self: Sized;
    async fn get_stats(&self) -> u32;
    async fn execute(&mut self, input: String) -> String;
    async fn process_text(&mut self, text: String) -> TextStats;
}

#[smart_contract]
impl TextProcessor for TextProcessorState {
    #[constructor]
    fn new() -> Result<Self, String> where Self: Sized {
        Ok(TextProcessorState {
            total_processed: 0,
        })
    }

    #[query]
    async fn get_stats(&self) -> u32 {
        self.total_processed
    }

    #[mutate]
    async fn execute(&mut self, input: String) -> String {
        let stats = self.process_text(input).await;
        serde_json::to_string(&stats).unwrap_or_else(|_| "Error".to_string())
    }

    #[mutate]
    async fn process_text(&mut self, text: String) -> TextStats {
        self.total_processed += 1;
        
        let char_count = text.len() as u32;
        let line_count = text.lines().count() as u32;
        let words: Vec<&str> = text.split_whitespace().collect();
        let word_count = words.len() as u32;
        
        let avg_word_length = if word_count > 0 {
            words.iter().map(|w| w.len()).sum::<usize>() as f32 / word_count as f32
        } else {
            0.0
        };
        
        let input_hash = format!("{:x}", text.bytes().fold(0u64, |acc, b| acc.wrapping_add(b as u64).wrapping_mul(31)));
        
        TextStats {
            word_count,
            char_count,
            line_count,
            avg_word_length,
            input_hash,
        }
    }
}
