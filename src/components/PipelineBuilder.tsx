"use client";

import { useState, useEffect } from "react";
import { formatEther } from "viem";

interface Applet {
    id: number;
    name: string;
    price: bigint;
    inputSchema?: string;
    outputSchema?: string;
}

interface PipelineBuilderProps {
    availableApplets: Applet[];
    onExecute: (appletIds: number[], totalPrice: bigint, inputData: string) => void;
    isConnected: boolean;
    initialAppletId?: number | null;
}

export default function PipelineBuilder({ availableApplets, onExecute, isConnected, initialAppletId }: PipelineBuilderProps) {
    const [pipeline, setPipeline] = useState<Applet[]>([]);

    useEffect(() => {
        if (initialAppletId) {
            const match = availableApplets.find(a => a.id === initialAppletId);
            if (match) {
                setPipeline([match]);
            }
        }
    }, [initialAppletId, availableApplets]);
    const [inputData, setInputData] = useState("");

    const addToPipeline = (applet: Applet) => {
        setPipeline([...pipeline, applet]);
    };

    const removeFromPipeline = (index: number) => {
        const newPipeline = [...pipeline];
        newPipeline.splice(index, 1);
        setPipeline(newPipeline);
    };

    const moveUp = (index: number) => {
        if (index === 0) return;
        const newPipeline = [...pipeline];
        [newPipeline[index - 1], newPipeline[index]] = [newPipeline[index], newPipeline[index - 1]];
        setPipeline(newPipeline);
    };

    const moveDown = (index: number) => {
        if (index === pipeline.length - 1) return;
        const newPipeline = [...pipeline];
        [newPipeline[index + 1], newPipeline[index]] = [newPipeline[index], newPipeline[index + 1]];
        setPipeline(newPipeline);
    };

    const totalPrice = pipeline.reduce((sum, applet) => sum + applet.price, BigInt(0));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Available Applets */}
            <div className="lg:col-span-1 bg-gray-900/50 border border-gray-800 rounded-xl p-4 sm:p-6 h-fit order-2 lg:order-1">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-4">Available Applets</h3>
                <div className="space-y-3">
                    {availableApplets.map((applet) => (
                        <button
                            key={applet.id}
                            onClick={() => addToPipeline(applet)}
                            className="w-full text-left p-4 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 hover:border-blue-500 transition-all group"
                        >
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-200 group-hover:text-blue-400">{applet.name}</span>
                                <span className="text-xs font-mono text-gray-400">{formatEther(applet.price)} ETH</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Pipeline Stage */}
            <div className="lg:col-span-2 order-1 lg:order-2">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6 lg:p-8 min-h-[400px] sm:min-h-[500px] flex flex-col">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Pipeline Configuration</h3>

                    <div className="mb-4 sm:mb-6">
                        <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">Input Data (Text)</label>
                        <textarea
                            value={inputData}
                            onChange={(e) => setInputData(e.target.value)}
                            placeholder="Enter text to analyze..."
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors h-24 text-gray-200"
                        />
                    </div>

                    {pipeline.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-gray-800 rounded-xl p-12">
                            <span className="text-4xl mb-4">🔧</span>
                            <p>Select applets to build your pipeline</p>
                        </div>
                    ) : (
                        <div className="space-y-4 flex-1">
                            {pipeline.map((applet, idx) => {
                                // Validation Logic
                                let showError = false;
                                let errorMsg = "";
                                if (idx > 0) {
                                    const prevApplet = pipeline[idx - 1];
                                    const prevOutput = prevApplet.outputSchema || "JSON";
                                    const currentInput = applet.inputSchema || "JSON";
                                    if (prevOutput !== currentInput && prevOutput !== "JSON" && currentInput !== "JSON") {
                                        showError = true;
                                        errorMsg = `Type Mismatch: ${prevApplet.name} outputs ${prevOutput}, but ${applet.name} expects ${currentInput}`;
                                    }
                                }

                                return (
                                    <div key={idx} className="relative">
                                        {showError && (
                                            <div className="mb-2 p-2 bg-red-900/20 border border-red-500/50 rounded text-red-400 text-xs flex items-center gap-2">
                                                <span>⚠️</span> {errorMsg}
                                            </div>
                                        )}
                                        <div className="flex items-center">
                                            <div className="w-8 flex flex-col items-center mr-4">
                                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                                    {idx + 1}
                                                </div>
                                                {idx < pipeline.length - 1 && <div className="w-0.5 h-12 bg-gray-800 mt-2" />}
                                            </div>

                                            <div className="flex-1 p-4 bg-gray-800 rounded-lg border border-gray-700 flex justify-between items-center">
                                                <div>
                                                    <h4 className="font-bold text-white">{applet.name}</h4>
                                                    <span className="text-xs text-green-400 font-mono">
                                                        Input: {applet.inputSchema || "JSON"} → Output: {applet.outputSchema || "JSON"}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <div className="flex flex-col gap-1 mr-2">
                                                        <button
                                                            onClick={() => moveUp(idx)}
                                                            disabled={idx === 0}
                                                            className="text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                                        >
                                                            ▲
                                                        </button>
                                                        <button
                                                            onClick={() => moveDown(idx)}
                                                            disabled={idx === pipeline.length - 1}
                                                            className="text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                                        >
                                                            ▼
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => removeFromPipeline(idx)}
                                                        className="text-gray-500 hover:text-red-400 p-2 border-l border-gray-700 pl-4"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="mt-8 border-t border-gray-800 pt-6">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-gray-400">Total Cost</span>
                            <span className="text-2xl font-bold text-white font-mono">{formatEther(totalPrice)} ETH</span>
                        </div>

                        <button
                            onClick={() => onExecute(pipeline.map(p => p.id), totalPrice, inputData)}
                            disabled={pipeline.length === 0 || !isConnected}
                            className={`w-full py-4 font-bold rounded-xl transition-all shadow-lg ${pipeline.length > 0 && isConnected
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 hover:shadow-blue-500/25'
                                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            {!isConnected ? "Connect Wallet to Execute" : "Execute Pipeline"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
