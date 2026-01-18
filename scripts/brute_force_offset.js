
import fs from "fs";
import { WeilWallet } from "@weilliptic/weil-sdk";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

// Handling ESM dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.local') });

// ------------------------------------------------------------------
// DYNAMIC MONKEY PATCH
// Allows changing offset at runtime
// ------------------------------------------------------------------
let GLOBAL_TIME_OFFSET_MS = 0;
const OriginalDate = Date;

global.Date = class extends OriginalDate {
    constructor(...args) {
        if (args.length === 0) {
            super(new OriginalDate().getTime() + GLOBAL_TIME_OFFSET_MS);
        } else {
            super(...args);
        }
    }
    static now() {
        return new OriginalDate().getTime() + GLOBAL_TIME_OFFSET_MS;
    }
    static parse(...args) { return OriginalDate.parse(...args); }
    static UTC(...args) { return OriginalDate.UTC(...args); }
};

// Fix URL for SDK (sentinel patch)
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

async function attemptDeploy(offsetMinutes, wallet, wasmHex, widlContent, deployOptions) {
    GLOBAL_TIME_OFFSET_MS = offsetMinutes * 60 * 1000;
    console.log(`\n🔎 Testing offset: ${offsetMinutes} minutes (Total skew: ${GLOBAL_TIME_OFFSET_MS}ms)`);
    console.log(`   Simulated Date: ${new Date().toISOString()}`);

    try {
        const contract = await wallet.contracts.deploy(
            wasmHex,
            widlContent,
            deployOptions
        );
        console.log(`✅ SUCCESS! Offset ${offsetMinutes}m worked.`);
        console.log(`   Contract Address: ${contract.contractAddress}`);
        return true;
    } catch (err) {
        if (err.response && err.response.data && err.response.data.message) {
            console.log(`❌ Failed: ${err.response.data.message}`);
        } else {
            console.log(`❌ Failed: ${err.message}`);
        }
        return false;
    }
}

async function main() {
    console.log("🚀 Starting Brute Force Offset Search...");

    const privateKey = process.env.PRIVATE_KEY || 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const sentinelEndpoint = 'https://sentinel.unweil.me';

    const wallet = new WeilWallet({
        privateKey,
        sentinelEndpoint
    });

    // Load one lightweight applet to test (Text Processor is fine)
    const wasmPath = path.resolve(__dirname, '../applets/target/wasm32-unknown-unknown/release/text_processor.wasm');
    const widlPath = path.resolve(__dirname, '../applets/text_processor/text_processor.widl');

    if (!fs.existsSync(wasmPath)) {
        console.error("WASM not found:", wasmPath);
        process.exit(1);
    }

    const wasmContent = fs.readFileSync(wasmPath);
    const widlContent = fs.readFileSync(widlPath, 'utf8');
    const wasmHex = wasmContent.toString('hex');

    let podId = process.env.NEXT_PUBLIC_WEIL_POD_ID;
    if (!podId) {
        console.log("No POD ID, trying default p_public_1");
        podId = "p_public_1";
    }
    const deployOptions = { pods: [podId] };

    // Search Strategy:
    // Start broadly around 0, then 20, then expand.
    // Known history: 19.5m worked.
    // check_time implies 0m.
    // We will test: 0, 19.5, 20, 21, 22 ... up to 30.
    // And maybe negative?

    // Systematic Brute Force: -30 to +30 minutes
    const offsetsToTest = [];
    // Prioritize 0, and around 20 (historical success)
    offsetsToTest.push(0);
    // Add 15 to 25 (historical hot spot)
    for (let i = 15; i <= 25; i++) offsetsToTest.push(i);
    // Add -5 to +5
    for (let i = -5; i <= 5; i++) if (i !== 0) offsetsToTest.push(i);
    // Add rest of range -30 to +30
    for (let i = -30; i <= 30; i++) {
        if (!offsetsToTest.includes(i)) offsetsToTest.push(i);
    }

    for (const offset of offsetsToTest) {
        const success = await attemptDeploy(offset, wallet, wasmHex, widlContent, deployOptions);
        if (success) {
            console.log(`\n🎉 FOUND WORKING OFFSET: ${offset} minutes.`);
            console.log(`\nPlease update deploy_all_applets.js with: const SKEW_OFFSET_MS = ${offset} * 60 * 1000;`);
            process.exit(0);
        }
    }

    console.log("\n❌ Exhausted all offsets. Deployment impossible under current conditions.");
    process.exit(1);
}

main().catch(console.error);
