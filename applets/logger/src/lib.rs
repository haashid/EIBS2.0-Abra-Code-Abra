use serde::{Deserialize, Serialize};
use weil_macros::{constructor, mutate, query, smart_contract, WeilType};

/// Execution log entry
#[derive(Serialize, Deserialize, WeilType, Clone)]
pub struct Execution {
    pub id: u32,
    pub user: String,
    pub applet_ids: Vec<u32>,
    pub total_price: u64,
    pub result_hash: String,
    pub timestamp: u64,
}

/// ExecutionLogger trait defining the contract interface
trait ExecutionLogger {
    fn new() -> Result<Self, String>
    where
        Self: Sized;
    async fn get_executions_by_user(&self, user: String) -> Vec<Execution>;
    async fn get_execution_by_id(&self, id: u32) -> Option<Execution>;
    async fn get_execution_count(&self) -> u32;
    async fn log_execution(
        &mut self,
        applet_ids: Vec<u32>,
        total_price: u64,
        result_hash: String,
    ) -> u32;
}

/// Contract state
#[derive(Serialize, Deserialize, WeilType)]
pub struct ExecutionLoggerState {
    executions: Vec<Execution>,
    next_id: u32,
}

#[smart_contract]
impl ExecutionLogger for ExecutionLoggerState {
    #[constructor]
    fn new() -> Result<Self, String>
    where
        Self: Sized,
    {
        Ok(ExecutionLoggerState {
            executions: Vec::new(),
            next_id: 1,
        })
    }

    /// Get all executions by a specific user
    #[query]
    async fn get_executions_by_user(&self, user: String) -> Vec<Execution> {
        self.executions
            .iter()
            .filter(|e| e.user == user)
            .cloned()
            .collect()
    }

    /// Get execution by ID
    #[query]
    async fn get_execution_by_id(&self, id: u32) -> Option<Execution> {
        self.executions.iter().find(|e| e.id == id).cloned()
    }

    /// Get total execution count
    #[query]
    async fn get_execution_count(&self) -> u32 {
        self.executions.len() as u32
    }

    /// Log a new pipeline execution
    #[mutate]
    async fn log_execution(
        &mut self,
        applet_ids: Vec<u32>,
        total_price: u64,
        result_hash: String,
    ) -> u32 {
        let execution = Execution {
            id: self.next_id,
            user: "caller".to_string(), // TODO: Get actual caller from runtime
            applet_ids,
            total_price,
            result_hash,
            timestamp: 0, // TODO: Get actual timestamp from runtime
        };

        let id = self.next_id;
        self.executions.push(execution);
        self.next_id += 1;
        id
    }
}
