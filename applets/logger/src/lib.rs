use serde::{Deserialize, Serialize};
use weil_macros::{constructor, mutate, query, smart_contract, WeilType};

/// Execution record - matches WIDL definition
#[derive(Serialize, Deserialize, WeilType, Clone)]
pub struct Execution {
    pub id: u32,
    pub user: String,
    pub applet_ids_json: String,
    pub total_price: u64,
    pub result_hash: String,
    pub timestamp: u64,
}

/// Contract state
#[derive(Serialize, Deserialize, WeilType)]
pub struct ExecutionLoggerState {
    executions: Vec<Execution>,
    next_id: u32,
}

trait ExecutionLogger {
    fn new() -> Result<Self, String> where Self: Sized;
    async fn get_execution_count(&self) -> u32;
    async fn get_execution(&self, id: u32) -> Result<Execution, String>;
    async fn get_user_execution_count(&self, user: String) -> u32;
    async fn log_execution(&mut self, applet_ids_json: String, total_price: u64, result_hash: String) -> u32;
}

#[smart_contract]
impl ExecutionLogger for ExecutionLoggerState {
    #[constructor]
    fn new() -> Result<Self, String> where Self: Sized {
        Ok(ExecutionLoggerState {
            executions: Vec::new(),
            next_id: 1,
        })
    }

    #[query]
    async fn get_execution_count(&self) -> u32 {
        self.executions.len() as u32
    }

    #[query]
    async fn get_execution(&self, id: u32) -> Result<Execution, String> {
        match self.executions.iter().find(|e| e.id == id) {
            Some(e) => Ok(e.clone()),
            None => Err("Execution not found".to_string()),
        }
    }

    #[query]
    async fn get_user_execution_count(&self, user: String) -> u32 {
        self.executions.iter().filter(|e| e.user == user).count() as u32
    }

    #[mutate]
    async fn log_execution(&mut self, applet_ids_json: String, total_price: u64, result_hash: String) -> u32 {
        let execution = Execution {
            id: self.next_id,
            user: "caller".to_string(),
            applet_ids_json,
            total_price,
            result_hash,
            timestamp: 0,
        };

        let id = self.next_id;
        self.executions.push(execution);
        self.next_id += 1;
        id
    }
}
