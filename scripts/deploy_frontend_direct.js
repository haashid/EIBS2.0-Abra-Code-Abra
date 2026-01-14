
import { WeilWallet, contracts } from "@weilliptic/weil-sdk";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const PRIVATE_KEY_FILE = "private_key.json";
const WASM_PATH = "applets/nexus_frontend/nexus_frontend.wasm";
const WIDL_PATH = "applets/nexus_frontend/nexus_frontend.widl";

console.log("🚀 Starting Deployment (Direct Import)...");

if (!contracts) {
    console.error("❌ contracts import failed");
    process.exit(1);
}

// ... rest of logic
async function main() {
    const keyData = JSON.parse(fs.readFileSync(PRIVATE_KEY_FILE, "utf-8"));
    const wallet = new WeilWallet(keyData.private_key_hex);
    console.log("✅ Wallet loaded:", wallet.getAddress());

    if (!fs.existsSync(WASM_PATH)) {
        throw new Error(`WASM not found at ${WASM_PATH}`);
    }
    const wasm = fs.readFileSync(WASM_PATH);
    const widl = fs.readFileSync(WIDL_PATH, "utf-8");

    const podId = process.env.POD_ID;
    console.log(`📡 Deploying to Pod: ${podId}`);

    try {
        // Correct Usage: deploy(bin, widl, options, signer?)
        const deployTx = await contracts.deploy(wasm, widl, { pod: podId }, wallet);
        console.log("✅ Deployment sent. Result:", deployTx);

        const contractAddress = deployTx.address || deployTx.contractId;
        console.log(`🎉 Contract Address: ${contractAddress}`);
        console.log("⚠️  Skipping asset upload (S3 contract requires AWS creds).");
    } catch (e) {
        console.error("❌ Deployment Failed:", e);
    }
}

main();
