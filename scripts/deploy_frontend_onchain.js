
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
            super(url, base);
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
    return new Promise((resolve) => {
        const https = require('https');
        console.log("⏳ Syncing time...");
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

// --- Helpers ---

async function deployWebserverContract(wallet) {
    const wasmPath = path.join(__dirname, '../applets/target/wasm32-unknown-unknown/release/nexus_frontend.wasm');
    const widlPath = path.join(__dirname, '../applets/nexus_frontend/nexus_frontend.widl');

    if (!fs.existsSync(wasmPath)) {
        throw new Error(`❌ Missing WASM binary: ${wasmPath}\n👉 Please rebuild 'nexus_frontend' (requires 'wadk-0.1.0' SDK) or place the binary there.`);
    }

    console.log("DEPLOYING: Nexus Frontend WebServer...");
    const wasmHex = fs.readFileSync(wasmPath).toString('hex');
    const widlContent = fs.readFileSync(widlPath, 'utf8');

    // Force discovery or fallback
    let podId = null;
    // Logic to find pod would go here (simplified)
    if (!podId) podId = 'POD_979092f2910044238c868e79fb01d8ff';

    const deployResult = await wallet.contracts.deploy(wasmHex, widlContent, {
        pods: [podId],
        gasLimit: 100000000n
    });

    const address = deployResult.contract_address || (Array.isArray(deployResult) ? deployResult[0]?.contract_address : null);
    const status = deployResult.status || (Array.isArray(deployResult) ? deployResult[0]?.status : null);

    if (status === 'Failed' || !address) {
        throw new Error(`❌ Webserver deployment failed! Status: ${status}`);
    }

    console.log(`✅ WEBSERVER DEPLOYED: ${address}`);
    return address;
}

const CHUNK_SIZE = 100 * 1024; // 100KB chunks (adjust based on gas limits)

async function uploadFile(wallet, contractAddress, itemPath, basePath) {
    // Relative path for URL (e.g., 'index.html', 'css/style.css')
    const relPath = path.relative(basePath, itemPath).replace(/\\/g, '/'); // Force forward slash

    // Webserver usually expects paths starting with /
    const serverPath = relPath.startsWith('/') ? relPath : `/${relPath}`;

    const content = fs.readFileSync(itemPath);
    const size = content.length;
    const totalChunks = Math.ceil(size / CHUNK_SIZE);

    console.log(`Uploading: ${serverPath} (${size} bytes, ${totalChunks} chunks)`);

    // 1. Start Upload
    await wallet.contracts.execute(contractAddress, "start_file_upload", {
        path: serverPath,
        total_chunks: totalChunks
    });

    // 2. Upload Chunks
    for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, size);
        const chunk = content.subarray(start, end);
        // Convert to number array or hex depending on SDK expectation. 
        // Typically Vec<u8> expects number array or base64. SDK usually handles Buffer -> Vec<u8>.
        // Safest is usually Array.from(chunk).

        process.stdout.write(`  Chunk ${i + 1}/${totalChunks}... `);
        await wallet.contracts.execute(contractAddress, "add_path_content", {
            path: serverPath,
            chunk: Array.from(chunk),
            index: i
        });
        process.stdout.write("OK\n");
    }

    // 3. Finish Upload
    await wallet.contracts.execute(contractAddress, "finish_upload", {
        path: serverPath,
        size_bytes: size
    });
    console.log(`  ✅ Finished: ${serverPath}`);
}

async function uploadDirectory(wallet, contractAddress, dirPath, basePath) {
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = fs.statSync(itemPath);
        if (stat.isDirectory()) {
            await uploadDirectory(wallet, contractAddress, itemPath, basePath);
        } else {
            await uploadFile(wallet, contractAddress, itemPath, basePath);
        }
    }
}

async function main() {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) throw new Error("Missing PRIVATE_KEY in .env.local");
    const sentinelEndpoint = 'https://sentinel.unweil.me';
    await syncTime();

    const wallet = new WeilWallet({ privateKey, sentinelEndpoint });

    // 1. Check Build
    const outDir = path.join(__dirname, '../out');
    if (!fs.existsSync(outDir)) {
        throw new Error("❌ 'out' directory not found! Run 'npm run build' first.");
    }

    // 2. Deploy Contract
    const address = await deployWebserverContract(wallet);

    // 3. Upload Assets
    console.log("\n🚀 Crawling 'out' directory and uploading assets...");
    await uploadDirectory(wallet, address, outDir, outDir);

    console.log("\n✅ DEPLOYMENT COMPLETE!");
    console.log(`Visit your DApp at: https://sentinel.unweil.me/webserver/${address}/index.html`); // Assumption on URL structure
}

main().catch(console.error);
