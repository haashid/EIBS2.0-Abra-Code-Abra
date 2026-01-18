
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

const appletsToRegister = [
    { name: "Text Processor", description: "[Functions: get_stats, execute, process_text] Process and analyze text data on-chain.", address: "aaaaaa7ijrzp2zpi5chort464ajfjirn7p7ykp6zzj4jfmpg2qlaolhnxy", price: "0.001", in: "string", out: "JSON" },
    { name: "Hash Generator", description: "[Functions: generate_hash, execute] Cryptographic hash generation for any input data.", address: "aaaaaa6p2pnr2sezh4pzbiivwycwvx72yklc62uzjyjaafnyq6qvq2sjf4", price: "0.001", in: "string", out: "string" },
    { name: "Data Validator", description: "[Functions: validate, execute] JSON structure validation with field checking.", address: "aaaaaa2riwwqy65hh2in3vwppcnugrvbuqelankkh66diov2tbojy6hsee", price: "0.001", in: "JSON", out: "JSON" },
    { name: "Echo Transform", description: "[Functions: transform, execute] Text transformation - uppercase, lowercase, reverse.", address: "aaaaaa2immztcqcrricm6prx3hvmthoc5wy2vp5ki5fy2jdctoyjzfmxga", price: "0.001", in: "string", out: "string" },
    { name: "ASCII Art NFT", description: "[Functions: generate_art, execute] Generate ASCII art from text.", address: "aaaaaa56sqm7v7k4fdhrihgjj5camvtspffaox3giuk6ifk2f7rrkehwgu", price: "0.001", in: "string", out: "string" },
    { name: "Arithmetic MCP", description: "[Functions: calculate, execute] Perform arithmetic calculations on-chain.", address: "aaaaaa62wx5c244vb5wdq526q273buyqjbjgqxf77s5clypwvaz6vjno3u", price: "0.001", in: "string", out: "string" }
];

async function main() {
    await syncTime();

    const privateKey = process.env.PRIVATE_KEY || 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const sentinelEndpoint = 'https://sentinel.unweil.me';
    const registryAddress = process.env.NEXT_PUBLIC_WEIL_REGISTRY_ADDRESS;

    if (!registryAddress) {
        console.error("❌ NEXT_PUBLIC_WEIL_REGISTRY_ADDRESS not set in .env.local");
        process.exit(1);
    }

    console.log(`\nRegistry Address: ${registryAddress}`);
    const wallet = new WeilWallet({ privateKey, sentinelEndpoint });

    for (const app of appletsToRegister) {
        console.log(`\n-----------------------------------`);
        console.log(`📝 Registering: ${app.name}`);
        console.log(`   Address: ${app.address}`);

        const priceWei = BigInt(parseFloat(app.price) * 1e18);

        let success = false;
        const maxRetries = 3;

        for (let i = 1; i <= maxRetries; i++) {
            try {
                if (i > 1) console.log(`   Attempt ${i}...`);

                // Use a high gas limit just in case
                // "input_schema" is snake_case in contract per register_applet.js
                // Verify arg names? "name", "description", "applet_address", "price", "input_schema", "output_schema"
                const result = await wallet.contracts.execute(
                    registryAddress,
                    "register_applet",
                    {
                        name: app.name,
                        description: app.description,
                        applet_address: app.address,
                        price: Number(priceWei),
                        input_schema: app.in,
                        output_schema: app.out
                    }
                );

                if (result.status === 'Failed' || result.message === 'deadline has elapsed') {
                    throw new Error(result.message || 'Transaction Failed');
                }

                console.log(`✅ Success! TxID: ${result.batch_id || 'OK'}`);
                success = true;
                break; // Move to next applet

            } catch (err) {
                console.error(`❌ Attempt ${i} Error: ${err.message}`);
                await new Promise(r => setTimeout(r, 2000));
            }
        }

        if (!success) {
            console.error(`❌ FAILED to register ${app.name} after ${maxRetries} attempts.`);
        }
    }
}

main().catch(console.error);
