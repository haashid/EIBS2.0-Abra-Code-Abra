
import { WeilWallet, contracts } from "@weilliptic/weil-sdk";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const PRIVATE_KEY_FILE = "private_key.json";
const WASM_PATH = "applets/nexus_frontend/target/wasm32-unknown-unknown/release/nexus_frontend.wasm";
const WIDL_PATH = "applets/nexus_frontend/nexus_frontend.widl";
const OUT_DIR = "out";
const CHUNK_SIZE = 16 * 1024; // 16KB

async function main() {
    console.log("🚀 Starting Frontend Deployment...");

    // 1. Load Private Key
    const keyData = JSON.parse(fs.readFileSync(PRIVATE_KEY_FILE, "utf-8"));
    const wallet = new WeilWallet(keyData.private_key_hex);
    console.log("✅ Wallet loaded:", wallet.getAddress());

    // 2. Load Contract Artifacts
    if (!fs.existsSync(WASM_PATH)) {
        throw new Error(`WASM not found at ${WASM_PATH}. Build it first!`);
    }
    const wasm = fs.readFileSync(WASM_PATH);
    const widl = fs.readFileSync(WIDL_PATH, "utf-8");

    // 3. Deploy
    const podId = process.env.POD_ID;
    console.log(`📡 Deploying to Pod: ${podId}`);

    // Note: contracts.deploy might expect 'bin' as hex string or buffer? 
    // SDK usually handles Buffer.
    const deployTx = await contracts.deploy(wasm, widl, {
        pod: podId
    });

    console.log("⏳ Waiting for deployment...");
    // The SDK deploy likely returns a Transaction object or similar.
    // We need to wait for it.
    // Based on example.js: await contracts.deploy(...)
    // Does it return the contract address directly?
    // example.js line: // await testDeployAsciiArt()
    // It's commented out in example.js snippet I saw.
    // contracts.d.ts says: deploy: (...) => Promise<any>

    // Let's assume it returns the contract instance or address.
    const deployedContract = deployTx;
    console.log("✅ Contract deployed!", deployedContract);

    // If it returns an object with address, use it.
    // Adjust based on strict SDK usage if known. 
    // Assuming deployedContract has .address or is the address string.
    const contractAddress = typeof deployedContract === 'string' ? deployedContract : deployedContract.address || deployedContract.contractId;

    if (!contractAddress) {
        console.error("❌ Failed to get contract address", deployedContract);
        process.exit(1);
    }
    console.log(`🎉 Contract Address: ${contractAddress}`);

    // 4. Upload Assets
    const files = getAllFiles(OUT_DIR);
    console.log(`📂 Found ${files.length} files to upload.`);

    const client = wallet.connection.toContractClient(contractAddress);

    for (const file of files) {
        const relativePath = path.relative(OUT_DIR, file).replace(/\\/g, "/");
        const content = fs.readFileSync(file);
        const totalChunks = Math.ceil(content.length / CHUNK_SIZE);

        console.log(`⬆️ Uploading ${relativePath} (${content.length} bytes, ${totalChunks} chunks)...`);

        // Start Upload
        // WebServer method: start_file_upload(id: WeilId, path: String, total_chunks: u32)
        // Note: WeilId is usually the contract ID? Or map ID? 
        // In WebServer::new(id), it uses it.
        // But start_file_upload takes `id`. Is it valid?
        // Let's check webserver.rs again.
        // pub fn start_file_upload(&mut self, id: WeilId, path: String, total_chunks: u32)
        // Wait, why does it take `id`?
        // Ah, it passes it to `WeilMemory::with_num_chunks(id, ...)`
        // `WeilId` typically is generated or passed. 
        // We might just pass a random number? Or 1?

        // Execute 'start_file_upload'
        await client.execute("start_file_upload", {
            id: 1, // Dummy ID?
            path: relativePath,
            total_chunks: totalChunks
        });

        // Upload Chunks
        for (let i = 0; i < totalChunks; i++) {
            const start = i * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, content.length);
            const chunk = content.subarray(start, end);

            // add_path_content(path: String, chunk: Vec<u8>, index: u32)
            await client.execute("add_path_content", {
                path: relativePath,
                chunk: Array.from(chunk), // Encodable as Vec<u8>
                index: i
            });
            process.stdout.write(".");
        }
        process.stdout.write("\n");

        // Finish Upload
        // finish_upload(path: String, size_bytes: u32)
        await client.execute("finish_upload", {
            path: relativePath,
            size_bytes: content.length
        });
        console.log(`✅ ${relativePath} done.`);
    }

    console.log("\n✨ Deployment & Upload Complete!");
    console.log(`🌍 URL: https://sentinel.unweil.me/${contractAddress}/static_assets/index.html`);
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []) {
    const files = fs.readdirSync(dirPath);
    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            arrayOfFiles.push(path.join(dirPath, file));
        }
    });
    return arrayOfFiles;
}

main().catch(console.error);
