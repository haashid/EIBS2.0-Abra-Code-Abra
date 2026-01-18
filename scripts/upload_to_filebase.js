import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const FILEBASE_ACCESS_KEY = process.env.FILEBASE_ACCESS_KEY;
const FILEBASE_SECRET_KEY = process.env.FILEBASE_SECRET_KEY;
const FILEBASE_BUCKET = process.env.FILEBASE_BUCKET || 'weilchain-applets';

if (!FILEBASE_ACCESS_KEY || !FILEBASE_SECRET_KEY) {
    throw new Error('Filebase credentials not found in .env.local');
}

// Create S3 client configured for Filebase
const s3Client = new S3Client({
    endpoint: 'https://s3.filebase.com',
    region: 'us-east-1',
    credentials: {
        accessKeyId: FILEBASE_ACCESS_KEY,
        secretAccessKey: FILEBASE_SECRET_KEY
    }
});

/**
 * Upload a file to Filebase IPFS storage
 * @param {string} filePath - Absolute path to the file to upload
 * @param {string} customName - Optional custom name for the file (defaults to filename)
 * @returns {Promise<{cid: string, url: string}>} - IPFS CID and gateway URL
 */
export async function uploadToFilebase(filePath, customName = null) {
    try {
        const fileName = customName || path.basename(filePath);
        const fileContent = fs.readFileSync(filePath);

        // Generate a content hash for the CID
        const contentHash = crypto.createHash('sha256').update(fileContent).digest('hex');

        console.log(`\n📤 Uploading ${fileName} to Filebase IPFS...`);
        console.log(`   File size: ${(fileContent.length / 1024).toFixed(2)} KB`);

        const upload = new Upload({
            client: s3Client,
            params: {
                Bucket: FILEBASE_BUCKET,
                Key: fileName,
                Body: fileContent,
                ContentType: fileName.endsWith('.wasm') ? 'application/wasm' : 'text/plain'
            }
        });

        upload.on('httpUploadProgress', (progress) => {
            if (progress.loaded && progress.total) {
                const percent = Math.round((progress.loaded / progress.total) * 100);
                console.log(`   Progress: ${percent}%`);
            }
        });

        await upload.done();

        // Filebase uses the S3 key as the CID path
        // The actual IPFS CID can be retrieved via Filebase API or UI
        // For now, we'll return the key which can be accessed via gateway
        const cid = fileName; // In production, you'd fetch the actual CID from Filebase
        const gatewayUrl = `https://ipfs.filebase.io/ipfs/${fileName}`;

        console.log(`   ✅ Upload complete!`);
        console.log(`   📦 CID: ${cid}`);
        console.log(`   🌐 URL: ${gatewayUrl}\n`);

        return {
            cid,
            url: gatewayUrl,
            hash: contentHash
        };
    } catch (error) {
        console.error(`❌ Failed to upload ${filePath}:`, error.message);
        throw error;
    }
}

/**
 * Upload both WASM and WIDL files for an applet
 * @param {string} appletName - Name of

 the applet (e.g., "text_processor")
 * @returns {Promise<{wasmCid: string, widlCid: string, wasmUrl: string, widlUrl: string}>}
 */
export async function uploadAppletFiles(appletName) {
    const appletDir = path.resolve(__dirname, `../applets/${appletName}`);
    const targetDir = path.resolve(__dirname, '../applets/target/wasm32-unknown-unknown/release');

    const wasmPath = path.join(targetDir, `${appletName}.wasm`);
    const widlPath = path.join(appletDir, `${appletName}.widl`);

    // Check if files exist
    if (!fs.existsSync(wasmPath)) {
        throw new Error(`WASM file not found: ${wasmPath}`);
    }
    if (!fs.existsSync(widlPath)) {
        throw new Error(`WIDL file not found: ${widlPath}`);
    }

    console.log(`\n🚀 Uploading applet files for: ${appletName}`);

    // Upload WASM
    const wasmResult = await uploadToFilebase(wasmPath, `${appletName}.wasm`);

    // Upload WIDL
    const widlResult = await uploadToFilebase(widlPath, `${appletName}.widl`);

    return {
        wasmCid: wasmResult.cid,
        widlCid: widlResult.cid,
        wasmUrl: wasmResult.url,
        widlUrl: widlResult.url
    };
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
    const appletName = process.argv[2];

    if (!appletName) {
        console.error('❌ Usage: node upload_to_filebase.js <applet_name>');
        console.error('Example: node upload_to_filebase.js text_processor');
        process.exit(1);
    }

    uploadAppletFiles(appletName)
        .then(result => {
            console.log('\n✅ Upload Complete!');
            console.log('WASM CID:', result.wasmCid);
            console.log('WIDL CID:', result.widlCid);
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Upload Failed:', error.message);
            process.exit(1);
        });
}
