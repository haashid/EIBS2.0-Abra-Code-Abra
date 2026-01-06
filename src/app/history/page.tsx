"use client";

import Navbar from "@/components/Navbar";
import { useReadContract } from "wagmi";
import ExecutionLoggerABI from "@/abis/ExecutionLogger.json";
import { formatEther, parseEther } from "viem";
import { useEffect, useState } from "react";
import { useMockData } from "@/context/MockDataContext";



const LOGGER_ADDRESS = process.env.NEXT_PUBLIC_EXECUTION_ADDRESS as `0x${string}` || "0x0000000000000000000000000000000000000000";

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
        totalPrice: BigInt(parseEther(e.totalPrice)) // Convert string back to bigint for existing component compatibility
    }));

    return (
        <div className="min-h-screen bg-black text-gray-200 font-sans selection:bg-blue-500/30">
            <Navbar />

            <main className="max-w-6xl mx-auto px-6 py-12">
                <h1 className="text-4xl font-bold text-white mb-12 tracking-tight">Execution History</h1>

                <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-gray-900 text-gray-400 text-sm font-medium uppercase tracking-wider">
                                <th className="p-6 border-b border-gray-800">Execution ID</th>
                                <th className="p-6 border-b border-gray-800">Pipeline Hash</th>
                                <th className="p-6 border-b border-gray-800">Applets Used</th>
                                <th className="p-6 border-b border-gray-800">Cost (ETH)</th>
                                <th className="p-6 border-b border-gray-800">Time</th>
                                <th className="p-6 border-b border-gray-800">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {displayHistory.map((exec: any) => (
                                <tr key={exec.id} className="hover:bg-gray-800/50 transition-colors">
                                    <td className="p-6 font-mono text-blue-400">#{Number(exec.id)}</td>
                                    <td className="p-6 font-mono text-gray-500 text-xs">{exec.pipelineId.slice(0, 10)}...</td>
                                    <td className="p-6">
                                        <div className="flex gap-2">
                                            {exec.appletIds.map((id: number, i: number) => (
                                                <span key={i} className="px-2 py-1 bg-gray-800 rounded text-xs font-medium border border-gray-700">
                                                    ID: {Number(id)}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-6 font-mono font-bold text-white">
                                        {formatEther(exec.totalPrice)}
                                    </td>
                                    <td className="p-6 text-gray-400 text-sm">
                                        <ClientDate timestamp={Number(exec.timestamp)} />
                                    </td>
                                    <td className="p-6">
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
            </main>
        </div>
    );
}
