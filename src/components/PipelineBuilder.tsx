"use client";

import { useState } from "react";
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
}

export default function PipelineBuilder({ availableApplets, onExecute, isConnected }: PipelineBuilderProps) {
    const [pipeline, setPipeline] = useState<Applet[]>([]);
    const [inputData, setInputData] = useState("");

    const addToPipeline = (applet: Applet) => {
        setPipeline([...pipeline, applet]);
    };

    const removeFromPipeline = (index: number) => {
        const newPipeline = [...pipeline];
        newPipeline.splice(index, 1);
        setPipeline(newPipeline);
    };

    const totalPrice = pipeline.reduce((sum, applet) => sum + applet.price, 0n);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Available Applets */}
            <div className="lg:col-span-1 bg-gray-900/50 border border-gray-800 rounded-xl p-6 h-fit">
                <h3 className="text-xl font-bold text-white mb-4">Available Applets</h3>
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
            <div className="lg:col-span-2">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 min-h-[500px] flex flex-col">
                    <h3 className="text-xl font-bold text-white mb-6">Pipeline Configuration</h3>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-400 mb-2">Input Data (Text)</label>
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
                            {pipeline.map((applet, idx) => (
                                <div key={idx} className="relative flex items-center">
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
                                        <button
                                            onClick={() => removeFromPipeline(idx)}
                                            className="text-gray-500 hover:text-red-400 p-2"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}
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
