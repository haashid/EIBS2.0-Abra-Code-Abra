"use client";

import { useState, useRef } from "react";
import { useDeployContract } from "@/hooks/useDeployContract";
import { useWeil } from "@/context/WeilProvider";

interface DeployContractModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (address: string) => void;
}

export default function DeployContractModal({
    isOpen,
    onClose,
    onSuccess,
}: DeployContractModalProps) {
    const { isConnected } = useWeil();
    const { deployContract, isDeploying, deployedAddress, error } = useDeployContract();

    const [wasmFile, setWasmFile] = useState<File | null>(null);
    const [widlFile, setWidlFile] = useState<File | null>(null);
    const [author, setAuthor] = useState("");
    const [description, setDescription] = useState("");

    const wasmInputRef = useRef<HTMLInputElement>(null);
    const widlInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleDeploy = async () => {
        if (!wasmFile || !widlFile) {
            alert("Please select both WASM and WIDL files");
            return;
        }

        try {
            const address = await deployContract(wasmFile, widlFile, {
                author: author || undefined,
                description: description || undefined,
            });

            if (onSuccess) {
                onSuccess(address);
            }
        } catch (err) {
            console.error("Deployment failed:", err);
        }
    };

    const handleClose = () => {
        setWasmFile(null);
        setWidlFile(null);
        setAuthor("");
        setDescription("");
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-xl p-6 w-full max-w-lg mx-4 border border-cyan-500/30">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">🚀 Deploy Contract</h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-white text-2xl"
                    >
                        ×
                    </button>
                </div>

                {!isConnected ? (
                    <div className="text-center py-8">
                        <p className="text-gray-400 mb-4">Please connect your wallet to deploy</p>
                    </div>
                ) : deployedAddress ? (
                    <div className="text-center py-8">
                        <div className="text-5xl mb-4">✅</div>
                        <h3 className="text-xl font-bold text-green-400 mb-4">Deployed Successfully!</h3>
                        <div className="bg-gray-800 rounded-lg p-4 mb-4">
                            <p className="text-gray-400 text-sm mb-2">Contract Address:</p>
                            <p className="text-cyan-400 font-mono text-sm break-all">{deployedAddress}</p>
                        </div>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(deployedAddress);
                                alert("Address copied!");
                            }}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg mr-2"
                        >
                            📋 Copy Address
                        </button>
                        <button
                            onClick={handleClose}
                            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                        >
                            Done
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* WASM File */}
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">WASM File *</label>
                            <div
                                onClick={() => wasmInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition ${wasmFile
                                        ? "border-green-500 bg-green-500/10"
                                        : "border-gray-600 hover:border-cyan-500"
                                    }`}
                            >
                                {wasmFile ? (
                                    <div className="text-green-400">
                                        ✅ {wasmFile.name} ({(wasmFile.size / 1024).toFixed(1)} KB)
                                    </div>
                                ) : (
                                    <div className="text-gray-400">
                                        📦 Click to select .wasm file
                                    </div>
                                )}
                            </div>
                            <input
                                ref={wasmInputRef}
                                type="file"
                                accept=".wasm"
                                className="hidden"
                                onChange={(e) => setWasmFile(e.target.files?.[0] || null)}
                            />
                        </div>

                        {/* WIDL File */}
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">WIDL File *</label>
                            <div
                                onClick={() => widlInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition ${widlFile
                                        ? "border-green-500 bg-green-500/10"
                                        : "border-gray-600 hover:border-cyan-500"
                                    }`}
                            >
                                {widlFile ? (
                                    <div className="text-green-400">
                                        ✅ {widlFile.name}
                                    </div>
                                ) : (
                                    <div className="text-gray-400">
                                        📄 Click to select .widl file
                                    </div>
                                )}
                            </div>
                            <input
                                ref={widlInputRef}
                                type="file"
                                accept=".widl"
                                className="hidden"
                                onChange={(e) => setWidlFile(e.target.files?.[0] || null)}
                            />
                        </div>

                        {/* Optional Fields */}
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">Author (optional)</label>
                            <input
                                type="text"
                                value={author}
                                onChange={(e) => setAuthor(e.target.value)}
                                placeholder="Your name"
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-400 text-sm mb-2">Description (optional)</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What does this contract do?"
                                rows={2}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                            />
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Deploy Button */}
                        <button
                            onClick={handleDeploy}
                            disabled={!wasmFile || !widlFile || isDeploying}
                            className={`w-full py-3 rounded-lg font-bold transition ${!wasmFile || !widlFile || isDeploying
                                    ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                                    : "bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white"
                                }`}
                        >
                            {isDeploying ? (
                                <span className="flex items-center justify-center">
                                    <span className="animate-spin mr-2">⏳</span>
                                    Deploying...
                                </span>
                            ) : (
                                "🚀 Deploy Contract"
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
