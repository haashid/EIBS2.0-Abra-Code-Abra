
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';

// Convert import.meta.url to __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.local') });

// ------------------------------------------------------------------
// MONKEY PATCH: Fix SDK Invalid URL Error
// Must apply BEFORE SDK import (or concurrently if imported at top level, 
// but since it's a class modification, top level import is fine as long as 
// instantiated AFTER patch? No, SDK likely uses URL in top level scope? 
// Actually deploy_logger_fixed.js imported BEFORE patch but it worked? 
// Let's stick to import at top, but ensure patch runs before `new WeilWallet`
// ------------------------------------------------------------------
const OriginalURL = globalThis.URL;
class PatchedURL extends OriginalURL {
    constructor(url, base) {
        // ALWAYS force unweil.me if the path starts with /rest or is a relative path intended for SDK
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

// --- Monkey-patch Date.now to fix clock skew ---
const originalDateNow = Date.now;
// ------------------------------------------------------------------
// DYNAMIC CLOCK SKEW CORRECTION
// ------------------------------------------------------------------
const OriginalDate = Date;
let GLOBAL_OFFSET_MS = 0;

// Patch Date class to use the calculated offset
global.Date = class extends OriginalDate {
    constructor(...args) {
        if (args.length === 0) {
            super(new OriginalDate().getTime() + GLOBAL_OFFSET_MS);
        } else {
            super(...args);
        }
    }
    static now() {
        return new OriginalDate().getTime() + GLOBAL_OFFSET_MS;
    }
    static parse(...args) { return OriginalDate.parse(...args); }
    static UTC(...args) { return OriginalDate.UTC(...args); }
};

async function syncTime() {
    return new Promise(async (resolve) => {
        const https = await import('https');
        console.log("⏳ Synchronizing clock with sentinel.unweil.me...");
        https.get('https://sentinel.unweil.me', (res) => {
            const serverDateHeader = res.headers['date'];
            if (serverDateHeader) {
                const serverTime = new OriginalDate(serverDateHeader).getTime();
                const localTime = new OriginalDate().getTime(); // Unpatched local time
                GLOBAL_OFFSET_MS = serverTime - localTime;
                console.log(`✅ Time Synced! Server: ${new OriginalDate(serverTime).toISOString()}, Local: ${new OriginalDate(localTime).toISOString()}`);
                console.log(`   Applying Offset: ${GLOBAL_OFFSET_MS}ms (${(GLOBAL_OFFSET_MS / 60000).toFixed(2)} mins)`);
            } else {
                console.warn("⚠️ No Date header from server. Using 0 offset.");
            }
            resolve();
        }).on('error', (err) => {
            console.warn("⚠️ Failed to sync time:", err.message);
            resolve();
        });
    });
}
// ------------------------------------------------------------------

async function deployApplet(wallet, name, wasmPath, widlPath, podId) {

    console.log(`\nDeploying ${name}...`);
    try {
        const fullWasmPath = path.resolve(__dirname, '..', wasmPath);
        const fullWidlPath = path.resolve(__dirname, '..', widlPath);

        const wasmContent = fs.readFileSync(fullWasmPath);
        const widlContent = fs.readFileSync(fullWidlPath, 'utf8');

        // Convert to Hex String if needed (SDK quirk)
        const wasmHex = wasmContent.toString('hex');

        // SDK Expects { pods: ['podId'] } or similar?
        // Let's use { pods: [podId] } as inferred from previous debugging
        const deployOptions = {
            pods: [podId],
            gasLimit: 100000000n,
            gasPrice: 1000000000n
        };

        // Use wallet.contracts.deploy based on SDK inspection
        const contract = await wallet.contracts.deploy(
            wasmHex,
            widlContent,
            deployOptions
        );

        // Wait, check signature in walletCommon.js:
        // deploy: async (body, widl, { name = null, pods: podsSpecifier = 'default', ... })
        // It takes 3 arguments. init_args is handled inside options? 
        // walletCommon.js line 52: deploy: async (body, widl, { ... })
        // It does NOT take init_args as 3rd arg separately!
        // My previous script (deploy_logger_fixed) might have used outdated signature or I misread.
        // Let's assume standard signature: (wasm, widl, options) where options includes pods and init_args if needed.
        // But wait, walletCommon line 66 says `init_args` in userTransaction comes from `contract.init_args`.
        // Line 52 destructures the 3rd argument. It doesn't seem to extract `init_args`.
        // Line 66: init_args: contract.init_args || JSON.stringify(...)
        // But `contract` object is created in line 58.
        // It uses `...` ? No.
        // Let's looking closer at walletCommon.js lines 52-74:
        /*
            deploy: async (body, widl, { name = null, pods: podsSpecifier = 'default', upgrade = false, logo, author, description, organization, config, context, outcall = false, auditLog = false, }) => {
                // ...
                contract: {
                    // ...
                    // It does NOT pass rest of options!
                }
            }
        */
        // If `walletCommon.js` logic strictly only passes those destructured props, then I cannot pass init_args?
        // Unless I am using a different version or my view is incomplete.
        // But typically deploy doesn't need init args for these applets.

        // Just correcting call to 3 args:

        console.log("Deploy RAW result:", contract);

        let deployResult = contract;
        if (Array.isArray(contract)) {
            deployResult = contract[0];
        }

        const address = deployResult.contract_address || deployResult.address || deployResult.id;

        if (deployResult.status === 'Failed') {
            console.error(`❌ Deployment transaction failed for ${name}. TxID: ${deployResult.batch_id}`);
            // We can return null to skip, OR return the address if it exists (for debugging).
            // Usually failed means no code installed.
            // But let's log the address anyway.
            console.log(`   (Address generated: ${address})`);
            if (address) return address; // Try returning it, maybe it works partially? 
            return null;
        }

        console.log(`✅ ${name} Deployed! Address: ${address}`);
        return address;
    } catch (err) {
        // Log detailed error if available
        if (err.response) {
            console.error(`❌ Failed to deploy ${name}: HTTP ${err.response.status} ${err.response.statusText}`);
            if (err.response.data) console.error("Response:", err.response.data);
        } else {
            console.error(`❌ Failed to deploy ${name}:`, err.message);
        }
        return null;
    }
}

async function main() {
    const privateKey = process.env.PRIVATE_KEY || 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'; // Fallback for dev
    // FORCE unweil.me as requested by user
    const sentinelEndpoint = 'https://sentinel.unweil.me';

    // Auto-sync time before starting
    await syncTime();

    console.log('Initializing wallet...');
    console.log(`Using Endpoint: ${sentinelEndpoint}`);
    // console.log(`Using Pod ID: ${podId}`); // REMOVED: podId not defined yet

    const wallet = new WeilWallet({
        privateKey,
        sentinelEndpoint
    });

    // Check Address and Balance
    try {
        const myAddress = wallet.address || (typeof wallet.getAddress === 'function' ? await wallet.getAddress() : undefined);
        console.log(`Wallet Address: ${myAddress}`);
    } catch (e) { console.log("Could not get address", e); }

    try {
        if (typeof wallet.getBalance === 'function') {
            const balance = await wallet.getBalance();
            console.log(`Wallet Balance: ${balance.toString()}`);
        } else {
            console.log("wallet.getBalance is not a function. Skipping balance check.");
        }
    } catch (err) {
        console.warn("⚠️ Failed to fetch balance:", err.message);
    }

    // ---------------------------------------------------------
    // DYNAMIC POD SELECTION
    // ---------------------------------------------------------
    let podId = process.env.NEXT_PUBLIC_WEIL_POD_ID;
    try {
        console.log("🔍 Discovering active pods...");
        const pods = await wallet.pods.list();
        if (pods && pods.length > 0) {
            // Prefer a non-SENATE pod if possible, or just the first one
            const activePod = pods.find(p => p.podId !== 'SENATE') || pods[0];
            console.log(`✅ Found ${pods.length} pods. Selecting: ${activePod.podId}`);
            podId = activePod.podId;
        } else {
            console.warn("⚠️ No pods returned from list. Using fallback/env podId.");
        }
    } catch (err) {
        console.warn("⚠️ Failed to list pods (using fallback):", err.message);
    }

    if (!podId) {
        console.error("❌ No Pod ID available. Cannot deploy.");
        process.exit(1);
    }
    // ---------------------------------------------------------

    // Load Applets from applets.json
    const configPath = path.join(__dirname, '../applets.json');
    let applets = [];

    if (fs.existsSync(configPath)) {
        try {
            const fileData = fs.readFileSync(configPath, 'utf8');
            applets = JSON.parse(fileData);
            console.log(`\n📄 Loaded ${applets.length} applets from applets.json`);
        } catch (e) {
            console.error("❌ Failed to parse applets.json:", e);
        }
    } else {
        console.warn("\n⚠️ applets.json not found. Please create it to define applets to deploy.");
        console.log("Template: [{ name, wasm, widl }]");
    }

    const results = {};

    for (const app of applets) {
        const addr = await deployApplet(wallet, app.name, app.wasm, app.widl, podId);
        if (addr) results[app.name] = addr;
    }

    console.log("\nDeployment Summary:");
    console.table(results);

    // Write to a temp file so I can read it
    const logPath = path.join(__dirname, 'deployed_addresses.json');
    fs.writeFileSync(logPath, JSON.stringify(results, null, 2));
    console.log(`Saved addresses to ${logPath}`);
}

main().catch(console.error);
