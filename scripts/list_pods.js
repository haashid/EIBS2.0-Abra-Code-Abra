
import { WeilWallet } from "@weilliptic/weil-sdk";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// URL Patch
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

// NO Time Patch - assume synced for simple listing
async function main() {
    console.log("Listing Pods...");
    const wallet = new WeilWallet({
        privateKey: process.env.PRIVATE_KEY || 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        sentinelEndpoint: 'https://sentinel.unweil.me'
    });

    try {
        const pods = await wallet.pods.list();
        console.log("Found Pods:", pods.length);
        console.table(pods);

        // Check finding default
        const currentPod = process.env.NEXT_PUBLIC_WEIL_POD_ID;
        console.log(`Current Configured Pod: ${currentPod}`);

        const found = pods.find(p => p.podId === currentPod);
        if (found) {
            console.log("✅ Current pod exists in list.");
        } else {
            console.warn("⚠️ Current pod NOT found in list!");
        }
    } catch (e) {
        console.error("Failed to list pods:", e);
    }
}

main();
