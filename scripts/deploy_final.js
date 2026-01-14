
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// ------------------------------------------------------------------
// MONKEY PATCH: Fix SDK Invalid URL Error
// Must apply BEFORE SDK import
// ------------------------------------------------------------------
const OriginalURL = globalThis.URL;
class PatchedURL extends OriginalURL {
    constructor(url, base) {
        if (url === '/rest' && !base) {
            super(url, "https://sentinel.unweil.me"); // Force endpoint
            return;
        }
        try {
            super(url, base);
        } catch (e) {
            if (!base && typeof url === 'string' && url.startsWith('/')) {
                super(url, "https://sentinel.unweil.me");
                return;
            }
            throw e;
        }
    }
}
globalThis.URL = PatchedURL;

dotenv.config({ path: ".env.local" });
const PRIVATE_KEY_FILE = "private_key.json";
const WASM_PATH = "applets/nexus_frontend/nexus_frontend.wasm";
const WIDL_PATH = "applets/nexus_frontend/nexus_frontend.widl";

console.log("🚀 Deploying Final (Dynamic Import)...");

async function run() {
    // Dynamically import SDK to ensure patch applies first
    const sdk = await import("@weilliptic/weil-sdk");
    const WeilWallet = sdk.WeilWallet || sdk.default?.WeilWallet;

    const endpoint = process.env.SENTINEL_ENDPOINT || "https://sentinel.unweil.me";
    const privateKeyHex = JSON.parse(fs.readFileSync(PRIVATE_KEY_FILE, "utf-8")).private_key_hex;

    console.log("Endpoint:", endpoint);
    const wallet = new WeilWallet(privateKeyHex);
    console.log("Wallet Address:", wallet.getAddress ? wallet.getAddress() : "Address N/A (Method Missing)");

    if (!fs.existsSync(WASM_PATH)) {
        console.error("WASM missing at", WASM_PATH);
        return;
    }
    const wasm = fs.readFileSync(WASM_PATH);
    const widl = fs.readFileSync(WIDL_PATH, "utf-8");

    try {
        console.log("Deploying contract...");
        const podId = process.env.POD_ID;
        console.log("Pod ID:", podId);

        const tx = await wallet.contracts.deploy(wasm, widl, { pod: podId });
        console.log("✅ Deployed:", tx);
        const addr = tx.address || tx.contractId;
        console.log("CONTRACT_ADDRESS:", addr);
        fs.writeFileSync("deployed_address.txt", addr);

    } catch (e) {
        console.error("Deploy Error:", e);
    }
}

run();
