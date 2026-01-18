
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
            const serverDateHeader = res.headers['date'];
            if (serverDateHeader) {
                const serverTime = new OriginalDate(serverDateHeader).getTime();
                const localTime = new OriginalDate().getTime();
                GLOBAL_OFFSET_MS = serverTime - localTime;
            }
            resolve();
        }).on('error', () => resolve());
    });
}

// ARGS: node register_applet.js <name> <description> <applet_address> <price_ytk>
async function main() {
    const args = process.argv.slice(2);
    if (args.length < 4) {
        console.log("Usage: node register_applet.js <name> <description> <applet_address> <price_ytk>");
        process.exit(1);
    }

    const [name, description, appletAddress, priceYtk] = args;
    const priceWei = BigInt(parseFloat(priceYtk) * 1e18); // Simple conversion

    await syncTime();

    const privateKey = process.env.PRIVATE_KEY || 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const sentinelEndpoint = 'https://sentinel.unweil.me';
    const registryAddress = process.env.NEXT_PUBLIC_WEIL_REGISTRY_ADDRESS;

    if (!registryAddress) {
        console.error("❌ NEXT_PUBLIC_WEIL_REGISTRY_ADDRESS not set in .env.local");
        process.exit(1);
    }

    console.log(`\n📝 Registering Applet: ${name}`);
    console.log(`Registry: ${registryAddress}`);
    console.log(`Applet: ${appletAddress}`);
    console.log(`Price: ${priceYtk} YTK`);

    const wallet = new WeilWallet({ privateKey, sentinelEndpoint });

    const maxRetries = 5;
    for (let i = 1; i <= maxRetries; i++) {
        try {
            console.log(`Attempt ${i}/${maxRetries}...`);
            const result = await wallet.contracts.execute(
                registryAddress,
                "register_applet",
                {
                    name,
                    description,
                    applet_address: appletAddress,
                    price: Number(priceWei),
                    input_schema: "JSON",
                    output_schema: "JSON"
                }
            );

            if (result.status === 'failure' || result.message === 'deadline has elapsed') {
                throw new Error(result.message || 'Unknown failure');
            }

            console.log("✅ Registration Successful!");
            console.log(result);
            process.exit(0);

        } catch (err) {
            console.error(`❌ Attempt ${i} failed: ${err.message}`);
            if (i < maxRetries) {
                const delay = i * 2000;
                console.log(`Waiting ${delay}ms...`);
                await new Promise(r => setTimeout(r, delay));
            }
        }
    }
    console.error("❌ All attempts failed.");
    process.exit(1);
}

main().catch(console.error);
