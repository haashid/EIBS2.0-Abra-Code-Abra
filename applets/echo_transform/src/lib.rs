use serde::{Deserialize, Serialize};
use weil_macros::{constructor, mutate, query, smart_contract, WeilType};

/// Transform result
#[derive(Serialize, Deserialize, WeilType, Clone)]
pub struct TransformResult {
    pub original: String,
    pub uppercase: String,
    pub lowercase: String,
    pub reversed: String,
    pub length: u32,
    pub transform_id: u32,
}

/// Contract state
#[derive(Serialize, Deserialize, WeilType)]
pub struct EchoTransformState {
    transforms_performed: u32,
}

trait EchoTransform {
    fn new() -> Result<Self, String> where Self: Sized;
    async fn get_transform_count(&self) -> u32;
    async fn execute(&mut self, input: String) -> String;
    async fn transform(&mut self, text: String) -> TransformResult;
    async fn echo(&self, text: String) -> String;
}

#[smart_contract]
impl EchoTransform for EchoTransformState {
    #[constructor]
    fn new() -> Result<Self, String> where Self: Sized {
        Ok(EchoTransformState {
            transforms_performed: 0,
        })
    }

    #[query]
    async fn get_transform_count(&self) -> u32 {
        self.transforms_performed
    }

    #[mutate]
    async fn execute(&mut self, input: String) -> String {
        let result = self.transform(input).await;
        serde_json::to_string(&result).unwrap_or_else(|_| "Error".to_string())
    }

    #[mutate]
    async fn transform(&mut self, text: String) -> TransformResult {
        self.transforms_performed += 1;
        
        let uppercase = text.to_uppercase();
        let lowercase = text.to_lowercase();
        let reversed: String = text.chars().rev().collect();
        let length = text.len() as u32;
        
        TransformResult {
            original: text,
            uppercase,
            lowercase,
            reversed,
            length,
            transform_id: self.transforms_performed,
        }
    }
    
    #[query]
    async fn echo(&self, text: String) -> String {
        format!("Echo: {}", text)
    }
}
