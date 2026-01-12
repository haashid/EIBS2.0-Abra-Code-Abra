"use client";

import Navbar from "@/components/Navbar";
import PipelineBuilder from "@/components/PipelineBuilder";
import { parseEther, formatEther } from "viem";
import { useState, Suspense } from "react";
import Sentiment from "sentiment";
import { useMockData } from "@/context/MockDataContext";
import { useWeil } from "@/context/WeilProvider";
import { useSearchParams } from "next/navigation";

function PipelineContent() {
    const searchParams = useSearchParams();
    const initialAppletId = searchParams.get("appletId") ? Number(searchParams.get("appletId")) : null;

    const { isConnected, executeContract, queryContract, registryAddress, loggerAddress, wallet } = useWeil();
    const { applets, logExecution } = useMockData();
    const [executionResult, setExecutionResult] = useState<string | null>(null);
    const [sentimentResult, setSentimentResult] = useState<any>(null);
    const [summaryResult, setSummaryResult] = useState<string | null>(null);
    const [cryptoPriceResult, setCryptoPriceResult] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [onChainResult, setOnChainResult] = useState<any>(null);
    const [executionError, setExecutionError] = useState<string | null>(null);

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
        setTxHash(null);
        setOnChainResult(null);
        setExecutionError(null);

        try {
            // ============================================
            // REAL ON-CHAIN EXECUTION
            // ============================================

            // Step 1: Query the registry for applet count (proves on-chain call works)
            let registryResult = null;
            if (wallet && registryAddress) {
                try {
                    console.log("Querying registry at:", registryAddress);
                    registryResult = await wallet.contracts.execute(
                        registryAddress,
                        "get_applet_count",
                        {}
                    );
                    console.log("Registry response:", registryResult);

                    // Handle different response formats
                    let displayResult = registryResult;
                    if (typeof registryResult === 'object') {
                        displayResult = JSON.stringify(registryResult, null, 2);
                    }

                    setOnChainResult({
                        type: "registry_query",
                        data: registryResult,
                        message: `Successfully queried registry on-chain!`,
                        details: displayResult
                    });
                } catch (err: any) {
                    console.error("Registry query failed:", err);
                    setOnChainResult({
                        type: "registry_error",
                        error: err.message
                    });
                }
            }

            // ============================================
            // LOCAL EXECUTION (Applet Logic)
            // ============================================

            // Sentiment Analysis (Applet ID 1)
            if (appletIds.includes(1)) {
                const sentiment = new Sentiment();
                const result = sentiment.analyze(inputData);
                setSentimentResult(result);
            }

            // AI Summarizer (Applet ID 5)
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
                        throw new Error("No API Key");
                    }
                } catch (err) {
                    const sentences = inputData.match(/[^.!?]+[.!?]+/g) || [inputData];
                    const summary = sentences.slice(0, 2).join(" ");
                    setSummaryResult("(Local) " + (summary || "Could not generate summary."));
                }
            }

            // Crypto Price Oracle (Applet ID 6)
            let paramCryptoPrice = null;
            if (appletIds.includes(6)) {
                try {
                    const coinId = inputData.trim().toLowerCase() || "ethereum";
                    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
                    const data = await response.json();
                    if (data[coinId]) {
                        paramCryptoPrice = `$${data[coinId].usd}`;
                    } else {
                        paramCryptoPrice = "Error: Coin not found";
                    }
                } catch (error) {
                    paramCryptoPrice = "API Error";
                }
            }

            // ============================================
            // LOG EXECUTION TO CHAIN
            // ============================================
            if (wallet && loggerAddress) {
                try {
                    const resultHash = btoa(JSON.stringify({
                        sentiment: sentimentResult,
                        summary: summaryResult,
                        cryptoPrice: paramCryptoPrice
                    })).slice(0, 64);

                    const logResult = await wallet.contracts.execute(
                        loggerAddress,
                        "log_execution",
                        {
                            applet_ids: appletIds,
                            total_price: totalPrice.toString(),
                            result_hash: resultHash
                        }
                    );
                    console.log("Execution logged:", logResult);

                    // Extract transaction hash if available
                    if (logResult && logResult.transactionId) {
                        setTxHash(logResult.transactionId);
                    }
                } catch (err: any) {
                    console.warn("Logging to chain failed (non-critical):", err.message);
                }
            }

            // Log to local mock history as fallback
            logExecution(appletIds, formatEther(totalPrice), {
                sentiment: sentimentResult,
                summary: summaryResult,
                cryptoPrice: paramCryptoPrice,
                onChain: onChainResult
            });

            setCryptoPriceResult(paramCryptoPrice);
            setExecutionResult("success");

        } catch (err: any) {
            console.error("Execution failed:", err);
            setExecutionError(err.message);
            setExecutionResult("error");
        }
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
                        <p className="text-gray-400 text-sm sm:text-base text-center">Calling WeilChain contracts...</p>
                    </div>
                )}

                {/* Error Overlay */}
                {executionResult === "error" && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
                        <div className="w-16 sm:w-20 h-16 sm:h-20 bg-red-500 rounded-full flex items-center justify-center text-3xl sm:text-4xl mb-4 shadow-[0_0_50px_rgba(239,68,68,0.5)]">
                            ✕
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 text-center">Execution Failed</h2>
                        <p className="text-red-400 mb-4 text-sm text-center max-w-md">{executionError}</p>
                        <button
                            onClick={() => setExecutionResult(null)}
                            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Success Overlay */}
                {executionResult === "success" && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 overflow-y-auto">
                        <div className="w-16 sm:w-20 h-16 sm:h-20 bg-green-500 rounded-full flex items-center justify-center text-3xl sm:text-4xl mb-4 shadow-[0_0_50px_rgba(34,197,94,0.5)]">
                            ✓
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 text-center">Execution Complete</h2>
                        <p className="text-gray-400 mb-4 text-sm text-center">Results logged to WeilChain.</p>

                        <div className="w-full max-w-lg bg-green-900/20 border border-green-800 rounded-xl p-4 sm:p-6 mb-6">
                            <h4 className="text-lg sm:text-xl font-bold text-green-400 mb-4">Pipeline Results</h4>
                            <div className="space-y-2 text-gray-300 font-mono text-xs sm:text-sm">
                                <p>Status: <span className="text-white">Completed</span></p>

                                {/* On-Chain Result */}
                                {onChainResult && (
                                    <div className="mt-4 p-3 bg-blue-900/30 rounded-lg border border-blue-700">
                                        <p className="font-bold text-blue-400 mb-2">📡 On-Chain Query Result:</p>
                                        <p className="text-white mb-2">{onChainResult.message}</p>
                                        {onChainResult.details && (
                                            <pre className="text-xs text-green-300 bg-black/50 p-2 rounded overflow-x-auto">
                                                {onChainResult.details}
                                            </pre>
                                        )}
                                    </div>
                                )}

                                {/* Transaction Hash */}
                                {txHash ? (
                                    <div className="mt-4 p-3 bg-purple-900/30 rounded-lg border border-purple-700">
                                        <p className="font-bold text-purple-400 mb-2">🔗 Transaction Hash:</p>
                                        <a
                                            href={`https://unweil.me/tx/${txHash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:underline break-all"
                                        >
                                            {txHash}
                                        </a>
                                    </div>
                                ) : (
                                    <p className="text-yellow-400 text-xs mt-2">
                                        (Logger not configured - execution logged locally)
                                    </p>
                                )}

                                {sentimentResult && (
                                    <div className="mt-4 p-3 sm:p-4 bg-gray-900 rounded-lg border border-gray-700">
                                        <p className="font-bold text-gray-400 mb-2">Sentiment Analysis Result:</p>
                                        <pre className="text-xs text-green-300 bg-black/50 p-2 rounded overflow-x-auto">
                                            {JSON.stringify({
                                                score: sentimentResult.score,
                                                comparative: parseFloat(sentimentResult.comparative.toFixed(2)),
                                                positive: sentimentResult.positive || [],
                                                negative: sentimentResult.negative || []
                                            }, null, 2)}
                                        </pre>
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
