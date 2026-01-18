
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Monkey-patch URL
const OriginalURL = globalThis.URL;
class PatchedURL extends OriginalURL {
    constructor(url, base) {
        if (typeof url === 'string' && (url === '/rest' || url.startsWith('/'))) {
            super(url, "https://sentinel.unweil.me");
        } else {
            super(url, base);
        }
    }
}
globalThis.URL = PatchedURL;

import { WeilWallet } from "@weilliptic/weil-sdk";

// Time Sync
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
        https.get('https://sentinel.unweil.me', (res) => {
            if (res.headers['date']) {
                GLOBAL_OFFSET_MS = new OriginalDate(res.headers['date']).getTime() - new OriginalDate().getTime();
            }
            resolve();
        }).on('error', () => resolve());
    });
}

async function main() {
    await syncTime();
    const privateKey = process.env.PRIVATE_KEY || 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const sentinelEndpoint = 'https://sentinel.unweil.me';
    const registryAddress = process.env.NEXT_PUBLIC_WEIL_REGISTRY_ADDRESS;

    if (!registryAddress) {
        console.error("❌ No REGISTRY_ADDRESS in .env.local");
        return;
    }

    console.log(`Testing Registry at: ${registryAddress}`);
    const wallet = new WeilWallet({ privateKey, sentinelEndpoint });

    try {
        console.log("Querying get_all_applets...");
        const result = await wallet.contracts.execute(registryAddress, "get_all_applets", {});
        console.log("Result:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("❌ Query Failed:", e.message);
    }
}

main();
