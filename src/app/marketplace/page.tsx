"use client";

import { useAccount } from "wagmi";
import Navbar from "@/components/Navbar";
import AppletCard from "@/components/AppletCard";
import { parseEther, formatEther } from "viem";
import React, { useState, useEffect } from "react";
import { useMockData } from "@/context/MockDataContext";
import { useApplets, useRegisterApplet, ContractApplet } from "@/hooks/useAppletRegistry";
import { useRouter } from "next/navigation";

// Check if we should use real contracts (non-zero address)
const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || "";
const USE_REAL_CONTRACTS = REGISTRY_ADDRESS && REGISTRY_ADDRESS !== "0x0000000000000000000000000000000000000000";

export default function Marketplace() {
    const router = useRouter();
    const { isConnected, address } = useAccount();

    // Mock data hooks (fallback)
    const { applets: mockApplets, registerApplet: mockRegisterApplet } = useMockData();

    // Real contract hooks
    const { applets: contractApplets, isLoading: contractLoading, refetch } = useApplets();
    const { registerApplet: contractRegister, isPending, isConfirming, isSuccess, error: registerError } = useRegisterApplet();

    // Refetch when registration succeeds
    useEffect(() => {
        if (isSuccess) {
            refetch();
            setIsRegisterOpen(false);
            resetForm();
        }
    }, [isSuccess, refetch]);

    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedAppletId, setSelectedAppletId] = useState<number | null>(null);

    const handleUseApplet = (id: number) => {
        router.push(`/pipeline?appletId=${id}`);
    };

    // Form State
    const [newAppletName, setNewAppletName] = useState("");
    const [newAppletPrice, setNewAppletPrice] = useState("");
    const [newAppletDesc, setNewAppletDesc] = useState("");
    const [newAppletInputSchema, setNewAppletInputSchema] = useState("Text");
    const [newAppletOutputSchema, setNewAppletOutputSchema] = useState("JSON");

    const resetForm = () => {
        setNewAppletName("");
        setNewAppletPrice("");
        setNewAppletDesc("");
        setNewAppletInputSchema("Text");
        setNewAppletOutputSchema("JSON");
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAppletName || !newAppletPrice) return;

        if (USE_REAL_CONTRACTS) {
            // Real contract registration
            await contractRegister(newAppletName, newAppletDesc, newAppletPrice, newAppletInputSchema, newAppletOutputSchema);
        } else {
            // Mock registration
            mockRegisterApplet(newAppletName, newAppletDesc, newAppletPrice, newAppletInputSchema, newAppletOutputSchema);
            setIsRegisterOpen(false);
            resetForm();
        }
    };

    // Determine which data source to use
    const applets = USE_REAL_CONTRACTS
        ? contractApplets.map((a: ContractApplet) => ({
            id: Number(a.id),
            name: a.name,
            description: a.description,
            price: a.price,
            owner: a.owner,
            inputSchema: "JSON", // Placeholder - would need schema decode
            outputSchema: "JSON",
            isActive: a.isActive,
        }))
        : mockApplets.map(a => ({
            ...a,
            price: parseEther(a.price),
            isActive: true
        }));

    // Filter applets based on search query
    const filteredApplets = applets.filter((a: any) =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedApplet = applets.find((a: any) => a.id === selectedAppletId);
    const isLoading = USE_REAL_CONTRACTS && contractLoading;

    return (
        <div className="min-h-screen bg-black text-gray-200 font-sans selection:bg-blue-500/30 overflow-x-hidden">
            <Navbar />

            {/* Details Modal */}
            {selectedApplet && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-gray-900 border border-gray-700 rounded-xl sm:rounded-2xl w-full max-w-lg sm:max-w-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-4 sm:p-6 md:p-8">
                            <div className="flex justify-between items-start mb-4 sm:mb-6">
                                <div>
                                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">{selectedApplet.name}</h2>
                                    <span className="bg-blue-900/30 text-blue-400 px-2 sm:px-3 py-1 rounded-full text-xs font-mono border border-blue-500/30">
                                        ID: {selectedApplet.id}
                                    </span>
                                </div>
                                <button onClick={() => setSelectedAppletId(null)} className="text-gray-400 hover:text-white transition-colors text-2xl p-2">
                                    &times;
                                </button>
                            </div>

                            <p className="text-gray-300 leading-relaxed mb-6 sm:mb-8 text-sm sm:text-base md:text-lg">
                                {selectedApplet.description}
                            </p>

                            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
                                <div className="bg-gray-950 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-gray-800">
                                    <span className="text-gray-500 text-xs sm:text-sm block mb-1">Input Schema</span>
                                    <span className="text-green-400 font-mono text-sm sm:text-base">{selectedApplet.inputSchema || "JSON"}</span>
                                </div>
                                <div className="bg-gray-950 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-gray-800">
                                    <span className="text-gray-500 text-xs sm:text-sm block mb-1">Output Schema</span>
                                    <span className="text-green-400 font-mono text-sm sm:text-base">{selectedApplet.outputSchema || "JSON"}</span>
                                </div>
                                <div className="bg-gray-950 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-gray-800">
                                    <span className="text-gray-500 text-xs sm:text-sm block mb-1">Price per call</span>
                                    <span className="text-white font-mono text-sm sm:text-lg">{selectedApplet.price} ETH</span>
                                </div>
                                <div className="bg-gray-950 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-gray-800">
                                    <span className="text-gray-500 text-xs sm:text-sm block mb-1">Owner</span>
                                    <span className="text-gray-400 font-mono text-xs truncate block" title={selectedApplet.owner}>{selectedApplet.owner}</span>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                                <button onClick={() => setSelectedAppletId(null)} className="px-4 sm:px-6 py-2 text-gray-400 hover:text-white transition-colors order-2 sm:order-1">
                                    Close
                                </button>
                                <button
                                    onClick={() => handleUseApplet(selectedApplet.id)}
                                    className="px-4 sm:px-6 py-2 sm:py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm sm:text-base order-1 sm:order-2"
                                >
                                    Add to Pipeline
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:gap-6 mb-8 sm:mb-12">
                    <div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">Applet Marketplace</h1>
                        <p className="text-gray-400 text-sm sm:text-base">Discover and integrate decentralized micro-services.</p>
                    </div>

                    {/* Search and Register */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <input
                            type="text"
                            placeholder="Search applets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 sm:py-3 text-white focus:outline-none focus:border-blue-500 text-sm sm:text-base"
                        />
                        <button
                            onClick={() => setIsRegisterOpen(!isRegisterOpen)}
                            disabled={!isConnected}
                            className={`whitespace-nowrap px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all text-sm sm:text-base ${isConnected
                                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                }`}
                            title={!isConnected ? "Connect Wallet to Register" : ""}
                        >
                            {isRegisterOpen ? 'Close' : isConnected ? 'Register Applet' : 'Connect to Register'}
                        </button>
                    </div>
                </div>

                {/* Registration Form */}
                {isRegisterOpen && (
                    <div className="mb-8 sm:mb-12 p-4 sm:p-6 md:p-8 bg-gray-900/50 border border-gray-800 rounded-xl sm:rounded-2xl">
                        <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Register New Applet</h2>
                        <form className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6" onSubmit={handleRegister}>
                            <div className="space-y-2">
                                <label className="text-xs sm:text-sm font-medium text-gray-400">Applet Name</label>
                                <input
                                    type="text"
                                    value={newAppletName}
                                    onChange={(e) => setNewAppletName(e.target.value)}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:border-blue-500 transition-colors text-sm sm:text-base"
                                    placeholder="e.g. Text Summarizer"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs sm:text-sm font-medium text-gray-400">Price (ETH)</label>
                                <input
                                    type="number"
                                    step="0.001"
                                    value={newAppletPrice}
                                    onChange={(e) => setNewAppletPrice(e.target.value)}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:border-blue-500 transition-colors text-sm sm:text-base"
                                    placeholder="0.05"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs sm:text-sm font-medium text-gray-400">Input Type</label>
                                <select
                                    value={newAppletInputSchema}
                                    onChange={(e) => setNewAppletInputSchema(e.target.value)}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:border-blue-500 transition-colors text-white text-sm sm:text-base"
                                >
                                    <option>Text</option>
                                    <option>Image</option>
                                    <option>CSV</option>
                                    <option>JSON</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs sm:text-sm font-medium text-gray-400">Output Type</label>
                                <select
                                    value={newAppletOutputSchema}
                                    onChange={(e) => setNewAppletOutputSchema(e.target.value)}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:border-blue-500 transition-colors text-white text-sm sm:text-base"
                                >
                                    <option>JSON</option>
                                    <option>Text</option>
                                    <option>Image</option>
                                    <option>CSV</option>
                                </select>
                            </div>
                            <div className="sm:col-span-2 space-y-2">
                                <label className="text-xs sm:text-sm font-medium text-gray-400">Description</label>
                                <textarea
                                    value={newAppletDesc}
                                    onChange={(e) => setNewAppletDesc(e.target.value)}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:border-blue-500 transition-colors h-24 sm:h-32 text-sm sm:text-base"
                                    placeholder="Describe functionality..."
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <button
                                    disabled={isPending || isConfirming}
                                    className={`w-full py-2.5 sm:py-3 font-medium rounded-lg border transition-colors text-sm sm:text-base ${isPending || isConfirming ? 'bg-gray-700 text-gray-400 border-gray-600 cursor-wait' : 'bg-gray-800 hover:bg-gray-700 text-white border-gray-700'}`}
                                >
                                    {isPending ? 'Awaiting Confirmation...' : isConfirming ? 'Confirming...' : USE_REAL_CONTRACTS ? 'Register on Blockchain' : 'Register (Mock)'}
                                </button>
                                {registerError && <p className="text-red-400 text-sm mt-2">{registerError.message}</p>}
                            </div>
                        </form>
                    </div>
                )}

                {/* Applet Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {filteredApplets.length > 0 ? (
                        filteredApplets.map((applet: any, idx: number) => (
                            <AppletCard
                                key={idx}
                                id={Number(applet.id) || idx + 1}
                                name={applet.name}
                                description={applet.description}
                                price={applet.price}
                                owner={applet.owner}
                                isActive={applet.isActive}
                                onViewDetails={(id) => setSelectedAppletId(id)}
                                onPurchase={(id) => handleUseApplet(id)}
                            />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12 sm:py-20 text-gray-500">
                            No applets found matching "{searchQuery}"
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
