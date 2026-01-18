
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

// ------------------------------------------------------------------
// MONKEY PATCH: Fix Clock Skew (Server is ~25m ahead)
// "deadline has elapsed" error indicates transaction was too old.
// ------------------------------------------------------------------
const OriginalDate = Date;
const TIME_OFFSET = 19.5 * 60 * 1000; // 19.5 minutes
global.Date = class extends OriginalDate {
    constructor(...args) {
        if (args.length === 0) {
            super(new OriginalDate().getTime() + TIME_OFFSET);
        } else {
            super(...args);
        }
    }
    static now() {
        return new OriginalDate().getTime() + TIME_OFFSET;
    }
};
console.log("🕒 Applied Time Patch. Local time adjusted by +18 mins.");
console.log("Clock now:", new Date().toISOString());

dotenv.config({ path: ".env.local" });
const PRIVATE_KEY_FILE = "private_key.json";
// Adjusted paths for Logger
const WASM_PATH = "applets/target/wasm32-unknown-unknown/release/logger.wasm";
const WIDL_PATH = "applets/logger/logger.widl";

console.log("🚀 Deploying Fixed Logger...");

async function run() {
    // Dynamically import SDK
    const sdk = await import("@weilliptic/weil-sdk");
    const WeilWallet = sdk.WeilWallet || sdk.default?.WeilWallet;

    const endpoint = process.env.NEXT_PUBLIC_SENTINEL_ENDPOINT || "https://sentinel.unweil.me";

    let privateKeyHex;
    try {
        privateKeyHex = JSON.parse(fs.readFileSync(PRIVATE_KEY_FILE, "utf-8")).private_key_hex;
    } catch (e) {
        console.error("❌ Could not read private_key.json. Please ensure it exists.");
        return;
    }

    console.log("Endpoint:", endpoint);
    const wallet = new WeilWallet({
        privateKey: privateKeyHex,
        sentinelEndpoint: endpoint
    });
    console.log("Wallet Address:", wallet.getAddress ? wallet.getAddress() : "Address N/A");

    if (!fs.existsSync(WASM_PATH)) {
        console.error("❌ WASM missing at", WASM_PATH);
        console.error("Did you run 'cargo build'?");
        return;
    }

    // SDK expects WASM as Hex String (length/2 logic in wallet.js confirms this)
    const wasmBuffer = fs.readFileSync(WASM_PATH);
    const wasm = wasmBuffer.toString('hex');
    const widl = fs.readFileSync(WIDL_PATH, "utf-8");

    try {
        console.log("Fetching available pods...");
        let pods = [];
        try {
            pods = await wallet.pods.list();
            console.log("Available Pods:", pods.map(p => p.podId));
        } catch (err) {
            console.error("Failed to list pods:", err.message);
        }

        let podId = process.env.POD_ID || process.env.NEXT_PUBLIC_WEIL_POD_ID;
        console.log("Requested Pod ID:", podId);

        let finalPodId = podId;

        if (pods.length > 0) {
            if (podId && !pods.find(p => p.podId === podId)) {
                console.warn(`⚠️  Requested Pod ${podId} NOT found in wallet's pods.`);
                console.log(`Switching to first available pod: ${pods[0].podId}`);
                finalPodId = pods[0].podId;
            } else if (!podId) {
                console.log(`No Pod ID specified. Using first available: ${pods[0].podId}`);
                finalPodId = pods[0].podId;
            }
        }

        console.log("Final Pod ID for deployment:", finalPodId);
        const deployOptions = {
            pods: finalPodId ? [finalPodId] : undefined,
            gasLimit: 100000000n,
            gasPrice: 1000000000n
        };

        console.log("Deploying Logger contract...");
        const tx = await wallet.contracts.deploy(wasm, widl, deployOptions);
        console.log("✅ Deployed Successfully!");
        console.log("-------------------------------------------");
        const addr = tx.address || tx.contractId;
        console.log("NEW LOGGER ADDRESS:", addr);
        console.log("-------------------------------------------");
        console.log(`⚠️  Please update NEXT_PUBLIC_WEIL_LOGGER_ADDRESS in .env.local with this new address!`);

    } catch (e) {
        console.error("❌ Deploy Error:", e);
    }
}

run();
