/**
 * Filebase/IPFS Service for Applet File Storage
 * Uses Filebase REST API directly (no ipfs-http-client dependency)
 */

const FILEBASE_RPC_ENDPOINT = process.env.NEXT_PUBLIC_FILEBASE_RPC_ENDPOINT || 'https://rpc.filebase.io';
const FILEBASE_GATEWAY = process.env.NEXT_PUBLIC_FILEBASE_GATEWAY || '';
const FILEBASE_RPC_KEY = process.env.NEXT_PUBLIC_FILEBASE_RPC_KEY || '';

export interface UploadedFile {
    cid: string;
    name: string;
    size: number;
    url: string;
}

/**
 * Upload a file to IPFS via Filebase REST API
 */
export async function uploadToIPFS(file: File): Promise<UploadedFile> {
    try {
        // Convert file to array buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        // Upload to our local API proxy to avoid CORS
        // The proxy will forward to Filebase with proper credentials
        const response = await fetch('/api/upload-ipfs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/octet-stream',
            },
            body: buffer,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Upload failed: ${response.statusText} - ${errorText}`);
        }

        const result = await response.json();

        // Filebase returns {cid: "QmXxxx..."}
        const cid = result.cid || result.Hash || result.hash;

        if (!cid) {
            console.error('Upload response:', result);
            throw new Error('No CID returned from upload');
        }

        const url = getIPFSUrl(cid);

        console.log(`File uploaded to IPFS: ${cid}`);

        return {
            cid,
            name: file.name,
            size: file.size,
            url,
        };
    } catch (error) {
        console.error('Failed to upload to IPFS:', error);
        throw new Error(`Failed to upload file to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Upload both WASM and WIDL files for an applet
 */
export async function uploadAppletFiles(
    wasmFile: File,
    widlFile: File
): Promise<{ wasm: UploadedFile; widl: UploadedFile }> {
    try {
        console.log('Uploading applet files to IPFS...');

        // Upload both files in parallel
        const [wasm, widl] = await Promise.all([
            uploadToIPFS(wasmFile),
            uploadToIPFS(widlFile),
        ]);

        console.log('Upload complete:', { wasm: wasm.cid, widl: widl.cid });

        return { wasm, widl };
    } catch (error) {
        console.error('Failed to upload applet files:', error);
        throw error;
    }
}

/**
 * Get public IPFS URL via Filebase gateway
 */
export function getIPFSUrl(cid: string): string {
    return `https://${FILEBASE_GATEWAY}/ipfs/${cid}`;
}

/**
 * Download file content from IPFS
 */
export async function downloadFromIPFS(cid: string): Promise<Blob> {
    const url = getIPFSUrl(cid);
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to download from IPFS: ${response.statusText}`);
    }

    return await response.blob();
}

/**
 * Trigger browser download for a file from IPFS
 */
export async function downloadFile(cid: string, filename: string): Promise<void> {
    try {
        const blob = await downloadFromIPFS(cid);
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Download failed:', error);
        throw error;
    }
}
