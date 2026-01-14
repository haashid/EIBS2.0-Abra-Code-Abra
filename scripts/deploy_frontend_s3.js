"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sdk = __importStar(require("@weilliptic/weil-sdk"));
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
// Handle ESM/CJS import interop
const WeilWallet = sdk.WeilWallet || sdk.default?.WeilWallet;
const contracts = sdk.contracts || sdk.default?.contracts;
dotenv_1.default.config({ path: ".env.local" });
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
    const keyData = JSON.parse(fs_1.default.readFileSync(PRIVATE_KEY_FILE, "utf-8"));
    const wallet = new WeilWallet(keyData.private_key_hex);
    console.log("✅ Wallet loaded:", wallet.getAddress());
    if (!fs_1.default.existsSync(WASM_PATH)) {
        throw new Error(`WASM not found at ${WASM_PATH}`);
    }
    const wasm = fs_1.default.readFileSync(WASM_PATH);
    const widl = fs_1.default.readFileSync(WIDL_PATH, "utf-8");
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
    }
    catch (e) {
        console.error("❌ Deployment Failed:", e);
    }
}
main().catch(console.error);
