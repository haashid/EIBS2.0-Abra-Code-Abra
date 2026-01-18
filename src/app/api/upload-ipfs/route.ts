import { NextRequest, NextResponse } from 'next/server';

const FILEBASE_RPC_ENDPOINT = process.env.NEXT_PUBLIC_FILEBASE_RPC_ENDPOINT || 'https://rpc.filebase.io';
const FILEBASE_RPC_KEY = process.env.NEXT_PUBLIC_FILEBASE_RPC_KEY || '';

export async function POST(req: NextRequest) {
    try {
        if (!FILEBASE_RPC_KEY) {
            return NextResponse.json(
                { error: 'Filebase credentials not configured on server' },
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

        console.log(`[Proxy] Uploading ${buffer.byteLength} bytes to Filebase IPFS...`);

        // Forward strict request to Filebase
        // Note: Filebase expects 'multipart/form-data' usually for /ipfs endpoint 
        // OR raw body if Content-Type is set. The previous implementation used octet-stream.
        // Let's try to maintain what the client was trying to do but from backend.

        const response = await fetch(`${FILEBASE_RPC_ENDPOINT}/ipfs`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${FILEBASE_RPC_KEY}`,
                'Content-Type': 'application/octet-stream',
            },
            body: buffer,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Proxy] Filebase error:', response.status, errorText);
            return NextResponse.json(
                { error: `Filebase upload failed: ${errorText}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        console.log('[Proxy] Filebase success:', data);

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[Proxy] Internal error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
