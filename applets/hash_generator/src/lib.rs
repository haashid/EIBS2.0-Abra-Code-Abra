use serde::{Deserialize, Serialize};
use weil_macros::{constructor, mutate, query, smart_contract, WeilType};

/// Hash proof result
#[derive(Serialize, Deserialize, WeilType, Clone)]
pub struct HashProof {
    pub input_length: u32,
    pub hash_sha256: String,
    pub hash_simple: String,
    pub timestamp: u64,
    pub proof_id: u32,
}

/// Contract state
#[derive(Serialize, Deserialize, WeilType)]
pub struct HashGeneratorState {
    proofs_generated: u32,
}

trait HashGenerator {
    fn new() -> Result<Self, String> where Self: Sized;
    async fn get_proof_count(&self) -> u32;
    async fn execute(&mut self, input: String) -> String;
    async fn generate_hash(&mut self, data: String) -> HashProof;
}

fn simple_sha256(input: &str) -> String {
    let mut h: [u32; 8] = [
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
        0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
    ];
    
    for (i, byte) in input.bytes().enumerate() {
        let idx = i % 8;
        h[idx] = h[idx].wrapping_add(byte as u32).wrapping_mul(31);
        h[(idx + 1) % 8] ^= h[idx].rotate_left(5);
    }
    
    h.iter().map(|x| format!("{:08x}", x)).collect()
}

#[smart_contract]
impl HashGenerator for HashGeneratorState {
    #[constructor]
    fn new() -> Result<Self, String> where Self: Sized {
        Ok(HashGeneratorState {
            proofs_generated: 0,
        })
    }

    #[query]
    async fn get_proof_count(&self) -> u32 {
        self.proofs_generated
    }

    #[mutate]
    async fn execute(&mut self, input: String) -> String {
        let proof = self.generate_hash(input).await;
        serde_json::to_string(&proof).unwrap_or_else(|_| "Error".to_string())
    }

    #[mutate]
    async fn generate_hash(&mut self, data: String) -> HashProof {
        self.proofs_generated += 1;
        
        let hash_sha256 = simple_sha256(&data);
        let hash_simple = format!("{:016x}", data.bytes().fold(0u64, |acc, b| {
            acc.wrapping_mul(31).wrapping_add(b as u64)
        }));
        
        let timestamp = weil_rs::runtime::Runtime::block_timestamp()
            .parse::<u64>()
            .unwrap_or(0);
        
        HashProof {
            input_length: data.len() as u32,
            hash_sha256,
            hash_simple,
            timestamp,
            proof_id: self.proofs_generated,
        }
    }
}
