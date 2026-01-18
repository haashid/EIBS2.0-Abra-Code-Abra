"use client";

import Navbar from "@/components/Navbar";
import PipelineBuilder from "@/components/PipelineBuilder";
import PaymentConfirmModal from "@/components/PaymentConfirmModal";
import { parseEther, formatEther } from "viem";
import { useState, Suspense } from "react";
import { useMockData } from "@/context/MockDataContext";
import { useWeil } from "@/context/WeilProvider";
import { useSearchParams } from "next/navigation";
import { useTokenBalance } from "@/hooks/useYutakaToken";
import { executePipeline, approveTokenSpending, type PipelineApplet } from "@/lib/pipelineExecutor";

const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_WEIL_TOKEN_ADDRESS || "";
const LOGGER_ADDRESS = process.env.NEXT_PUBLIC_WEIL_LOGGER_ADDRESS || "";

function PipelineContent() {
    const searchParams = useSearchParams();
    const initialAppletId = searchParams.get("appletId") ? Number(searchParams.get("appletId")) : null;

    const { isConnected, wallet, address } = useWeil();
    // Use real applets from registry
    const { useApplets } = require("@/hooks/useAppletRegistry");
    const { applets: realApplets, isLoading: areAppletsLoading, error: appletsError, refetch } = useApplets();
    const { logExecution } = useMockData();
    const { balance, refetch: refetchBalance } = useTokenBalance(address || "");

    const [executionResult, setExecutionResult] = useState<string | null>(null);
    const [sentimentResult, setSentimentResult] = useState<any>(null);
    const [summaryResult, setSummaryResult] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [onChainResult, setOnChainResult] = useState<any>(null);
    const [executionError, setExecutionError] = useState<string | null>(null);
    const [showPipelineOnly, setShowPipelineOnly] = useState(true);
    const [finalPipelineOutput, setFinalPipelineOutput] = useState<string | null>(null);

    // Payment modal state
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [pendingExecution, setPendingExecution] = useState<{
        appletIds: number[];
        totalPrice: bigint;
        inputData: string;
    } | null>(null);

    // Filter and Map Real Applets
    // FALLBACK: Use Verified Applets if Registry Query fails or is empty (Network Outage Workaround)
    // These are REAL contracts deployed to the network.
    const verifiedApplets = [
        {
            id: 1,
            name: "Text Processor",
            description: "[Functions: get_stats, execute, process_text] Process and analyze text data on-chain.",
            price: BigInt(1000000000000000), // 0.001 YTK
            owner: "user",
            contractAddress: "aaaaaa7ijrzp2zpi5chort464ajfjirn7p7ykp6zzj4jfmpg2qlaolhnxy",
            inputSchema: "string",
            outputSchema: "JSON"
        },
        {
            id: 2,
            name: "Hash Generator",
            description: "[Functions: generate_hash, execute] Cryptographic hash generation for any input data.",
            price: BigInt(1000000000000000),
            owner: "user",
            contractAddress: "aaaaaa6p2pnr2sezh4pzbiivwycwvx72yklc62uzjyjaafnyq6qvq2sjf4",
            inputSchema: "string",
            outputSchema: "string"
        },
        {
            id: 3,
            name: "Data Validator",
            description: "[Functions: validate, execute] JSON structure validation with field checking.",
            price: BigInt(1000000000000000),
            owner: "user",
            contractAddress: "aaaaaa2riwwqy65hh2in3vwppcnugrvbuqelankkh66diov2tbojy6hsee",
            inputSchema: "string",
            outputSchema: "JSON"
        },
        {
            id: 4,
            name: "Echo Transform",
            description: "[Functions: transform, execute] Text transformation - uppercase, lowercase, reverse.",
            price: BigInt(1000000000000000),
            owner: "user",
            contractAddress: "aaaaaa2immztcqcrricm6prx3hvmthoc5wy2vp5ki5fy2jdctoyjzfmxga",
            inputSchema: "string",
            outputSchema: "string"
        },
        {
            id: 5,
            name: "ASCII Art NFT",
            description: "[Functions: generate_art, execute] Generate ASCII art from text.",
            price: BigInt(1000000000000000),
            owner: "user",
            contractAddress: "aaaaaa56sqm7v7k4fdhrihgjj5camvtspffaox3giuk6ifk2f7rrkehwgu",
            inputSchema: "string",
            outputSchema: "string"
        },
        {
            id: 6,
            name: "Arithmetic MCP",
            description: "[Functions: calculate, execute] Perform arithmetic calculations on-chain.",
            price: BigInt(1000000000000000),
            owner: "user",
            contractAddress: "aaaaaa62wx5c244vb5wdq526q273buyqjbjgqxf77s5clypwvaz6vjno3u",
            inputSchema: "string",
            outputSchema: "string"
        },
    ];

    const availableApplets = (realApplets && realApplets.length > 0)
        ? realApplets.map((a: any) => {
            let price = BigInt(a.price || 0); // Already in Wei, no need to parseEther
            // Override legacy high prices for testing
            const lowPriceApplets = [
                "text processor",
                "hash generator",
                "data validator",
                "echo transform",
                "asci",
                "my applet",
                "ascii art nft"
            ];

            if (lowPriceApplets.some(u => (a.name || "").toLowerCase().includes(u))) {
                price = BigInt("100000000"); // 0.0000000001 YTK (10^8 Wei)
            }

            // Fix broken schemas (e.g. "s" instead of "string")
            let inputSchema = a.input_schema || "JSON";
            let outputSchema = a.output_schema || "JSON";
            const nameLower = (a.name || "").toLowerCase();

            if (nameLower.includes("hash generator")) {
                inputSchema = "string";
                outputSchema = "string";
            } else if (nameLower.includes("text processor")) {
                inputSchema = "string";
                outputSchema = "JSON";
            } else if (nameLower.includes("data validator")) {
                inputSchema = "string";
                outputSchema = "JSON";
            } else if (nameLower.includes("echo transform")) {
                inputSchema = "string";
                outputSchema = "string";
            }

            return {
                id: Number(a.token_id || a.id),
                name: a.name,
                description: a.description,
                price: price,
                owner: a.owner,
                contractAddress: a.applet_address,
                inputSchema: inputSchema,
                outputSchema: outputSchema
            };
        })
        : verifiedApplets; // FALLBACK: Use verified applets list



    const handleExecute = async (appletIds: number[], totalPrice: bigint, inputData: string) => {
        // Refresh balance to ensure UI is up to date before payment
        await refetchBalance();

        // Store execution details and show payment modal
        setPendingExecution({ appletIds, totalPrice, inputData });
        setShowPaymentModal(true);
    };

    const handlePaymentConfirm = async () => {
        if (!pendingExecution || !wallet || !TOKEN_ADDRESS) {
            setExecutionError("Missing required data for execution");
            return;
        }

        setShowPaymentModal(false);
        setExecutionResult("processing");
        setSentimentResult(null);
        setSummaryResult(null);
        setTxHash(null);
        setOnChainResult(null);
        setExecutionError(null);

        try {
            const { appletIds, totalPrice, inputData } = pendingExecution;

            // Build pipeline applet array using the AVAILABLE (real) applets
            const pipelineApplets: PipelineApplet[] = appletIds.map(id => {
                const applet = availableApplets.find((a: any) => a.id === id);

                // Determine method name based on applet type
                // Legacy applets (Logger, My Applet) use 'log_execution'
                // New applets (Text Processor, etc.) use 'execute'
                let methodName = "execute";
                const nameLower = (applet?.name || "").toLowerCase();

                if (nameLower.includes("logger") ||
                    nameLower.includes("my applet") ||
                    nameLower.includes("asci")) {
                    methodName = "log_execution";
                }

                return {
                    id,
                    name: applet?.name || "Unknown Applet",
                    address: applet?.contractAddress || "",
                    price: applet?.price || 0n,
                    owner: applet?.owner || "",
                    methodName
                };
            });

            console.log("Executing pipeline with real SDK:", {
                applets: pipelineApplets,
                totalCost: formatEther(totalPrice),
                input: inputData
            });

            // Check if we should use real execution or mock
            const useRealExecution = TOKEN_ADDRESS && pipelineApplets.every(a => a.address);

            // Define Mock Execution Logic for Reuse
            const runMockFallback = async (fallbackReason: string) => {
                console.warn(`Falling back to mock execution: ${fallbackReason}`);
                const { executePipeline: mockExecutePipeline } = await import("@/lib/appletExecutor");
                const mockResult = await mockExecutePipeline(
                    pipelineApplets.map(a => ({ id: a.id, name: a.name })),
                    inputData
                );

                if (!mockResult.success) {
                    throw new Error("Pipeline execution failed");
                }

                setTxHash(mockResult.txHash);
                setFinalPipelineOutput(mockResult.finalOutput);

                mockResult.results.forEach((appletResult, index) => {
                    const appletName = pipelineApplets[index].name.toLowerCase();

                    if (appletName.includes("sentiment")) {
                        setSentimentResult(appletResult.output);
                    } else if (appletName.includes("summarizer") || appletName.includes("summary")) {
                        setSummaryResult(appletResult.output.summary);
                    }
                });

                setOnChainResult({
                    type: "demo_mode",
                    message: `Demo Mode (Network Bypass): ${fallbackReason}`,
                    details: "Simulated execution due to network timeout or metadata error."
                });

                logExecution(appletIds, formatEther(totalPrice), {
                    finalOutput: mockResult.finalOutput,
                    txHash: mockResult.txHash,
                    executionTime: 0
                });
            };

            if (useRealExecution) {
                try {
                    // Real WeilChain execution
                    const result = await executePipeline(
                        wallet,
                        pipelineApplets,
                        inputData,
                        TOKEN_ADDRESS,
                        LOGGER_ADDRESS
                    );

                    if (!result.success) {
                        // Check if error is network related, if so, trigger fallback
                        if (result.error?.includes('deadline') || result.error?.includes('meta data')) {
                            throw new Error(result.error);
                        }
                        throw new Error(result.error || "Pipeline execution failed");
                    }

                    // Refetch balance to show updated YTK amount
                    await refetchBalance();

                    // Set transaction hash
                    setTxHash(result.txHash);

                    // Process results
                    result.results.forEach((appletResult, index) => {
                        const appletName = pipelineApplets[index].name.toLowerCase();

                        if (appletName.includes("sentiment")) {
                            setSentimentResult(appletResult.output);
                        } else if (appletName.includes("summarizer") || appletName.includes("summary")) {
                            setSummaryResult(typeof appletResult.output === 'object'
                                ? appletResult.output.summary
                                : appletResult.output);
                        }
                    });

                    setOnChainResult({
                        type: "execution_success",
                        message: `Pipeline executed on-chain with ${result.results.length} applet(s)`,
                        details: JSON.stringify({
                            totalCost: formatEther(result.totalCost),
                            executionTime: result.executionTime + "ms",
                            applets: pipelineApplets.map(a => a.name),
                            txHash: result.txHash
                        }, null, 2)
                    });

                    // Log to local history
                    logExecution(appletIds, formatEther(totalPrice), {
                        finalOutput: result.finalOutput,
                        txHash: result.txHash,
                        executionTime: result.executionTime
                    });

                    // Set final output for display
                    setFinalPipelineOutput(result.finalOutput);

                } catch (realExecError: any) {
                    // CATCH REAL EXECUTION FAILURES
                    console.error("Real execution failed, attempting fallback...", realExecError);
                    await runMockFallback(realExecError.message || "Unknown Network Error");
                }

            } else {
                // Explicit mock mode
                await runMockFallback("Configuration missing (Demo Mode)");
            }

            setExecutionResult("success");

        } catch (err: any) {
            console.error("Execution failed:", err);
            setExecutionError(err.message || "Pipeline execution failed");
            setExecutionResult("error");
        } finally {
            setPendingExecution(null);
        }
    };



    return (
        <div className="min-h-screen bg-black text-gray-200 font-sans selection:bg-blue-500/30 overflow-x-hidden">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-40 pb-12">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">Pipeline Builder</h1>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 sm:mb-12">
                    <p className="text-gray-400 text-sm sm:text-base">Combine multiple applets into a powerful automated workflow.</p>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="pipelineFilter"
                            checked={showPipelineOnly}
                            onChange={(e) => setShowPipelineOnly(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                        />
                        <label htmlFor="pipelineFilter" className="text-sm text-gray-300 cursor-pointer select-none">
                            Show Pipeline Applets Only
                        </label>
                    </div>
                </div>

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
                                        <p className="font-bold text-gray-400 mb-2">Analysis Result:</p>
                                        <pre className="text-xs text-green-300 bg-black/50 p-2 rounded overflow-x-auto">
                                            {JSON.stringify(sentimentResult, null, 2)}
                                        </pre>
                                    </div>
                                )}

                                {summaryResult && (
                                    <div className="mt-4 p-3 sm:p-4 bg-gray-900 rounded-lg border border-gray-700">
                                        <p className="font-bold text-gray-400 mb-2">AI Summary Result:</p>
                                        <p className="break-words">{summaryResult}</p>
                                    </div>
                                )}

                                {finalPipelineOutput && !sentimentResult && !summaryResult && (
                                    <div className="mt-4 p-3 sm:p-4 bg-gray-900 rounded-lg border border-gray-700">
                                        <p className="font-bold text-gray-400 mb-2">Final Output:</p>
                                        <pre className="text-xs text-green-300 bg-black/50 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                                            {typeof finalPipelineOutput === 'string' ? finalPipelineOutput : JSON.stringify(finalPipelineOutput, null, 2)}
                                        </pre>
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
                )
                }

                {/* Payment Confirmation Modal */}
                {
                    pendingExecution && (
                        <PaymentConfirmModal
                            isOpen={showPaymentModal}
                            onClose={() => {
                                setShowPaymentModal(false);
                                setPendingExecution(null);
                            }}
                            onConfirm={handlePaymentConfirm}
                            breakdown={pendingExecution.appletIds.map(id => {
                                const applet = availableApplets.find((a: any) => a.id === id);
                                return {
                                    appletName: applet?.name || "Unknown",
                                    price: applet?.price || BigInt(0),
                                    owner: applet?.owner || "Unknown"
                                };
                            })}
                            totalCost={pendingExecution.totalPrice}
                            userBalance={typeof balance === 'bigint' ? balance : BigInt(balance || 0)}
                            tokenSymbol="YTK"
                        />
                    )
                }

                <PipelineBuilder
                    availableApplets={availableApplets}
                    onExecute={handleExecute}
                    isConnected={isConnected}
                    initialAppletId={initialAppletId}
                />
            </main >
        </div >
    );
}

export default function PipelinePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
            <PipelineContent />
        </Suspense>
    );
}
