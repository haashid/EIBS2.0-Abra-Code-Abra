
import fs from "fs";
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

async function run() {
    const sdk = await import("@weilliptic/weil-sdk");
    const WeilWallet = sdk.WeilWallet || sdk.default?.WeilWallet;

    let privateKeyHex;
    try {
        privateKeyHex = JSON.parse(fs.readFileSync(PRIVATE_KEY_FILE, "utf-8")).private_key_hex;
    } catch (e) {
        console.error("❌ Could not read private_key.json");
        return;
    }

    const wallet = new WeilWallet(privateKeyHex);
    console.log("Wallet:", wallet.getAddress());

    console.log("Fetching pods...");
    // There isn't a direct "listPods" on wallet easily exposed, 
    // but let's try to infer or use specific SDK methods if available.
    // Actually, usually deployments need a valid pod that the user OWNS or has access to.

    // IF we can't list, we might have to ask the user.
    // But let's try to fetch balance or something to ensure connectivity.

    // Wait, the error was "Pod not found". 
    // Let's try to deploy with an empty pod option to see if it lists allowed pods in error?
    // Or check if there is a 'pods' module in SDK.

    // For now, let's just ask the user or check previous deployments.
    // But I will output the wallet address clearer.
}

run();
