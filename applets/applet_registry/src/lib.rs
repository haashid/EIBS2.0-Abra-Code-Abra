use serde::{Deserialize, Serialize};
use weil_macros::{constructor, mutate, query, smart_contract, WeilType};
use weil_rs::runtime::Runtime;

// Applet details stored for each applet
#[derive(Debug, Serialize, Deserialize, Clone, WeilType)]
pub struct AppletDetails {
    pub token_id: String,
    pub name: String,
    pub description: String,
    pub applet_address: String,
    pub price: u64,
    pub input_schema: String,
    pub output_schema: String,
    pub owner: String,
    pub is_active: bool,
}

trait AppletRegistry {
    fn new() -> Result<Self, String> where Self: Sized;
    async fn name(&self) -> String;
    async fn get_applet(&self, id: u32) -> Result<AppletDetails, String>;
    async fn get_all_applets(&self) -> Vec<AppletDetails>;
    async fn get_applet_count(&self) -> u32;
    async fn register_applet(
        &mut self,
        name: String,
        description: String,
        applet_address: String,
        price: u64,
        input_schema: String,
        output_schema: String,
    ) -> Result<u32, String>;
    async fn update_price(&mut self, id: u32, new_price: u64) -> bool;
    async fn toggle_active(&mut self, id: u32) -> bool;
}

#[derive(Serialize, Deserialize, WeilType)]
pub struct AppletRegistryContractState {
    contract_name: String,
    applets: Vec<AppletDetails>,
    applet_count: u32,
}

#[smart_contract]
impl AppletRegistry for AppletRegistryContractState {
    #[constructor]
    fn new() -> Result<Self, String>
    where
        Self: Sized,
    {
        Ok(AppletRegistryContractState {
            contract_name: "WeilChain Applet Registry".to_string(),
            applets: Vec::new(),
            applet_count: 0,
        })
    }

    #[query]
    async fn name(&self) -> String {
        self.contract_name.clone()
    }

    #[query]
    async fn get_applet(&self, id: u32) -> Result<AppletDetails, String> {
        if (id as usize) < self.applets.len() {
            Ok(self.applets[id as usize].clone())
        } else {
            Err("Applet not found".to_string())
        }
    }

    #[query]
    async fn get_all_applets(&self) -> Vec<AppletDetails> {
        self.applets.clone()
    }

    #[query]
    async fn get_applet_count(&self) -> u32 {
        self.applet_count
    }

    #[mutate]
    async fn register_applet(
        &mut self,
        name: String,
        description: String,
        applet_address: String,
        price: u64,
        input_schema: String,
        output_schema: String,
    ) -> Result<u32, String> {
        let sender = Runtime::sender();
        let token_id = self.applet_count.to_string();
        
        let details = AppletDetails {
            token_id: token_id.clone(),
            name,
            description,
            applet_address,
            price,
            input_schema,
            output_schema,
            owner: sender,
            is_active: true,
        };
        
        self.applets.push(details);
        let id = self.applet_count;
        self.applet_count += 1;
        
        Ok(id)
    }

    #[mutate]
    async fn update_price(&mut self, id: u32, new_price: u64) -> bool {
        let sender = Runtime::sender();
        
        if (id as usize) >= self.applets.len() {
            return false;
        }
        
        let applet = &self.applets[id as usize];
        if applet.owner != sender {
            return false;
        }
        
        self.applets[id as usize].price = new_price;
        true
    }

    #[mutate]
    async fn toggle_active(&mut self, id: u32) -> bool {
        let sender = Runtime::sender();
        
        if (id as usize) >= self.applets.len() {
            return false;
        }
        
        let applet = &self.applets[id as usize];
        if applet.owner != sender {
            return false;
        }
        
        self.applets[id as usize].is_active = !self.applets[id as usize].is_active;
        true
    }
}
