use serde::{Deserialize, Serialize};
use weil_macros::{WeilType, constructor, query, smart_contract};
use weil_rs::webserver::WebServer;

/// Trait for the NexusFrontend webserver contract.
/// The @webserver decorator auto-generates file upload/serving methods.
trait NexusFrontend {
    fn new() -> Result<Self, String> where Self: Sized;
    fn name(&self) -> String;
}

/// Contract state for NexusFrontend.
/// Includes WebServer instance for static asset hosting.
#[derive(Serialize, Deserialize, WeilType)]
pub struct NexusFrontendContractState {
    server: WebServer,
}

#[smart_contract]
impl NexusFrontend for NexusFrontendContractState {
    #[constructor]
    fn new() -> Result<Self, String> {
        Ok(NexusFrontendContractState {
            server: WebServer::new(),
        })
    }

    #[query]
    fn name(&self) -> String {
        "WeilChain Nexus Marketplace".to_string()
    }
}

// The @webserver decorator in WIDL auto-generates these methods:
// - start_file_upload(path, total_chunks) -> Result<(), String>
// - add_path_content(path, chunk, index) -> Result<(), String>
// - finish_upload(path, size_bytes) -> Result<(), String>
// - http_content(path, index, method) -> (u16, HashMap<String, String>, Vec<u8>)
// - total_chunks(path) -> Result<u32, String>
// - size_bytes(path) -> Result<u32, String>
// - get_chunk_size() -> u32

impl NexusFrontendContractState {
    // These methods delegate to the WebServer instance
    pub fn start_file_upload(&mut self, path: String, total_chunks: u32) -> Result<(), String> {
        self.server.start_file_upload(path, total_chunks)
    }

    pub fn total_chunks(&self, path: String) -> Result<u32, String> {
        self.server.total_chunks(path)
    }

    pub fn add_path_content(&mut self, path: String, chunk: Vec<u8>, index: u32) -> Result<(), String> {
        self.server.add_path_content(path, chunk, index)
    }

    pub fn finish_upload(&mut self, path: String, size_bytes: u32) -> Result<(), String> {
        self.server.finish_upload(path, size_bytes)
    }

    pub fn http_content(&self, path: String, index: u32, method: String) -> (u16, std::collections::HashMap<String, String>, Vec<u8>) {
        self.server.http_content(path, index, method)
    }

    pub fn size_bytes(&self, path: String) -> Result<u32, String> {
        self.server.size_bytes(path)
    }

    pub fn get_chunk_size(&self) -> u32 {
        self.server.get_chunk_size()
    }
}
