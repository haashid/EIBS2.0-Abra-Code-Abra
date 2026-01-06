"use client";

import Navbar from "@/components/Navbar";
import { formatEther, parseEther } from "viem";
import { useEffect, useState } from "react";
import { useMockData } from "@/context/MockDataContext";

function ClientDate({ timestamp }: { timestamp: number }) {
    const [date, setDate] = useState<string>("");
    useEffect(() => {
        setDate(new Date(timestamp * 1000).toLocaleString());
    }, [timestamp]);
    return <>{date || "..."}</>;
}

export default function HistoryPage() {
    const { executions } = useMockData();

    // Sort executions by timestamp (newest first)
    const displayHistory = [...executions].sort((a, b) => b.timestamp - a.timestamp).map(e => ({
        ...e,
        totalPrice: BigInt(parseEther(e.totalPrice))
    }));

    return (
        <div className="min-h-screen bg-black text-gray-200 font-sans selection:bg-blue-500/30 overflow-x-hidden">
            <Navbar />

            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-8 sm:mb-12 tracking-tight">Execution History</h1>

                {displayHistory.length === 0 ? (
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
                                        <th className="p-4 lg:p-6 border-b border-gray-800">Cost (ETH)</th>
                                        <th className="p-4 lg:p-6 border-b border-gray-800">Time</th>
                                        <th className="p-4 lg:p-6 border-b border-gray-800">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {displayHistory.map((exec: any) => (
                                        <tr key={exec.id} className="hover:bg-gray-800/50 transition-colors">
                                            <td className="p-4 lg:p-6 font-mono text-blue-400">#{Number(exec.id)}</td>
                                            <td className="p-4 lg:p-6 font-mono text-gray-500 text-xs">{exec.pipelineId.slice(0, 10)}...</td>
                                            <td className="p-4 lg:p-6">
                                                <div className="flex flex-wrap gap-2">
                                                    {exec.appletIds.map((id: number, i: number) => (
                                                        <span key={i} className="px-2 py-1 bg-gray-800 rounded text-xs font-medium border border-gray-700">
                                                            ID: {Number(id)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-4 lg:p-6 font-mono font-bold text-white">
                                                {formatEther(exec.totalPrice)}
                                            </td>
                                            <td className="p-4 lg:p-6 text-gray-400 text-sm">
                                                <ClientDate timestamp={Number(exec.timestamp)} />
                                            </td>
                                            <td className="p-4 lg:p-6">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-medium">
                                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                                    Success
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View - Visible only on mobile */}
                        <div className="md:hidden space-y-4">
                            {displayHistory.map((exec: any) => (
                                <div key={exec.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="font-mono text-blue-400 text-lg font-bold">#{Number(exec.id)}</span>
                                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-medium">
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                            Success
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Pipeline</span>
                                            <span className="font-mono text-gray-400 text-xs">{exec.pipelineId.slice(0, 12)}...</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Cost</span>
                                            <span className="font-mono font-bold text-white">{formatEther(exec.totalPrice)} ETH</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Time</span>
                                            <span className="text-gray-400 text-xs">
                                                <ClientDate timestamp={Number(exec.timestamp)} />
                                            </span>
                                        </div>
                                        <div className="pt-2">
                                            <span className="text-gray-500 block mb-2">Applets Used</span>
                                            <div className="flex flex-wrap gap-2">
                                                {exec.appletIds.map((id: number, i: number) => (
                                                    <span key={i} className="px-2 py-1 bg-gray-800 rounded text-xs font-medium border border-gray-700">
                                                        ID: {Number(id)}
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
