import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import crypto from 'crypto';

const FILEBASE_ACCESS_KEY = process.env.FILEBASE_ACCESS_KEY || '';
const FILEBASE_SECRET_KEY = process.env.FILEBASE_SECRET_KEY || '';
const FILEBASE_BUCKET = process.env.FILEBASE_BUCKET || 'weilchain-applets';

export async function POST(req: NextRequest) {
    try {
        if (!FILEBASE_ACCESS_KEY || !FILEBASE_SECRET_KEY) {
            return NextResponse.json(
                { error: 'Filebase credentials not configured' },
                { status: 500 }
            );
        }

        // Get file buffer from request body
        const buffer = await req.arrayBuffer();

        if (!buffer || buffer.byteLength === 0) {
            return NextResponse.json(
                { error: 'No file data received' },
                { status: 400 }
            );
        }

        console.log(`[Upload API] Uploading ${buffer.byteLength} bytes to Filebase...`);

        // Generate filename from content hash
        const hash = crypto.createHash('sha256').update(Buffer.from(buffer)).digest('hex');
        const extension = req.headers.get('x-file-extension') || 'bin';
        const fileName = `${hash.substring(0, 16)}.${extension}`;

        // Create S3 client for Filebase
        const s3Client = new S3Client({
            endpoint: 'https://s3.filebase.com',
            region: 'us-east-1',
            credentials: {
                accessKeyId: FILEBASE_ACCESS_KEY,
                secretAccessKey: FILEBASE_SECRET_KEY
            }
        });

        // Upload to Filebase
        const upload = new Upload({
            client: s3Client,
            params: {
                Bucket: FILEBASE_BUCKET,
                Key: fileName,
                Body: Buffer.from(buffer),
                ContentType: extension === 'wasm' ? 'application/wasm' : 'text/plain'
            }
        });

        await upload.done();

        console.log(`[Upload API] Success! File: ${fileName}`);

        // Return CID (Filebase uses the S3 key as the path)
        return NextResponse.json({
            cid: fileName,
            hash: hash,
            size: buffer.byteLength,
            url: `https://ipfs.filebase.io/ipfs/${fileName}`
        });

    } catch (error: any) {
        console.error('[Upload API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Upload failed' },
            { status: 500 }
        );
    }
}
