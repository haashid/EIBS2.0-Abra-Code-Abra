
import { WeilWallet } from "@weilliptic/weil-sdk";
import dotenv from "dotenv";
import path from "path";
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
                const serverTime = new OriginalDate(res.headers['date']).getTime();
                const localTime = new OriginalDate().getTime();
                GLOBAL_OFFSET_MS = serverTime - localTime;
                console.log(`✅ Time Synced! Offset: ${GLOBAL_OFFSET_MS}ms`);
            }
            resolve();
        }).on('error', () => resolve());
    });
}

async function main() {
    await syncTime();

    const privateKey = process.env.PRIVATE_KEY || 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const sentinelEndpoint = 'https://sentinel.unweil.me';

    console.log("Testing connection to:", sentinelEndpoint);

    const wallet = new WeilWallet({ privateKey, sentinelEndpoint });
    const address = wallet.address;
    console.log("Wallet Address:", address);

    try {
        console.log("Fetching YTK Token Balance...");
        const tokenAddress = process.env.NEXT_PUBLIC_WEIL_TOKEN_ADDRESS;
        if (!tokenAddress) {
            console.log("Skipping token check (no address)");
        } else {
            const balance = await wallet.contracts.execute(
                tokenAddress,
                "balance_of",
                { owner: address }
            );
            console.log("Token Balance Result:", balance?.txn_result || balance);
        }
    } catch (e) {
        console.error("❌ Token Balance Check Failed:", e.message);
    }

    try {
        console.log("Checking Deployment Pods...");
        // Just try to find active pods logic (simulated by checking if we can init)
        console.log("Wallet initialized successfully.");
    } catch (e) {
        console.error("❌ Wallet Init Failed:", e.message);
    }
}

main();
