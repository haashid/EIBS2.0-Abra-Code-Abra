
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.local') });

// --- Monkey-patch URL for SDK ---
const OriginalURL = globalThis.URL;
class PatchedURL extends OriginalURL {
    constructor(url, base) {
        if (typeof url === 'string' && (url === '/rest' || url.startsWith('/'))) {
            super(url, "https://sentinel.unweil.me");
            return;
        }
        try {
            super(url, base);
        } catch (e) {
            if (!base && typeof url === 'string' && url.startsWith('/')) {
                super(url, "https://sentinel.unweil.me");
            } else {
                throw e;
            }
        }
    }
}
globalThis.URL = PatchedURL;

import { WeilWallet } from "@weilliptic/weil-sdk";

// --- Time Sync ---
const OriginalDate = Date;
let GLOBAL_OFFSET_MS = 0;
global.Date = class extends OriginalDate {
    constructor(...args) {
        if (args.length === 0) super(new OriginalDate().getTime() + GLOBAL_OFFSET_MS);
        else super(...args);
    }
    static now() { return new OriginalDate().getTime() + GLOBAL_OFFSET_MS; }
};

async function syncTime() {
    return new Promise(async (resolve) => {
        const https = await import('https');
        console.log("⏳ Syncing time...");
        https.get('https://sentinel.unweil.me', (res) => {
            const serverDateHeader = res.headers['date'];
            if (serverDateHeader) {
                const serverTime = new OriginalDate(serverDateHeader).getTime();
                const localTime = new OriginalDate().getTime();
                GLOBAL_OFFSET_MS = serverTime - localTime;
                console.log(`✅ Time Synced! Offset: ${GLOBAL_OFFSET_MS}ms`);
            }
            resolve();
        }).on('error', () => resolve());
    });
}

async function main() {
    const privateKey = process.env.PRIVATE_KEY || 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const sentinelEndpoint = 'https://sentinel.unweil.me';
    await syncTime();

    const wallet = new WeilWallet({ privateKey, sentinelEndpoint });

    // --- Dynamic Pod Discovery ---
    let podId = process.env.NEXT_PUBLIC_WEIL_POD_ID;

    if (podId) {
        console.log(`✅ Using Configured Pod ID: ${podId}`);
    } else {
        try {
            console.log("🔍 Discovering active pods...");
            const pods = await wallet.pods.list();
            if (pods && pods.length > 0) {
                console.log("Available Pods:", pods.map(p => `${p.podId} (${p.status})`));
                const targetPod = pods.find(p => p.podId !== 'SENATE') || pods[0];
                console.log(`✅ Selecting Discovered Pod: ${targetPod.podId}`);
                podId = targetPod.podId;
            } else {
                console.warn("⚠️ No pods returned. Using fallback POD.");
            }
        } catch (err) {
            console.warn("⚠️ Failed to list pods (using fallback):", err.message);
        }
    }

    if (!podId) podId = 'POD_979092f2910044238c868e79fb01d8ff'; // Fallback

    console.log(`Deploying Registry to Pod: ${podId}`);

    const wasmPath = path.join(__dirname, '../applets/target/wasm32-unknown-unknown/release/applet_registry.wasm');
    const widlPath = path.join(__dirname, '../applets/applet_registry/applet_registry.widl');

    const wasmContent = fs.readFileSync(wasmPath);
    const widlContent = fs.readFileSync(widlPath, 'utf8');
    const wasmHex = wasmContent.toString('hex');

    try {
        console.log("Deploying AppletRegistry...");
        const deployResult = await wallet.contracts.deploy(
            wasmHex,
            widlContent,
            {
                pods: [podId],
                gasLimit: 100000000n, // High gas limit to prevent OOG
                gasPrice: 1000000000n // Ensure it gets picked up
            }
        );

        console.log("Registry Deploy RAW:", JSON.stringify(deployResult, null, 2));
        const address = deployResult.contract_address || deployResult.address || deployResult.id || (Array.isArray(deployResult) ? deployResult[0]?.contract_address : null);
        console.log(`\n✅ REGISTRY DEPLOYED SUCCESSFULLY!`);
        console.log(`Address: ${address}`);
        console.log(`\nPlease update NEXT_PUBLIC_WEIL_REGISTRY_ADDRESS in .env.local with this new address.`);

    } catch (err) {
        console.error("❌ Deployment failed:", err.message);
        if (err.response) console.error("Response:", err.response.data);
    }
}

main().catch(console.error);
