use serde::{Deserialize, Serialize};
use weil_contracts::non_fungible::{NonFungibleToken, Token};
use weil_macros::{constructor, mutate, query, smart_contract, WeilType};
use weil_rs::runtime::Runtime;
use std::collections::HashMap;

// Applet details stored in each NFT
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppletDetails {
    pub name: String,
    pub description: String,
    pub applet_address: String,
    pub price: u64,
    pub input_schema: String,
    pub output_schema: String,
    pub owner: String,
}

trait AppletRegistry {
    fn new() -> Result<Self, String> where Self: Sized;
    async fn name(&self) -> String;
    async fn balance_of(&self, addr: String) -> u32;
    async fn owner_of(&self, token_id: String) -> Result<String, String>;
    async fn details(&self, token_id: String) -> Result<AppletDetails, String>;
    async fn get_all_applets(&self) -> Vec<AppletDetails>;
    async fn get_applet_count(&self) -> u32;
    async fn approve(&mut self, spender: String, token_id: String) -> Result<(), String>;
    async fn set_approve_for_all(&mut self, spender: String, approval: bool);
    async fn transfer(&mut self, to_addr: String, token_id: String) -> Result<(), String>;
    async fn transfer_from(&mut self, from_addr: String, to_addr: String, token_id: String) -> Result<(), String>;
    async fn get_approved(&self, token_id: String) -> Result<Vec<String>, String>;
    async fn is_approved_for_all(&self, owner: String, spender: String) -> bool;
    async fn register_applet(
        &mut self,
        name: String,
        description: String,
        applet_address: String,
        price: u64,
        input_schema: String,
        output_schema: String,
    ) -> Result<String, String>;
    async fn update_price(&mut self, token_id: String, new_price: u64) -> Result<(), String>;
}

#[derive(Serialize, Deserialize, WeilType)]
pub struct AppletRegistryContractState {
    inner: NonFungibleToken,
    applet_count: u32,
    applet_metadata: HashMap<String, AppletDetails>,
    all_token_ids: Vec<String>,
}

#[smart_contract]
impl AppletRegistry for AppletRegistryContractState {
    #[constructor]
    fn new() -> Result<Self, String>
    where
        Self: Sized,
    {
        Ok(AppletRegistryContractState {
            inner: NonFungibleToken::new("AppletRegistry".to_string()),
            applet_count: 0,
            applet_metadata: HashMap::new(),
            all_token_ids: Vec::new(),
        })
    }

    #[query]
    async fn name(&self) -> String {
        self.inner.name()
    }

    #[query]
    async fn balance_of(&self, addr: String) -> u32 {
        self.inner.balance_of(addr) as u32
    }

    #[query]
    async fn owner_of(&self, token_id: String) -> Result<String, String> {
        self.inner.owner_of(token_id).map_err(|err| err.to_string())
    }

    #[query]
    async fn details(&self, token_id: String) -> Result<AppletDetails, String> {
        match self.applet_metadata.get(&token_id) {
            Some(details) => Ok(details.clone()),
            None => Err("Applet not found".to_string()),
        }
    }

    #[query]
    async fn get_all_applets(&self) -> Vec<AppletDetails> {
        self.applet_metadata.values().cloned().collect()
    }

    #[query]
    async fn get_applet_count(&self) -> u32 {
        self.applet_count
    }

    #[mutate]
    async fn approve(&mut self, spender: String, token_id: String) -> Result<(), String> {
        self.inner.approve(spender, token_id).map_err(|err| err.to_string())
    }

    #[mutate]
    async fn set_approve_for_all(&mut self, spender: String, approval: bool) {
        self.inner.set_approve_for_all(spender, approval)
    }

    #[mutate]
    async fn transfer(&mut self, to_addr: String, token_id: String) -> Result<(), String> {
        if let Some(details) = self.applet_metadata.get_mut(&token_id) {
            details.owner = to_addr.clone();
        }
        self.inner.transfer(to_addr, token_id).map_err(|err| err.to_string())
    }

    #[mutate]
    async fn transfer_from(&mut self, _from_addr: String, to_addr: String, token_id: String) -> Result<(), String> {
        if let Some(details) = self.applet_metadata.get_mut(&token_id) {
            details.owner = to_addr.clone();
        }
        self.inner.transfer(to_addr, token_id).map_err(|err| err.to_string())
    }

    #[query]
    async fn get_approved(&self, token_id: String) -> Result<Vec<String>, String> {
        self.inner.get_approved(token_id).map_err(|err| err.to_string())
    }

    #[query]
    async fn is_approved_for_all(&self, owner: String, spender: String) -> bool {
        self.inner.is_approved_for_all(owner, spender)
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
    ) -> Result<String, String> {
        let sender = Runtime::sender();
        let token_id = self.applet_count.to_string();
        
        let details = AppletDetails {
            name: name.clone(),
            description: description.clone(),
            applet_address: applet_address.clone(),
            price,
            input_schema,
            output_schema,
            owner: sender,
        };
        
        let token = Token::new(
            name.clone(),
            format!("Applet #{}", token_id),
            description,
            applet_address,
        );
        
        self.inner.mint(token_id.clone(), token).map_err(|err| err.to_string())?;
        self.applet_metadata.insert(token_id.clone(), details);
        self.all_token_ids.push(token_id.clone());
        self.applet_count += 1;
        
        Ok(token_id)
    }

    #[mutate]
    async fn update_price(&mut self, token_id: String, new_price: u64) -> Result<(), String> {
        let sender = Runtime::sender();
        let owner = self.inner.owner_of(token_id.clone()).map_err(|err| err.to_string())?;
        
        if owner != sender {
            return Err("Only owner can update price".to_string());
        }
        
        if let Some(details) = self.applet_metadata.get_mut(&token_id) {
            details.price = new_price;
            Ok(())
        } else {
            Err("Applet not found".to_string())
        }
    }
}
