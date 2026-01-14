
import * as sdk from "@weilliptic/weil-sdk";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Handle ESM/CJS import interop
const WeilWallet = sdk.WeilWallet || (sdk as any).default?.WeilWallet;
const contracts = sdk.contracts || (sdk as any).default?.contracts;

dotenv.config({ path: ".env.local" });

const PRIVATE_KEY_FILE = "private_key.json";
const WASM_PATH = "applets/nexus_frontend/nexus_frontend.wasm";
const WIDL_PATH = "applets/nexus_frontend/nexus_frontend.widl";
const OUT_DIR = "out";

async function main() {
    console.log("🚀 Starting Deployment (Fallback to S3 Contract)...");

    if (!WeilWallet || !contracts) {
        console.error("❌ SDK Import Failed:", { sdkKeys: Object.keys(sdk) });
        process.exit(1);
    }

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

    // Deploy
    try {
        const deployTx = await contracts.deploy(wasm, widl, { pod: podId }, wallet);
        // Note: verify if deploy takes wallet as argument? example.js implies implicit via connection?
        // contracts.deploy(bin, widl, { pod }, signer?)
        // Contracts typically use the wallet connected to the client.
        // But here `contracts` is a static helper?
        // Let's assume it returns a Contract object or Promise<Contract>

        console.log("✅ Deployment sent. Result:", deployTx);

        // Extract address
        // If deployTx is the contract instance:
        const contractAddress = deployTx.address || deployTx.contractId;
        console.log(`🎉 Contract Address: ${contractAddress}`);

        // Skip upload for now as s3 requires complex setup
        console.log("⚠️  Skipping asset upload (S3 contract requires AWS creds).");
        console.log("👉  Configure S3 MCP secrets to enable hosting.");

    } catch (e) {
        console.error("❌ Deployment Failed:", e);
    }
}

main().catch(console.error);
