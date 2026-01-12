"use client";

import { useState } from "react";
import { useWeil } from "@/context/WeilProvider";

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

export default function RegisterAppletModal({ isOpen, onClose, onSuccess }: RegisterAppletModalProps) {
    const { wallet, isConnected, address } = useWeil();

    // Form state
    const [contractAddress, setContractAddress] = useState("");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("0.01");
    const [inputSchema, setInputSchema] = useState("Text");
    const [outputSchema, setOutputSchema] = useState("JSON");

    // Status
    const [isRegistering, setIsRegistering] = useState(false);
    const [progress, setProgress] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!contractAddress || !name) {
            setError("Contract address and name are required");
            return;
        }

        if (!isConnected || !wallet) {
            setError("Please connect your wallet first");
            return;
        }

        setIsRegistering(true);
        setError(null);
        setSuccess(false);

        try {
            setProgress("Registering on-chain...");

            if (!REGISTRY_ADDRESS) {
                throw new Error("Registry contract address not configured");
            }

            const priceUint = Math.floor(parseFloat(price) * 1e18);

            // Call the registry contract to register the applet
            const result = await (wallet as any).contracts.execute(
                REGISTRY_ADDRESS,
                "register_applet",
                {
                    name,
                    description,
                    price: priceUint,
                    applet_address: contractAddress,
                    input_schema: inputSchema,
                    output_schema: outputSchema
                }
            );

            console.log("Registration result:", result);
            setProgress("Done!");
            setSuccess(true);

            if (onSuccess) {
                onSuccess({
                    contractAddress,
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
                        <h2 className="text-xl font-bold text-white">📝 Register Applet</h2>
                        <p className="text-sm text-gray-400">Add your deployed applet to the marketplace</p>
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
                        <strong>Step 2:</strong> Paste your contract address below<br />
                        <strong>Step 3:</strong> Fill in details and register
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleRegister} className="p-6 space-y-4">
                    {/* Contract Address */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">
                            Contract Address *
                        </label>
                        <input
                            type="text"
                            value={contractAddress}
                            onChange={(e) => setContractAddress(e.target.value)}
                            placeholder="aaaaaa..."
                            required
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-blue-500"
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

                    {/* Description */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What does your applet do?"
                            rows={2}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
                        />
                    </div>

                    {/* Price */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Price per call (ETH)</label>
                        <input
                            type="number"
                            step="0.001"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Schema Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Input Type</label>
                            <select
                                value={inputSchema}
                                onChange={(e) => setInputSchema(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                            >
                                <option value="Text">Text</option>
                                <option value="JSON">JSON</option>
                                <option value="Number">Number</option>
                                <option value="Binary">Binary</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Output Type</label>
                            <select
                                value={outputSchema}
                                onChange={(e) => setOutputSchema(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                            >
                                <option value="JSON">JSON</option>
                                <option value="Text">Text</option>
                                <option value="Number">Number</option>
                                <option value="Binary">Binary</option>
                            </select>
                        </div>
                    </div>

                    {/* Progress */}
                    {isRegistering && (
                        <div className="p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                <span className="text-blue-300">{progress}</span>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Success */}
                    {success && (
                        <div className="p-4 bg-green-900/30 border border-green-700 rounded-lg">
                            <p className="text-green-400 font-medium">✓ Registered Successfully!</p>
                            <p className="text-sm text-gray-300 mt-1">
                                Your applet is now live on the marketplace.
                            </p>
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
                            disabled={isRegistering || !contractAddress || !name || !isConnected}
                            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isRegistering ? "Registering..." : "Register Applet"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
