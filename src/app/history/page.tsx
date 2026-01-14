"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { useWeil } from "@/context/WeilProvider";

// Interface for on-chain execution records
interface ExecutionRecord {
    id: string;
    pipelineId: string;
    appletIds: number[];
    totalPrice: string;
    timestamp: number;
    status: string;
}

function ClientDate({ timestamp }: { timestamp: number }) {
    const [date, setDate] = useState<string>("");
    useEffect(() => {
        setDate(new Date(timestamp * 1000).toLocaleString());
    }, [timestamp]);
    return <>{date || "..."}</>;
}

export default function HistoryPage() {
    const { isConnected, queryContract, wallet } = useWeil();
    const [executions, setExecutions] = useState<ExecutionRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const LOGGER_ADDRESS = process.env.NEXT_PUBLIC_WEIL_LOGGER_ADDRESS || "";

    // Fetch execution history from on-chain logger
    useEffect(() => {
        async function fetchHistory() {
            if (!isConnected || !wallet || !LOGGER_ADDRESS) return;

            setIsLoading(true);
            try {
                // First get total count
                const countResult = await queryContract(LOGGER_ADDRESS, "get_execution_count", {});
                const count = Number(countResult) || 0;

                if (count === 0) {
                    setExecutions([]);
                    return;
                }

                // Fetch each execution by ID (IDs start at 0)
                const fetchedExecutions: ExecutionRecord[] = [];
                for (let i = 0; i < Math.min(count, 50); i++) {
                    try {
                        const exec = await queryContract(LOGGER_ADDRESS, "get_execution", { id: i });
                        if (exec && !exec.Err) {
                            const data = exec.Ok || exec;
                            fetchedExecutions.push({
                                id: String(data.id ?? i),
                                pipelineId: `pipeline-${i}`,
                                appletIds: data.applet_ids_json ? JSON.parse(data.applet_ids_json) : [],
                                totalPrice: String(data.total_price || 0),
                                timestamp: Number(data.timestamp || 0),
                                status: "completed"
                            });
                        }
                    } catch (err) {
                        console.log(`Execution ${i} not found`);
                    }
                }
                setExecutions(fetchedExecutions);
            } catch (err) {
                console.error("Failed to fetch execution history:", err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchHistory();
    }, [isConnected, wallet, queryContract, LOGGER_ADDRESS]);

    // Sort executions by timestamp (newest first)
    const displayHistory = [...executions].sort((a, b) => b.timestamp - a.timestamp);

    return (
        <div className="min-h-screen bg-black text-gray-200 font-sans selection:bg-blue-500/30 overflow-x-hidden">
            <Navbar />

            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
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
                                        <th className="p-4 lg:p-6 border-b border-gray-800">Cost (NXS)</th>
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
                                                    {exec.appletIds.map((id, i) => (
                                                        <span key={i} className="px-2 py-1 bg-gray-800 rounded text-xs font-medium border border-gray-700">
                                                            ID: {id}
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
                                            <span className="font-mono font-bold text-white">{exec.totalPrice} NXS</span>
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
                                                {exec.appletIds.map((id, i) => (
                                                    <span key={i} className="px-2 py-1 bg-gray-800 rounded text-xs font-medium border border-gray-700">
                                                        ID: {id}
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
