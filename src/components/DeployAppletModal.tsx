"use client";

import { useState, useRef } from "react";
import { useDeployApplet } from "@/hooks/useDeployApplet";

interface DeployAppletModalProps {
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

export default function DeployAppletModal({ isOpen, onClose, onSuccess }: DeployAppletModalProps) {
    const { deployAndRegister, isDeploying, deploymentProgress, error, result } = useDeployApplet();

    // Form state
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("0.01");
    const [inputSchema, setInputSchema] = useState("Text");
    const [outputSchema, setOutputSchema] = useState("JSON");

    // File refs
    const wasmInputRef = useRef<HTMLInputElement>(null);
    const widlInputRef = useRef<HTMLInputElement>(null);
    const [wasmFile, setWasmFile] = useState<File | null>(null);
    const [widlFile, setWidlFile] = useState<File | null>(null);

    const handleDeploy = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!wasmFile) {
            alert("Please select a WASM file");
            return;
        }

        const deploymentResult = await deployAndRegister(wasmFile, widlFile, {
            name,
            description,
            price,
            inputSchema,
            outputSchema
        });

        if (deploymentResult && onSuccess) {
            onSuccess({
                contractAddress: deploymentResult.contractAddress,
                name,
                description,
                price,
                inputSchema,
                outputSchema
            });
        }
    };

    const resetForm = () => {
        setName("");
        setDescription("");
        setPrice("0.01");
        setWasmFile(null);
        setWidlFile(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <div>
                        <h2 className="text-xl font-bold text-white">🚀 Deploy Applet</h2>
                        <p className="text-sm text-gray-400">Upload, deploy & register in one step</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-2xl"
                    >
                        ×
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleDeploy} className="p-6 space-y-4">
                    {/* WASM Upload */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">
                            WASM File *
                        </label>
                        <input
                            ref={wasmInputRef}
                            type="file"
                            accept=".wasm"
                            onChange={(e) => setWasmFile(e.target.files?.[0] || null)}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => wasmInputRef.current?.click()}
                            className="w-full p-4 border-2 border-dashed border-gray-600 rounded-lg hover:border-blue-500 transition-colors text-center"
                        >
                            {wasmFile ? (
                                <div className="flex items-center justify-center gap-2 text-green-400">
                                    <span>✓</span>
                                    <span>{wasmFile.name}</span>
                                    <span className="text-gray-500 text-sm">({(wasmFile.size / 1024).toFixed(1)} KB)</span>
                                </div>
                            ) : (
                                <div className="text-gray-400">
                                    <div className="text-2xl mb-1">📦</div>
                                    Click to upload .wasm file
                                </div>
                            )}
                        </button>
                    </div>

                    {/* WIDL Upload (optional) */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">
                            WIDL File (optional)
                        </label>
                        <input
                            ref={widlInputRef}
                            type="file"
                            accept=".widl"
                            onChange={(e) => setWidlFile(e.target.files?.[0] || null)}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => widlInputRef.current?.click()}
                            className="w-full p-3 border border-gray-700 rounded-lg hover:border-gray-500 transition-colors text-center text-sm"
                        >
                            {widlFile ? (
                                <span className="text-green-400">✓ {widlFile.name}</span>
                            ) : (
                                <span className="text-gray-500">+ Add interface definition</span>
                            )}
                        </button>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Applet Name *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Text Analyzer"
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
                            <label className="block text-sm text-gray-400 mb-2">Input</label>
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
                            <label className="block text-sm text-gray-400 mb-2">Output</label>
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
                    {isDeploying && (
                        <div className="p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                <span className="text-blue-300">{deploymentProgress}</span>
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
                    {result && (
                        <div className="p-4 bg-green-900/30 border border-green-700 rounded-lg">
                            <p className="text-green-400 font-medium mb-2">✓ Deployed Successfully!</p>
                            <p className="text-sm text-gray-300 break-all">
                                Address: <code className="text-green-300">{result.contractAddress}</code>
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
                            disabled={isDeploying || !wasmFile || !name}
                            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isDeploying ? "Deploying..." : "🚀 Deploy & Register"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
