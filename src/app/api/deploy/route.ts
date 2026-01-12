import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Temp directory for uploaded files
const TEMP_DIR = join(process.cwd(), '.tmp', 'deployments');

export async function POST(request: NextRequest) {
    try {
        // Get form data
        const formData = await request.formData();
        const wasmFile = formData.get('wasm') as File;
        const widlFile = formData.get('widl') as File | null;
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;

        if (!wasmFile) {
            return NextResponse.json({ error: 'WASM file is required' }, { status: 400 });
        }

        // Create temp directory
        await mkdir(TEMP_DIR, { recursive: true });

        // Generate unique ID for this deployment
        const deployId = `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
        const wasmPath = join(TEMP_DIR, `${deployId}.wasm`);
        const widlPath = join(TEMP_DIR, `${deployId}.widl`);

        // Save WASM file
        const wasmBuffer = Buffer.from(await wasmFile.arrayBuffer());
        await writeFile(wasmPath, wasmBuffer);

        // Save WIDL file if provided
        if (widlFile) {
            const widlBuffer = Buffer.from(await widlFile.arrayBuffer());
            await writeFile(widlPath, widlBuffer);
        }

        try {
            // Deploy using wadk CLI
            let deployCommand: string;
            if (widlFile) {
                deployCommand = `wadk deploy "${wasmPath}" "${widlPath}" --name "${name}"`;
            } else {
                deployCommand = `wadk deploy "${wasmPath}" --name "${name}"`;
            }

            console.log('Executing deployment command:', deployCommand);

            const { stdout, stderr } = await execAsync(deployCommand, {
                timeout: 60000, // 60 second timeout
                env: {
                    ...process.env,
                    PATH: `${process.env.PATH};${process.env.USERPROFILE}\\.cargo\\bin`
                }
            });

            console.log('Deploy stdout:', stdout);
            if (stderr) console.log('Deploy stderr:', stderr);

            // Parse the output to get contract address
            // Expected format: Contract deployed at: <address>
            const addressMatch = stdout.match(/[a-z0-9]{50,}/i) || stdout.match(/Contract.*?:\s*([a-zA-Z0-9]+)/);
            const contractAddress = addressMatch ? addressMatch[0] : null;

            if (!contractAddress) {
                // If we can't parse the address, return the full output
                return NextResponse.json({
                    success: true,
                    message: 'Deployment command executed',
                    output: stdout,
                    warning: 'Could not parse contract address from output'
                });
            }

            return NextResponse.json({
                success: true,
                contractAddress,
                transactionId: `tx_${Date.now()}`,
                message: 'Contract deployed successfully'
            });

        } finally {
            // Cleanup temp files
            try {
                await unlink(wasmPath);
                if (widlFile) await unlink(widlPath);
            } catch {
                // Ignore cleanup errors
            }
        }

    } catch (error: any) {
        console.error('Deployment error:', error);

        // Check if wadk is not installed
        if (error.message?.includes('not recognized') || error.message?.includes('not found')) {
            return NextResponse.json({
                error: 'wadk CLI not installed or not in PATH',
                details: 'Please install wadk: npm install -g @weilliptic/wadk',
                fullError: error.message
            }, { status: 500 });
        }

        return NextResponse.json({
            error: 'Deployment failed',
            details: error.message
        }, { status: 500 });
    }
}
