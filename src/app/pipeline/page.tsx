"use client";

import Navbar from "@/components/Navbar";
import PipelineBuilder from "@/components/PipelineBuilder";
import { parseEther, formatEther } from "viem";
import { useState } from "react";
import Sentiment from "sentiment";
import { useMockData } from "@/context/MockDataContext";
import { useAccount } from "wagmi";



export default function PipelinePage() {
    const { isConnected } = useAccount();
    const { applets, logExecution } = useMockData();
    const [executionResult, setExecutionResult] = useState<string | null>(null);
    const [sentimentResult, setSentimentResult] = useState<any>(null);
    const [summaryResult, setSummaryResult] = useState<string | null>(null);

    // Convert price string to bigint for compatibility with existing components
    const availableApplets = applets.map(a => ({
        ...a,
        price: parseEther(a.price)
    }));

    const handleExecute = async (appletIds: number[], totalPrice: bigint, inputData: string) => {
        setExecutionResult("processing");
        setSentimentResult(null);
        setSummaryResult(null);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Logic for Applet ID 1: Sentiment Analysis
        if (appletIds.includes(1)) {
            const sentiment = new Sentiment();
            const result = sentiment.analyze(inputData);
            setSentimentResult(result);
        }

        // Logic for Applet ID 5: AI Summarizer (Heuristic)
        if (appletIds.includes(5)) {
            // Simple heuristic directly in client: take first 2 sentences
            const sentences = inputData.match(/[^.!?]+[.!?]+/g) || [inputData];
            const summary = sentences.slice(0, 2).join(" ");
            setSummaryResult(summary || "Could not generate summary.");
        }

        // Log to history (Mock Persistence)
        logExecution(appletIds, formatEther(totalPrice), { sentiment: sentimentResult, summary: summaryResult });

        setExecutionResult("success");
    };

    return (
        <div className="min-h-screen bg-black text-gray-200 font-sans selection:bg-blue-500/30">
            <Navbar />

            <main className="max-w-7xl mx-auto px-6 py-12">
                <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Pipeline Builder</h1>
                <p className="text-gray-400 mb-12">Combine multiple applets into a powerful automated workflow.</p>

                {executionResult === "processing" && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <h2 className="text-xl font-bold text-white">Executing Pipeline...</h2>
                        <p className="text-gray-400">Verifying on-chain & processing data</p>
                    </div>
                )}

                {executionResult === "success" && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-4xl mb-6 shadow-[0_0_50px_rgba(34,197,94,0.5)]">
                            ✓
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Execution Complete</h2>
                        <p className="text-gray-400 mb-6">Results have been logged to the blockchain.</p>

                        {sentimentResult && (
                            <div className="bg-gray-800/50 p-4 rounded-lg mb-6 text-left w-full max-w-sm border border-gray-700">
                                <h3 className="text-sm font-bold text-gray-300 mb-2 uppercase">Analysis Output</h3>
                                <div className="flex justify-between mb-1">
                                    <span className="text-gray-400">Score:</span>
                                    <span className={`font-mono font-bold ${sentimentResult.score > 0 ? 'text-green-400' : sentimentResult.score < 0 ? 'text-red-400' : 'text-gray-200'}`}>
                                        {sentimentResult.score}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Comparative:</span>
                                    <span className="font-mono text-white">{sentimentResult.comparative.toFixed(2)}</span>
                                </div>
                                <div className="mt-2 text-xs text-gray-500">
                                    Matched: {sentimentResult.words.join(", ") || "None"}
                                </div>
                            </div>
                        )}

                        {summaryResult && (
                            <div className="bg-gray-800/50 p-4 rounded-lg mb-6 text-left w-full max-w-sm border border-gray-700">
                                <h3 className="text-sm font-bold text-gray-300 mb-2 uppercase">Abstract / Summary</h3>
                                <p className="text-gray-300 text-sm italic border-l-2 border-purple-500 pl-3">
                                    "{summaryResult}"
                                </p>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                onClick={() => setExecutionResult(null)}
                                className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                            >
                                Build Another
                            </button>
                            <a
                                href="/history"
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                            >
                                View History
                            </a>
                        </div>
                    </div>
                )}

                <PipelineBuilder
                    availableApplets={availableApplets}
                    onExecute={handleExecute}
                    isConnected={isConnected}
                />
            </main>
        </div>
    );
}
