use serde::{Deserialize, Serialize};
use weil_macros::{constructor, mutate, query, smart_contract, WeilType};

/// Applet record - matches WIDL definition
#[derive(Serialize, Deserialize, WeilType, Clone)]
pub struct Applet {
    pub id: u32,
    pub name: String,
    pub description: String,
    pub price: u64,
    pub owner: String,
    pub input_schema: String,
    pub output_schema: String,
    pub is_active: bool,
}

/// Contract state
#[derive(Serialize, Deserialize, WeilType)]
pub struct AppletRegistryState {
    applets: Vec<Applet>,
    next_id: u32,
}

trait AppletRegistry {
    fn new() -> Result<Self, String> where Self: Sized;
    async fn get_applet_count(&self) -> u32;
    async fn get_applet(&self, id: u32) -> Result<Applet, String>;
    async fn register_applet(&mut self, name: String, description: String, price: u64, input_schema: String, output_schema: String) -> u32;
    async fn toggle_applet_status(&mut self, id: u32);
}

#[smart_contract]
impl AppletRegistry for AppletRegistryState {
    #[constructor]
    fn new() -> Result<Self, String> where Self: Sized {
        Ok(AppletRegistryState {
            applets: Vec::new(),
            next_id: 1,
        })
    }

    #[query]
    async fn get_applet_count(&self) -> u32 {
        self.applets.len() as u32
    }

    #[query]
    async fn get_applet(&self, id: u32) -> Result<Applet, String> {
        match self.applets.iter().find(|a| a.id == id) {
            Some(a) => Ok(a.clone()),
            None => Err("Applet not found".to_string()),
        }
    }

    #[mutate]
    async fn register_applet(&mut self, name: String, description: String, price: u64, input_schema: String, output_schema: String) -> u32 {
        let applet = Applet {
            id: self.next_id,
            name,
            description,
            price,
            owner: "caller".to_string(),
            input_schema,
            output_schema,
            is_active: true,
        };

        let id = self.next_id;
        self.applets.push(applet);
        self.next_id += 1;
        id
    }

    #[mutate]
    async fn toggle_applet_status(&mut self, id: u32) {
        if let Some(applet) = self.applets.iter_mut().find(|a| a.id == id) {
            applet.is_active = !applet.is_active;
        }
    }
}
