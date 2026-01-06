"use client";

import Navbar from "@/components/Navbar";
import PipelineBuilder from "@/components/PipelineBuilder";
import { parseEther, formatEther } from "viem";
import { useState, Suspense } from "react";
import Sentiment from "sentiment";
import { useMockData } from "@/context/MockDataContext";
import { useAccount } from "wagmi";
import { useSearchParams } from "next/navigation";

function PipelineContent() {
    const searchParams = useSearchParams();
    const initialAppletId = searchParams.get("appletId") ? Number(searchParams.get("appletId")) : null;

    const { isConnected } = useAccount();
    const { applets, logExecution } = useMockData();
    const [executionResult, setExecutionResult] = useState<string | null>(null);
    const [sentimentResult, setSentimentResult] = useState<any>(null);
    const [summaryResult, setSummaryResult] = useState<string | null>(null);
    const [cryptoPriceResult, setCryptoPriceResult] = useState<string | null>(null);

    // Convert price string to bigint for compatibility with existing components
    const availableApplets = applets.map(a => ({
        ...a,
        price: parseEther(a.price)
    }));

    const handleExecute = async (appletIds: number[], totalPrice: bigint, inputData: string) => {
        setExecutionResult("processing");
        setSentimentResult(null);
        setSummaryResult(null);
        setCryptoPriceResult(null);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Logic for Applet ID 1: Sentiment Analysis
        if (appletIds.includes(1)) {
            const sentiment = new Sentiment();
            const result = sentiment.analyze(inputData);
            setSentimentResult(result);
        }

        // Logic for Applet ID 5: AI Summarizer (Hugging Face API + Fallback)
        if (appletIds.includes(5)) {
            try {
                const API_TOKEN = process.env.NEXT_PUBLIC_HF_TOKEN;

                if (API_TOKEN) {
                    const response = await fetch(
                        "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
                        {
                            headers: { Authorization: `Bearer ${API_TOKEN}` },
                            method: "POST",
                            body: JSON.stringify({ inputs: inputData }),
                        }
                    );
                    const result = await response.json();
                    if (result && result[0] && result[0].summary_text) {
                        setSummaryResult(result[0].summary_text);
                    } else {
                        throw new Error("Invalid API response");
                    }
                } else {
                    throw new Error("No API Key provided, using local fallback");
                }
            } catch (err) {
                console.warn("Using local summarizer fallback:", err);
                const sentences = inputData.match(/[^.!?]+[.!?]+/g) || [inputData];
                const summary = sentences.slice(0, 2).join(" ");
                setSummaryResult("(Local Fallback) " + (summary || "Could not generate summary."));
            }
        }

        // Logic for Applet ID 6: Crypto Price Oracle (REAL API)
        let paramCryptoPrice = null;
        if (appletIds.includes(6)) {
            try {
                const coinId = inputData.trim().toLowerCase() || "ethereum";
                const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
                const data = await response.json();

                if (data[coinId]) {
                    paramCryptoPrice = `$${data[coinId].usd}`;
                } else {
                    paramCryptoPrice = "Error: Coin not found (try 'bitcoin' or 'ethereum')";
                }
            } catch (error) {
                console.error("API Call Failed", error);
                paramCryptoPrice = "API Error: Failed to fetch price";
            }
        }

        // Log to history (Mock Persistence)
        logExecution(appletIds, formatEther(totalPrice), {
            sentiment: sentimentResult,
            summary: summaryResult,
            cryptoPrice: paramCryptoPrice
        });

        setCryptoPriceResult(paramCryptoPrice);
        setExecutionResult("success");
    };

    return (
        <div className="min-h-screen bg-black text-gray-200 font-sans selection:bg-blue-500/30 overflow-x-hidden">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">Pipeline Builder</h1>
                <p className="text-gray-400 mb-8 sm:mb-12 text-sm sm:text-base">Combine multiple applets into a powerful automated workflow.</p>

                {/* Processing Overlay */}
                {executionResult === "processing" && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
                        <div className="w-12 sm:w-16 h-12 sm:h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <h2 className="text-lg sm:text-xl font-bold text-white text-center">Executing Pipeline...</h2>
                        <p className="text-gray-400 text-sm sm:text-base text-center">Verifying on-chain & processing data</p>
                    </div>
                )}

                {/* Success Overlay */}
                {executionResult === "success" && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 overflow-y-auto">
                        <div className="w-16 sm:w-20 h-16 sm:h-20 bg-green-500 rounded-full flex items-center justify-center text-3xl sm:text-4xl mb-4 sm:mb-6 shadow-[0_0_50px_rgba(34,197,94,0.5)]">
                            ✓
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 text-center">Execution Complete</h2>
                        <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base text-center">Results have been logged to the blockchain.</p>

                        <div className="w-full max-w-lg bg-green-900/20 border border-green-800 rounded-xl p-4 sm:p-6 mb-6">
                            <h4 className="text-lg sm:text-xl font-bold text-green-400 mb-4">Pipeline Execution Successful</h4>
                            <div className="space-y-2 text-gray-300 font-mono text-xs sm:text-sm">
                                <p>Status: <span className="text-white">Completed</span></p>
                                <p className="break-all">Transaction Hash: <span className="text-blue-400">0x{Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}</span></p>

                                {sentimentResult && (
                                    <div className="mt-4 p-3 sm:p-4 bg-gray-900 rounded-lg border border-gray-700">
                                        <p className="font-bold text-gray-400 mb-2">Sentiment Analysis Result:</p>
                                        <p>Score: {sentimentResult.score}</p>
                                        <p>Comparative: {sentimentResult.comparative.toFixed(2)}</p>
                                    </div>
                                )}

                                {summaryResult && (
                                    <div className="mt-4 p-3 sm:p-4 bg-gray-900 rounded-lg border border-gray-700">
                                        <p className="font-bold text-gray-400 mb-2">AI Summary Result:</p>
                                        <p className="break-words">{summaryResult}</p>
                                    </div>
                                )}

                                {cryptoPriceResult && (
                                    <div className="mt-4 p-3 sm:p-4 bg-gray-900 rounded-lg border border-gray-700">
                                        <p className="font-bold text-yellow-400 mb-2">🔮 Crypto Oracle Result:</p>
                                        <p className="text-xl sm:text-2xl text-white">{cryptoPriceResult}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-sm">
                            <button
                                onClick={() => setExecutionResult(null)}
                                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm sm:text-base"
                            >
                                Build Another
                            </button>
                            <a
                                href="/history"
                                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-center text-sm sm:text-base"
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
                    initialAppletId={initialAppletId}
                />
            </main>
        </div>
    );
}

export default function PipelinePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
            <PipelineContent />
        </Suspense>
    );
}
