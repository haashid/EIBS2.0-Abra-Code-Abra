"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { useWeil } from "@/context/WeilProvider";
import { useMockData, ExecutionLog } from "@/context/MockDataContext";
import { useApplets } from "@/hooks/useAppletRegistry";

// Interface for on-chain execution records
interface ExecutionRecord {
    id: string;
    pipelineId: string;
    appletIds: number[];
    appletNames?: string[]; // Added for display
    totalPrice: string;
    timestamp: number;
    status: string;
}

function ClientDate({ timestamp }: { timestamp: number }) {
    const [date, setDate] = useState<string>("");
    useEffect(() => {
        if (timestamp <= 0) {
            setDate("Unknown Date");
        } else {
            setDate(new Date(timestamp * 1000).toLocaleString());
        }
    }, [timestamp]);
    return <>{date || "..."}</>;
}

export default function HistoryPage() {
    const { isConnected, queryContract, wallet } = useWeil();
    const [executions, setExecutions] = useState<ExecutionRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const LOGGER_ADDRESS = process.env.NEXT_PUBLIC_WEIL_LOGGER_ADDRESS || "";
    const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_WEIL_REGISTRY_ADDRESS || "";

    // Local Mock Data Hook
    const { executions: localExecutions } = useMockData();
    const { applets: verifiedAppletsList } = useApplets(); // Fetch applet list for naming

    // Fetch execution history from on-chain logger
    useEffect(() => {
        let isMounted = true;

        async function fetchHistory() {
            let fetchedExecutions: ExecutionRecord[] = [];

            // 1. Fetch On-Chain Data (if connected and contracts exist)
            if (isConnected && wallet && LOGGER_ADDRESS) {
                // setIsLoading(true); // Don't block UI with full loading if local data exists
                try {
                    console.log("Fetching execution count from Logger...");
                    const countResult = await queryContract(LOGGER_ADDRESS, "get_execution_count", {});

                    let count = 0;
                    if (typeof countResult === 'number') {
                        count = countResult;
                    } else if (countResult?.Ok !== undefined) {
                        count = Number(countResult.Ok);
                    } else if (countResult?.data !== undefined) {
                        count = Number(countResult.data);
                    }

                    console.log(`Found ${count} on-chain executions.`);

                    if (count > 0) {
                        // Fetch applet registry for name mapping
                        console.log("Fetching applet registry for names...");
                        let appletMap: Record<number, string> = {};
                        try {
                            const registryResult = await queryContract(REGISTRY_ADDRESS, "get_all_applets", {});
                            let applets: any[] = [];
                            if (Array.isArray(registryResult)) {
                                applets = registryResult;
                            } else if (registryResult?.Ok) {
                                try {
                                    if (typeof registryResult.Ok === 'string') {
                                        applets = JSON.parse(registryResult.Ok);
                                    } else if (Array.isArray(registryResult.Ok)) {
                                        applets = registryResult.Ok;
                                    }
                                } catch (e) {
                                    console.warn("[History] Failed to parse applets JSON:", e);
                                }
                            }
                            if (Array.isArray(applets)) {
                                applets.forEach((applet: any) => {
                                    const id = Number(applet.token_id !== undefined ? applet.token_id : (applet.id || 0));
                                    appletMap[id] = applet.name || `Applet ${id}`;
                                });
                            }
                        } catch (err) { console.warn("Could not fetch applet names:", err); }

                        const startId = count;
                        const endId = Math.max(1, count - 19);

                        for (let i = startId; i >= endId; i--) {
                            if (!isMounted) return;
                            try {
                                const exec = await queryContract(LOGGER_ADDRESS, "get_execution", { id: i });
                                let data: any = null;
                                if (exec?.Ok) data = exec.Ok;
                                else if (exec && !exec.Err && !exec.error) data = exec;

                                if (data) {
                                    let appletIds: number[] = [];
                                    try {
                                        appletIds = data.applet_ids_json ? JSON.parse(data.applet_ids_json) : [];
                                    } catch (e) { }

                                    const appletNames = appletIds.map(id => appletMap[id] || `ID: ${id}`);
                                    const priceInWei = Number(data.total_price || 0);
                                    const formattedPrice = (priceInWei / 1e18).toFixed(18).replace(/\.?0+$/, '') || '0';
                                    const timestamp = Number(data.timestamp || 0);

                                    fetchedExecutions.push({
                                        id: String(data.id ?? i),
                                        pipelineId: data.result_hash || `pipeline-${i}`,
                                        appletIds: appletIds,
                                        appletNames: appletNames,
                                        totalPrice: formattedPrice,
                                        timestamp: timestamp,
                                        status: "Completed (On-Chain)"
                                    });
                                }
                            } catch (err) { console.warn(`Execution ${i} fetch failed:`, err); }
                        }
                    }
                } catch (err) {
                    console.error("Failed to fetch on-chain history:", err);
                }
            }

            // 2. Merge Local Execution Logs
            // Map local executions to matching format
            const mappedLocalExecutions: ExecutionRecord[] = localExecutions.map((local: ExecutionLog) => {
                // Try to resolve names from Verified Applet List if currently available
                const names = local.appletIds.map((id: number) => {
                    // Try to find in verified list or hardcoded map
                    // Simple fallback for demo
                    const demoNames: Record<number, string> = {
                        1: "Text Processor", 2: "Hash Generator", 3: "Data Validator",
                        4: "Echo Transform", 5: "ASCII Art NFT", 6: "Arithmetic MCP"
                    };
                    return demoNames[id] || `Applet ${id}`;
                });

                return {
                    id: `local-${local.id}`,
                    pipelineId: local.pipelineId,
                    appletIds: local.appletIds,
                    appletNames: names,
                    totalPrice: local.totalPrice,
                    timestamp: local.timestamp,
                    status: "Completed"
                };
            });

            if (isMounted) {
                // deduplicate if necessary, but IDs should be distinct (string vs 'local-')
                setExecutions([...fetchedExecutions, ...mappedLocalExecutions]);
                setIsLoading(false);
            }
        }

        fetchHistory();
        return () => { isMounted = false; };
    }, [isConnected, wallet, queryContract, LOGGER_ADDRESS, REGISTRY_ADDRESS, localExecutions]);

    // Sort executions by timestamp (newest first)
    const displayHistory = [...executions].sort((a, b) => b.timestamp - a.timestamp);

    return (
        <div className="min-h-screen bg-black text-gray-200 font-sans selection:bg-blue-500/30 overflow-x-hidden">
            <Navbar />

            <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-40 pb-12">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-8 sm:mb-12 tracking-tight">Execution History</h1>

                {isLoading ? (
                    <div className="text-center py-16 sm:py-20 text-gray-500">
                        <p className="text-4xl sm:text-5xl mb-4 animate-pulse">⏳</p>
                        <p className="text-base sm:text-lg">Loading execution history from WeilChain...</p>
                    </div>
                ) : !isConnected ? (
                    <div className="text-center py-16 sm:py-20 text-gray-500">
                        <p className="text-4xl sm:text-5xl mb-4">🔐</p>
                        <p className="text-base sm:text-lg">Connect your WAuth wallet to view execution history</p>
                    </div>
                ) : !LOGGER_ADDRESS ? (
                    <div className="text-center py-16 sm:py-20 text-gray-500">
                        <p className="text-4xl sm:text-5xl mb-4">⚙️</p>
                        <p className="text-base sm:text-lg">Logger contract not deployed yet</p>
                        <p className="text-sm text-gray-600 mt-2">Execution history will be available after contract deployment</p>
                    </div>
                ) : displayHistory.length === 0 ? (
                    <div className="text-center py-16 sm:py-20 text-gray-500">
                        <p className="text-4xl sm:text-5xl mb-4">📜</p>
                        <p className="text-base sm:text-lg">No executions yet. Build a pipeline to get started!</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table - Hidden on mobile */}
                        <div className="hidden md:block bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                                <thead>
                                    <tr className="bg-gray-900 text-gray-400 text-sm font-medium uppercase tracking-wider">
                                        <th className="p-4 lg:p-6 border-b border-gray-800">Execution ID</th>
                                        <th className="p-4 lg:p-6 border-b border-gray-800">Pipeline Hash</th>
                                        <th className="p-4 lg:p-6 border-b border-gray-800">Applets Used</th>
                                        <th className="p-4 lg:p-6 border-b border-gray-800">Cost (YTK)</th>
                                        <th className="p-4 lg:p-6 border-b border-gray-800">Time</th>
                                        <th className="p-4 lg:p-6 border-b border-gray-800">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {displayHistory.map((exec) => (
                                        <tr key={exec.id} className="hover:bg-gray-800/50 transition-colors">
                                            <td className="p-4 lg:p-6 font-mono text-blue-400">#{exec.id}</td>
                                            <td className="p-4 lg:p-6 font-mono text-gray-500 text-xs">{exec.pipelineId.slice(0, 10)}...</td>
                                            <td className="p-4 lg:p-6">
                                                <div className="flex flex-wrap gap-2">
                                                    {(exec.appletNames || exec.appletIds.map(id => `ID: ${id}`)).map((name, i) => (
                                                        <span key={i} className="px-2 py-1 bg-gray-800 rounded text-xs font-medium border border-gray-700">
                                                            {name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-4 lg:p-6 font-mono font-bold text-white">
                                                {exec.totalPrice}
                                            </td>
                                            <td className="p-4 lg:p-6 text-gray-400 text-sm">
                                                <ClientDate timestamp={exec.timestamp} />
                                            </td>
                                            <td className="p-4 lg:p-6">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-medium">
                                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                                    {exec.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View - Visible only on mobile */}
                        <div className="md:hidden space-y-4">
                            {displayHistory.map((exec) => (
                                <div key={exec.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="font-mono text-blue-400 text-lg font-bold">#{exec.id}</span>
                                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-medium">
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                            {exec.status}
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Pipeline</span>
                                            <span className="font-mono text-gray-400 text-xs">{exec.pipelineId.slice(0, 12)}...</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Cost</span>
                                            <span className="font-mono font-bold text-white">{exec.totalPrice} YTK</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Time</span>
                                            <span className="text-gray-400 text-xs">
                                                <ClientDate timestamp={exec.timestamp} />
                                            </span>
                                        </div>
                                        <div className="pt-2">
                                            <span className="text-gray-500 block mb-2">Applets Used</span>
                                            <div className="flex flex-wrap gap-2">
                                                {(exec.appletNames || exec.appletIds.map(id => `ID: ${id}`)).map((name, i) => (
                                                    <span key={i} className="px-2 py-1 bg-gray-800 rounded text-xs font-medium border border-gray-700">
                                                        {name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
