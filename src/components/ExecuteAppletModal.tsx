"use client";

import { useState } from "react";
import { useWeil } from "@/context/WeilProvider";

interface ExecuteAppletModalProps {
    isOpen: boolean;
    onClose: () => void;
    appletAddress?: string;
    appletName?: string;
    onSuccess?: (result: any) => void;
}

export default function ExecuteAppletModal({
    isOpen,
    onClose,
    appletAddress: initialAddress = "",
    appletName = "Applet",
    onSuccess
}: ExecuteAppletModalProps) {
    const { isConnected, wallet, executeContract } = useWeil();

    const [appletAddress, setAppletAddress] = useState(initialAddress);
    const [methodName, setMethodName] = useState("");
    const [argsJson, setArgsJson] = useState("{}");
    const [isExecuting, setIsExecuting] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleExecute = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!appletAddress || !methodName) {
            setError("Applet address and method name are required");
            return;
        }

        if (!isConnected || !wallet) {
            setError("Please connect your wallet first");
            return;
        }

        setIsExecuting(true);
        setError(null);
        setResult(null);

        try {
            // Parse args JSON
            let args = {};
            try {
                args = JSON.parse(argsJson);
            } catch {
                setError("Invalid JSON in arguments");
                setIsExecuting(false);
                return;
            }

            console.log("Executing applet:", { appletAddress, methodName, args });

            // Call the applet contract
            const execResult = await executeContract(
                appletAddress,
                methodName,
                args
            );

            console.log("Execution result:", execResult);
            setResult(execResult);

            if (onSuccess) {
                onSuccess(execResult);
            }

        } catch (err: any) {
            const msg = err.message || JSON.stringify(err);
            setError(msg);
            console.error("Execution failed:", err);
        } finally {
            setIsExecuting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <div>
                        <h2 className="text-xl font-bold text-white">🚀 Execute Applet</h2>
                        <p className="text-sm text-gray-400">Invoke an applet method directly</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-2xl"
                    >
                        ×
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleExecute} className="p-6 space-y-4">
                    {/* Applet Address */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Applet Contract Address *</label>
                        <input
                            type="text"
                            value={appletAddress}
                            onChange={(e) => setAppletAddress(e.target.value)}
                            placeholder="aaaaaa..."
                            required
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Method Name */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Method Name *</label>
                        <input
                            type="text"
                            value={methodName}
                            onChange={(e) => setMethodName(e.target.value)}
                            placeholder="e.g. generate, process, calculate"
                            required
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Arguments JSON */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Arguments (JSON)</label>
                        <textarea
                            value={argsJson}
                            onChange={(e) => setArgsJson(e.target.value)}
                            placeholder='{"input": "hello world"}'
                            rows={4}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-blue-500 resize-none"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Result */}
                    {result && (
                        <div className="p-4 bg-green-900/30 border border-green-700 rounded-lg">
                            <p className="text-green-400 font-medium mb-2">✓ Execution Complete!</p>
                            <pre className="text-xs text-gray-300 overflow-x-auto">
                                {JSON.stringify(result, null, 2)}
                            </pre>
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
                            disabled={isExecuting || !appletAddress || !methodName || !isConnected}
                            className="flex-1 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isExecuting ? "Executing..." : "Execute"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
