"use client";

import { useState } from "react";
import { useWeil } from "@/context/WeilProvider";
import { parseWIDL, validateAppletWIDL, type ParsedWIDL } from "@/lib/widlParser";
import { uploadAppletFiles } from "@/services/filebaseService";

const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_WEIL_REGISTRY_ADDRESS || "";

interface RegisterAppletModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (appletData: {
        contractAddress: string;
        name: string;
        description: string;
        price: string;
        inputSchema: string;
        outputSchema: string;
    }) => void;
}

type DeploymentStep = 'upload' | 'deploying' | 'registering' | 'done';

export default function RegisterAppletModal({ isOpen, onClose, onSuccess }: RegisterAppletModalProps) {
    const { wallet, isConnected, address } = useWeil();

    // Form state
    const [contractAddress, setContractAddress] = useState("");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [functions, setFunctions] = useState(""); // New state for functions list
    const [price, setPrice] = useState("0.01");
    const [purchasePrice, setPurchasePrice] = useState("0.1"); // Price to buy applet files
    const [inputSchema, setInputSchema] = useState("Text");
    const [outputSchema, setOutputSchema] = useState("JSON");

    // File upload state
    const [wasmFile, setWasmFile] = useState<File | null>(null);
    const [widlFile, setWidlFile] = useState<File | null>(null);
    const [parsedWIDL, setParsedWIDL] = useState<ParsedWIDL | null>(null);
    const [useFileUpload, setUseFileUpload] = useState(false);

    // IPFS CIDs
    const [wasmCid, setWasmCid] = useState<string>("");
    const [widlCid, setWidlCid] = useState<string>("");

    // Status
    const [deploymentStep, setDeploymentStep] = useState<DeploymentStep>('upload');
    const [isRegistering, setIsRegistering] = useState(false);
    const [progress, setProgress] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [txHash, setTxHash] = useState<string>("");

    // Handle WIDL file upload
    const handleWidlUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.widl')) {
            setError('Please upload a .widl file');
            return;
        }

        try {
            const content = await file.text();
            const parsed = parseWIDL(content);
            const validation = validateAppletWIDL(parsed);

            if (!validation.valid) {
                setError(validation.error || 'Invalid WIDL file');
                return;
            }

            setWidlFile(file);
            setParsedWIDL(parsed);

            // Auto-fill schemas from parsed WIDL
            if (parsed.inputSchema) {
                setInputSchema(parsed.inputSchema);
            }
            if (parsed.outputSchema) {
                setOutputSchema(parsed.outputSchema);
            }

            // Extract name from interface if not set
            if (parsed.interfaces.length > 0) {
                if (!name) setName(parsed.interfaces[0].name);

                // Auto-extract functions (parser uses 'functions' not 'methods')
                const funcs = parsed.interfaces[0].functions;
                if (funcs && funcs.length > 0) {
                    const methods = funcs.map(m => m.name).join(", ");
                    setFunctions(methods);
                }
            }

            setError(null);
        } catch (err) {
            setError('Failed to parse WIDL file');
            console.error(err);
        }
    };

    // Handle WASM file upload
    const handleWasmUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.wasm')) {
            setError('Please upload a .wasm file');
            return;
        }

        setWasmFile(file);
        setError(null);
    };

    // Upload files to IPFS via Filebase
    const uploadFilesToIPFS = async (): Promise<{ wasmCid: string; widlCid: string }> => {
        if (!wasmFile || !widlFile || !wallet) {
            throw new Error('Missing required files or wallet');
        }

        setDeploymentStep('deploying');
        setProgress('Uploading files to Filebase IPFS...');

        try {
            // Upload both files to IPFS
            const { wasm, widl } = await uploadAppletFiles(wasmFile, widlFile);

            console.log('Files uploaded to IPFS:', {
                wasmCid: wasm.cid,
                widlCid: widl.cid
            });

            setWasmCid(wasm.cid);
            setWidlCid(widl.cid);

            return { wasmCid: wasm.cid, widlCid: widl.cid };

        } catch (err: any) {
            console.error('IPFS upload failed:', err);
            throw new Error(`File upload failed: ${err.message}`);
        }
    };

    // Deploy WASM applet to WeilChain
    const deployApplet = async (): Promise<string> => {
        if (!wasmFile || !widlFile || !wallet) {
            throw new Error('Missing required files or wallet');
        }

        setDeploymentStep('deploying');
        setProgress('Deploying WASM applet...');

        try {
            // Read files as base64/binary
            const wasmArrayBuffer = await wasmFile.arrayBuffer();
            const widlContent = await widlFile.text();

            console.log('Deploying applet:', {
                wasmSize: wasmArrayBuffer.byteLength,
                widlLength: widlContent.length
            });

            // Deploy using WeilChain SDK
            // Note: This is a placeholder - actual deployment method may vary
            const deployResult = await (wallet as any).contracts.deploy({
                wasm: new Uint8Array(wasmArrayBuffer),
                widl: widlContent,
                name: name
            });

            const deployedAddress = deployResult?.contract_address || deployResult?.address;

            if (!deployedAddress) {
                throw new Error('Failed to get deployed contract address');
            }

            console.log('Deployed to:', deployedAddress);
            return deployedAddress;

        } catch (err: any) {
            console.error('Deployment failed:', err);
            throw new Error(`Deployment failed: ${err.message}`);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isConnected) {
            setError('Please connect your WAuth wallet');
            return;
        }

        // Validate required fields
        if (!name || !description || !price) {
            setError('Please fill in all required fields');
            return;
        }

        // Require either contract address OR files for deployment
        if (!contractAddress && (!wasmFile || !widlFile)) {
            setError('Please provide a contract address OR upload WASM + WIDL files');
            return;
        }

        setIsRegistering(true);
        setError(null);
        setProgress("Starting registration...");

        try {
            let finalContractAddress = contractAddress;
            let finalWasmCid = "";
            let finalWidlCid = "";

            // If user already has a contract address, skip IPFS (contract is already deployed)
            // Only try IPFS upload if deploying new contract via files
            if (!contractAddress && wasmFile && widlFile) {
                try {
                    const { wasmCid: uploadedWasmCid, widlCid: uploadedWidlCid } = await uploadFilesToIPFS();
                    finalWasmCid = uploadedWasmCid;
                    finalWidlCid = uploadedWidlCid;
                } catch (ipfsError) {
                    // IPFS upload failed but we can continue without it
                    console.warn('IPFS upload failed (non-critical):', ipfsError);
                    setProgress("IPFS upload skipped, continuing with registration...");
                }

                // Deploy the contract
                if (useFileUpload) {
                    finalContractAddress = await deployApplet();
                }
            }

            if (!finalContractAddress) {
                throw new Error('Contract address is required');
            }

            setDeploymentStep('registering');
            setProgress("Registering applet in marketplace...");

            if (!REGISTRY_ADDRESS) {
                throw new Error("Registry contract address not configured");
            }

            const priceUint = Math.floor(parseFloat(price) * 1e18);
            const purchasePriceUint = Math.floor(parseFloat(purchasePrice) * 1e18);

            // Combine functions and IPFS CIDs into description for display/storage
            const ipfsInfo = (finalWasmCid || finalWidlCid)
                ? `\n\n[WASM: ${finalWasmCid || 'none'}]\n[WIDL: ${finalWidlCid || 'none'}]`
                : "";

            const finalDescription = (functions
                ? `[Functions: ${functions}]\n\n${description}`
                : description) + ipfsInfo;

            // Call the registry contract to register the applet
            // ONLY send fields defined in applet_registry.widl: name, description, applet_address, price, input_schema, output_schema
            // We now store IPFS CIDs inside the description field!
            const registrationArgs = {
                name,
                description: finalDescription,
                applet_address: finalContractAddress,
                price: priceUint,
                input_schema: inputSchema,
                output_schema: outputSchema
            };

            console.log("Registering with description including IPFS CIDs:", finalDescription);

            console.log("Registering with description including IPFS CIDs:", finalDescription);

            let result;
            let attempts = 0;
            const maxAttempts = 3;

            while (attempts < maxAttempts) {
                try {
                    attempts++;
                    console.log(`Attempt ${attempts} of ${maxAttempts} to register applet...`);

                    result = await (wallet as any).contracts.execute(
                        REGISTRY_ADDRESS,
                        "register_applet",
                        registrationArgs
                    );

                    // If we get a result but it indicates timeout failure (HTTP 417), throw to trigger retry
                    if (result?.message === 'deadline has elapsed' || (result?.status === 'failure' && result?.message?.includes('deadline'))) {
                        throw new Error('deadline has elapsed');
                    }

                    break; // Success or non-retryable error
                } catch (err: any) {
                    console.warn(`Attempt ${attempts} failed:`, err.message || err);
                    if (attempts >= maxAttempts) throw err;

                    // Wait 2s, 4s, etc.
                    const delay = attempts * 2000;
                    setProgress(`Network is busy. Retrying in ${delay / 1000}s... (Attempt ${attempts}/${maxAttempts})`);
                    await new Promise(r => setTimeout(r, delay));
                }
            }

            console.log("=== REGISTRATION RESPONSE ==");
            console.log("Raw result:", result);
            console.log("Result type:", typeof result);

            // Inspect critical fields
            console.log("status:", result?.status);
            console.log("txn_result:", result?.txn_result);
            console.log("data:", result?.data);
            console.log("message:", result?.message);
            console.log("error:", result?.error);
            console.log("Err:", result?.Err);
            console.log("method_kind:", result?.method_kind);
            console.log("contract_address:", result?.contract_address);

            // Check all possible failure indicators
            const isFailed =
                result?.status === 'failure' ||
                result?.status === 'error' ||
                result?.txn_result?.Err ||
                result?.Err ||
                result?.error ||
                result?.message?.toLowerCase?.()?.includes?.('error') ||
                result?.message?.toLowerCase?.()?.includes?.('fail');

            if (isFailed) {
                const errMsg = result?.message || result?.txn_result?.Err || result?.Err || result?.error || 'Unknown error';
                console.error("Transaction FAILED:", errMsg);
                throw new Error(`Transaction failed: ${JSON.stringify(errMsg)}`);
            }

            // Check if we got a transaction ID (indicates submission at least)
            const txId = result?.transaction_id || result?.txId || result?.requestId;
            console.log("Transaction ID:", txId);
            console.log("=== END ANALYSIS ===");

            setProgress("Done!");
            setSuccess(true);

            if (onSuccess) {
                onSuccess({
                    contractAddress: txId || '',
                    name,
                    description,
                    price,
                    inputSchema,
                    outputSchema
                });
            }

        } catch (err: any) {
            const msg = err.message || JSON.stringify(err);
            setError(msg);
            console.error("Registration failed:", err);
        } finally {
            setIsRegistering(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <div>
                        <h2 className="text-xl font-bold text-white">📝 Publish Your Applet</h2>
                        <p className="text-xs text-gray-500 mt-1">The on-chain address of your deployed applet</p>
                    </div>

                    {/* File Uploads (Optional) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-blue-500/30 transition-colors">
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">
                                WIDL Interface
                                <span className="text-xs text-gray-500 ml-1">(Optional)</span>
                            </label>
                            <input
                                type="file"
                                accept=".widl"
                                onChange={handleWidlUpload}
                                className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-900/20 file:text-blue-400 hover:file:bg-blue-900/30"
                            />
                            {parsedWIDL && (
                                <p className="text-xs text-green-400 mt-1">✓ Valid Interface</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">
                                WASM Binary
                                <span className="text-xs text-gray-500 ml-1">(Optional)</span>
                            </label>
                            <input
                                type="file"
                                accept=".wasm"
                                onChange={handleWasmUpload}
                                className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-900/20 file:text-purple-400 hover:file:bg-purple-900/30"
                            />
                            {wasmFile && (
                                <p className="text-xs text-green-400 mt-1">✓ {wasmFile.name}</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-2xl"
                    >
                        ×
                    </button>
                </div>

                {/* Instructions */}
                <div className="p-4 mx-6 mt-4 bg-blue-900/20 border border-blue-800 rounded-lg">
                    <p className="text-blue-300 text-sm">
                        <strong>Step 1:</strong> Deploy your applet via <a href="https://unweil.me" target="_blank" className="underline">unweil.me</a> or CLI<br />
                        <strong>Step 2:</strong> Enter your deployed contract address below<br />
                        <strong>Step 3:</strong> Fill in details and publish
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleRegister} className="p-6 space-y-4">
                    {/* Contract Address */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Contract Address *</label>
                        <input
                            type="text"
                            value={contractAddress}
                            onChange={(e) => setContractAddress(e.target.value)}
                            placeholder="aaaaaa..."
                            required
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Applet Name *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. AI Summarizer"
                            required
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Functions */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Exposed Functions</label>
                        <input
                            type="text"
                            value={functions}
                            onChange={(e) => setFunctions(e.target.value)}
                            placeholder="e.g. process_text, update_config (comma separated)"
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Key functions available to callers (auto-filled if WIDL uploaded)</p>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Description *</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe what your applet does..."
                            required
                            rows={3}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Price */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Usage Price (YTK) *</label>
                        <div className="relative">
                            <input
                                type="number"
                                step="0.0001"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                required
                                className="w-full pl-4 pr-12 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                                YTK
                            </div>
                        </div>
                    </div>

                    {/* Status Messages */}
                    {isRegistering && (
                        <div className="p-3 bg-blue-900/20 border border-blue-800 rounded-lg flex items-center gap-3">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-blue-400 text-sm">{progress}</span>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="p-3 bg-green-900/20 border border-green-800 rounded-lg text-green-400 text-sm">
                            Applet published successfully! It uses your contract address.
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isRegistering || !name || !contractAddress || !isConnected}
                            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isRegistering ? "Publishing..." : "Publish Applet"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
