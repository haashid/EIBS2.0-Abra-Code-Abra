use serde::{Deserialize, Serialize};
use weil_macros::{constructor, mutate, query, smart_contract, WeilType};

/// Validation result
#[derive(Serialize, Deserialize, WeilType, Clone)]
pub struct ValidationResult {
    pub is_valid: bool,
    pub is_json: bool,
    pub field_count: u32,
    pub has_required_fields: bool,
    pub error_message: String,
    pub validation_id: u32,
}

/// Contract state
#[derive(Serialize, Deserialize, WeilType)]
pub struct DataValidatorState {
    validations_performed: u32,
}

trait DataValidator {
    fn new() -> Result<Self, String> where Self: Sized;
    async fn get_validation_count(&self) -> u32;
    async fn execute(&mut self, input: String) -> String;
    async fn validate_json(&mut self, data: String, required_fields: String) -> ValidationResult;
}

#[smart_contract]
impl DataValidator for DataValidatorState {
    #[constructor]
    fn new() -> Result<Self, String> where Self: Sized {
        Ok(DataValidatorState {
            validations_performed: 0,
        })
    }

    #[query]
    async fn get_validation_count(&self) -> u32 {
        self.validations_performed
    }

    #[mutate]
    async fn execute(&mut self, input: String) -> String {
        let result = self.validate_json(input, "".to_string()).await;
        serde_json::to_string(&result).unwrap_or_else(|_| "Error".to_string())
    }

    #[mutate]
    async fn validate_json(&mut self, data: String, required_fields: String) -> ValidationResult {
        self.validations_performed += 1;
        
        let parsed: Result<serde_json::Value, _> = serde_json::from_str(&data);
        
        match parsed {
            Ok(json) => {
                let field_count = if let Some(obj) = json.as_object() {
                    obj.len() as u32
                } else {
                    0
                };
                
                let required: Vec<&str> = required_fields.split(',')
                    .map(|s| s.trim())
                    .filter(|s| !s.is_empty())
                    .collect();
                
                let has_required = if let Some(obj) = json.as_object() {
                    required.iter().all(|field| obj.contains_key(*field))
                } else {
                    required.is_empty()
                };
                
                ValidationResult {
                    is_valid: has_required,
                    is_json: true,
                    field_count,
                    has_required_fields: has_required,
                    error_message: if has_required { 
                        "Valid".to_string() 
                    } else { 
                        format!("Missing required fields: {:?}", required) 
                    },
                    validation_id: self.validations_performed,
                }
            },
            Err(e) => {
                ValidationResult {
                    is_valid: false,
                    is_json: false,
                    field_count: 0,
                    has_required_fields: false,
                    error_message: format!("Invalid JSON: {}", e),
                    validation_id: self.validations_performed,
                }
            }
        }
    }
}
