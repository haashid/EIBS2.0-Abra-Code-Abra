"use client";

import { useReadContract, useWriteContract, useAccount } from "wagmi";
import Navbar from "@/components/Navbar";
import AppletCard from "@/components/AppletCard";
import AppletRegistryABI from "@/abis/AppletRegistry.json";
import { formatEther, parseEther } from "viem";
import React, { useState } from "react";
import { useMockData } from "@/context/MockDataContext";



const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as `0x${string}` || "0x0000000000000000000000000000000000000000";

export default function Marketplace() {
    const { isConnected } = useAccount();
    const { applets, registerApplet } = useMockData();
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedAppletId, setSelectedAppletId] = useState<number | null>(null);

    // Form State
    const [newAppletName, setNewAppletName] = useState("");
    const [newAppletPrice, setNewAppletPrice] = useState("");
    const [newAppletDesc, setNewAppletDesc] = useState("");

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAppletName || !newAppletPrice) return;
        registerApplet(newAppletName, newAppletDesc, newAppletPrice);
        setIsRegisterOpen(false);
        setNewAppletName("");
        setNewAppletPrice("");
        setNewAppletDesc("");
    };

    // Filter applets based on search query
    const filteredApplets = applets.filter(a =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const displayApplets = filteredApplets.map(a => ({
        ...a,
        price: parseEther(a.price),
        isActive: true // Mock active status
    }));

    const selectedApplet = applets.find(a => a.id === selectedAppletId);

    return (
        <div className="min-h-screen bg-black text-gray-200 font-sans selection:bg-blue-500/30">
            <Navbar />

            {/* Details Modal */}
            {selectedApplet && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-2">{selectedApplet.name}</h2>
                                    <span className="bg-blue-900/30 text-blue-400 px-3 py-1 rounded-full text-xs font-mono border border-blue-500/30">
                                        ID: {selectedApplet.id}
                                    </span>
                                </div>
                                <button onClick={() => setSelectedAppletId(null)} className="text-gray-400 hover:text-white transition-colors text-2xl">
                                    &times;
                                </button>
                            </div>

                            <p className="text-gray-300 leading-relaxed mb-8 text-lg">
                                {selectedApplet.description}
                            </p>

                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
                                    <span className="text-gray-500 text-sm block mb-1">Input Schema</span>
                                    <span className="text-green-400 font-mono">{selectedApplet.inputSchema || "JSON"}</span>
                                </div>
                                <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
                                    <span className="text-gray-500 text-sm block mb-1">Output Schema</span>
                                    <span className="text-green-400 font-mono">{selectedApplet.outputSchema || "JSON"}</span>
                                </div>
                                <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
                                    <span className="text-gray-500 text-sm block mb-1">Price per call</span>
                                    <span className="text-white font-mono text-lg">{selectedApplet.price} ETH</span>
                                </div>
                                <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
                                    <span className="text-gray-500 text-sm block mb-1">Owner</span>
                                    <span className="text-gray-400 font-mono text-xs truncate" title={selectedApplet.owner}>{selectedApplet.owner}</span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button onClick={() => setSelectedAppletId(null)} className="px-6 py-2 text-gray-400 hover:text-white transition-colors">
                                    Close
                                </button>
                                <button className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold">
                                    Add to Pipeline
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Applet Marketplace</h1>
                        <p className="text-gray-400">Discover and integrate decentralized micro-services.</p>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <input
                            type="text"
                            placeholder="Search applets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 w-full md:w-64"
                        />
                        <button
                            onClick={() => setIsRegisterOpen(!isRegisterOpen)}
                            disabled={!isConnected}
                            className={`whitespace-nowrap px-6 py-3 rounded-lg font-medium transition-all shadow-lg ${isConnected
                                    ? 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-blue-500/25'
                                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                }`}
                            title={!isConnected ? "Connect Wallet to Register" : ""}
                        >
                            {isRegisterOpen ? 'Close Form' : isConnected ? 'Register Applet' : 'Connect Wallet to Register'}
                        </button>
                    </div>
                </div>

                {isRegisterOpen && (
                    <div className="mb-12 p-8 bg-gray-900/50 border border-gray-800 rounded-2xl animate-in fade-in slide-in-from-top-4">
                        <h2 className="text-xl font-bold text-white mb-6">Register New Applet</h2>
                        <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleRegister}>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Applet Name</label>
                                <input
                                    type="text"
                                    value={newAppletName}
                                    onChange={(e) => setNewAppletName(e.target.value)}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="e.g. Text Summarizer"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Price (ETH)</label>
                                <input
                                    type="number"
                                    step="0.001"
                                    value={newAppletPrice}
                                    onChange={(e) => setNewAppletPrice(e.target.value)}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="0.05"
                                />
                            </div>
                            <div className="col-span-full space-y-2">
                                <label className="text-sm font-medium text-gray-400">Description</label>
                                <textarea
                                    value={newAppletDesc}
                                    onChange={(e) => setNewAppletDesc(e.target.value)}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors h-32"
                                    placeholder="Describe functionality..."
                                />
                            </div>
                            <div className="col-span-full">
                                <button className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg border border-gray-700 transition-colors">
                                    Submit Registration (Mock)
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {displayApplets.length > 0 ? (
                        displayApplets.map((applet: any, idx: number) => (
                            <AppletCard
                                key={idx}
                                id={Number(applet.id) || idx + 1}
                                name={applet.name}
                                description={applet.description}
                                price={applet.price}
                                owner={applet.owner}
                                isActive={applet.isActive}
                                onViewDetails={(id) => setSelectedAppletId(id)}
                            />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-20 text-gray-500">
                            No applets found matching "{searchQuery}"
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
