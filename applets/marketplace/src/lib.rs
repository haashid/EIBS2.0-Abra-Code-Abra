use serde::{Deserialize, Serialize};
use weil_macros::{constructor, mutate, query, smart_contract, WeilType};
use weil_rs::runtime::Runtime;

// Execution result returned to user
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ExecutionResult {
    pub success: bool,
    pub output: String,
    pub tokens_spent: u64,
}

// Listed applet info (mirrors AppletDetails)
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ListedApplet {
    pub token_id: String,
    pub name: String,
    pub description: String,
    pub applet_address: String,
    pub price: u64,
    pub input_schema: String,
    pub output_schema: String,
    pub owner: String,
}

trait Marketplace {
    fn new() -> Result<Self, String> where Self: Sized;
    async fn get_token_contract(&self) -> String;
    async fn get_registry_contract(&self) -> String;
    async fn get_all_listed_applets(&self) -> Vec<ListedApplet>;
    async fn get_applet_price(&self, applet_id: String) -> Result<u64, String>;
    async fn get_total_executions(&self) -> u64;
    async fn set_token_contract(&mut self, address: String);
    async fn set_registry_contract(&mut self, address: String);
    async fn execute_applet(&mut self, applet_id: String, input: String) -> Result<ExecutionResult, String>;
    async fn execute_pipeline(&mut self, applet_ids: Vec<String>, initial_input: String) -> Result<ExecutionResult, String>;
}

#[derive(Serialize, Deserialize, WeilType)]
pub struct MarketplaceContractState {
    owner: String,
    token_contract: String,
    registry_contract: String,
    total_executions: u64,
}

#[smart_contract]
impl Marketplace for MarketplaceContractState {
    #[constructor]
    fn new() -> Result<Self, String>
    where
        Self: Sized,
    {
        let sender = Runtime::sender();
        Ok(MarketplaceContractState {
            owner: sender,
            token_contract: String::new(),
            registry_contract: String::new(),
            total_executions: 0,
        })
    }

    #[query]
    async fn get_token_contract(&self) -> String {
        self.token_contract.clone()
    }

    #[query]
    async fn get_registry_contract(&self) -> String {
        self.registry_contract.clone()
    }

    #[query]
    async fn get_all_listed_applets(&self) -> Vec<ListedApplet> {
        if self.registry_contract.is_empty() {
            return Vec::new();
        }

        // Cross-contract call to AppletRegistry.get_all_applets()
        #[derive(Deserialize)]
        struct AppletDetails {
            name: String,
            description: String,
            applet_address: String,
            price: u64,
            input_schema: String,
            output_schema: String,
            owner: String,
        }

        let result: Result<Vec<AppletDetails>, _> = Runtime::call_contract(
            self.registry_contract.clone(),
            "get_all_applets".to_string(),
            None,
        );

        match result {
            Ok(applets) => applets
                .into_iter()
                .enumerate()
                .map(|(i, a)| ListedApplet {
                    token_id: i.to_string(),
                    name: a.name,
                    description: a.description,
                    applet_address: a.applet_address,
                    price: a.price,
                    input_schema: a.input_schema,
                    output_schema: a.output_schema,
                    owner: a.owner,
                })
                .collect(),
            Err(_) => Vec::new(),
        }
    }

    #[query]
    async fn get_applet_price(&self, applet_id: String) -> Result<u64, String> {
        if self.registry_contract.is_empty() {
            return Err("Registry not configured".to_string());
        }

        #[derive(Serialize)]
        struct Args {
            token_id: String,
        }

        #[derive(Deserialize)]
        struct AppletDetails {
            price: u64,
        }

        let args = serde_json::to_string(&Args { token_id: applet_id })
            .map_err(|e| e.to_string())?;

        let result: Result<AppletDetails, _> = Runtime::call_contract(
            self.registry_contract.clone(),
            "details".to_string(),
            Some(args),
        );

        match result {
            Ok(details) => Ok(details.price),
            Err(e) => Err(format!("Failed to get price: {:?}", e)),
        }
    }

    #[query]
    async fn get_total_executions(&self) -> u64 {
        self.total_executions
    }

    #[mutate]
    async fn set_token_contract(&mut self, address: String) {
        let sender = Runtime::sender();
        if sender == self.owner {
            self.token_contract = address;
        }
    }

    #[mutate]
    async fn set_registry_contract(&mut self, address: String) {
        let sender = Runtime::sender();
        if sender == self.owner {
            self.registry_contract = address;
        }
    }

    #[mutate]
    async fn execute_applet(&mut self, applet_id: String, input: String) -> Result<ExecutionResult, String> {
        let sender = Runtime::sender();

        if self.registry_contract.is_empty() || self.token_contract.is_empty() {
            return Err("Contracts not configured".to_string());
        }

        // 1. Get applet details from registry
        #[derive(Serialize)]
        struct DetailsArgs {
            token_id: String,
        }

        #[derive(Deserialize)]
        struct AppletDetails {
            applet_address: String,
            price: u64,
            owner: String,
        }

        let args = serde_json::to_string(&DetailsArgs { token_id: applet_id.clone() })
            .map_err(|e| e.to_string())?;

        let details: AppletDetails = Runtime::call_contract(
            self.registry_contract.clone(),
            "details".to_string(),
            Some(args),
        ).map_err(|e| format!("Failed to get applet details: {:?}", e))?;

        // 2. Transfer payment from user to applet owner
        #[derive(Serialize)]
        struct TransferArgs {
            from_addr: String,
            to_addr: String,
            amount: u64,
        }

        let transfer_args = serde_json::to_string(&TransferArgs {
            from_addr: sender.clone(),
            to_addr: details.owner.clone(),
            amount: details.price,
        }).map_err(|e| e.to_string())?;

        let _: Result<(), _> = Runtime::call_contract(
            self.token_contract.clone(),
            "transfer_from".to_string(),
            Some(transfer_args),
        ).map_err(|e| format!("Payment failed: {:?}", e))?;

        // 3. Execute the applet
        #[derive(Serialize)]
        struct ExecuteArgs {
            input: String,
        }

        let exec_args = serde_json::to_string(&ExecuteArgs { input: input.clone() })
            .map_err(|e| e.to_string())?;

        let output: Result<String, _> = Runtime::call_contract(
            details.applet_address.clone(),
            "execute".to_string(),
            Some(exec_args),
        );

        self.total_executions += 1;

        match output {
            Ok(result) => Ok(ExecutionResult {
                success: true,
                output: result,
                tokens_spent: details.price,
            }),
            Err(e) => Ok(ExecutionResult {
                success: false,
                output: format!("Execution failed: {:?}", e),
                tokens_spent: details.price, // Still charged
            }),
        }
    }

    #[mutate]
    async fn execute_pipeline(&mut self, applet_ids: Vec<String>, initial_input: String) -> Result<ExecutionResult, String> {
        let mut current_input = initial_input;
        let mut total_spent: u64 = 0;

        for applet_id in applet_ids {
            match self.execute_applet(applet_id, current_input.clone()).await {
                Ok(result) => {
                    total_spent += result.tokens_spent;
                    if result.success {
                        current_input = result.output;
                    } else {
                        return Ok(ExecutionResult {
                            success: false,
                            output: result.output,
                            tokens_spent: total_spent,
                        });
                    }
                }
                Err(e) => {
                    return Err(format!("Pipeline failed: {}", e));
                }
            }
        }

        Ok(ExecutionResult {
            success: true,
            output: current_input,
            tokens_spent: total_spent,
        })
    }
}
