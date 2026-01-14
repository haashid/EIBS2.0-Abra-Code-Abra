
import fs from 'fs';
import path from 'path';

const filePath = 'applets/nexus_frontend/nexus_frontend.widl';

try {
    const buffer = fs.readFileSync(filePath);
    console.log("First 20 bytes (hex):");
    console.log(buffer.subarray(0, 20).toString('hex'));
    console.log("\nFirst 20 bytes (string):");
    console.log(buffer.subarray(0, 20).toString('utf8'));

    // Check for UTF-8 BOM (EF BB BF)
    if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        console.log("⚠️  UTF-8 BOM DETECTED!");
    } else {
        console.log("✅ No UTF-8 BOM detected.");
    }
} catch (e) {
    console.error("Error reading file:", e.message);
}
