"use client";

import { useWeil } from "@/context/WeilProvider";
import Navbar from "@/components/Navbar";
import AppletCard from "@/components/AppletCard";
import RegisterAppletModal from "@/components/RegisterAppletModal";
import DeployContractModal from "@/components/DeployContractModal";
import { parseEther, formatEther } from "viem";
import React, { useState, useEffect } from "react";
import { useMockData } from "@/context/MockDataContext";
import { useApplets, useRegisterApplet, ContractApplet } from "@/hooks/useAppletRegistry";
import { useRouter } from "next/navigation";

// Check if we should use real contracts (non-zero address)
const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_WEIL_REGISTRY_ADDRESS || "";
const USE_REAL_CONTRACTS = REGISTRY_ADDRESS && REGISTRY_ADDRESS.length > 10;

export default function Marketplace() {
    const router = useRouter();
    const { isConnected, address } = useWeil();

    // Mock data hooks (fallback)
    const { applets: mockApplets, registerApplet: mockRegisterApplet } = useMockData();

    // Real contract hooks
    const { applets: contractApplets, isLoading: contractLoading, refetch } = useApplets();
    const { registerApplet: contractRegister, isPending, isConfirming, isSuccess, error: registerError } = useRegisterApplet();

    // Refetch when registration succeeds
    useEffect(() => {
        if (isSuccess) {
            refetch();
            setIsDeployOpen(false);
        }
    }, [isSuccess, refetch]);

    const [isDeployOpen, setIsDeployOpen] = useState(false);
    const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedAppletId, setSelectedAppletId] = useState<number | null>(null);

    const handleUseApplet = (id: number) => {
        router.push(`/pipeline?appletId=${id}`);
    };



    // Determine which data source to use
    const applets = USE_REAL_CONTRACTS && Array.isArray(contractApplets)
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
                            onClick={() => setIsDeployModalOpen(true)}
                            disabled={!isConnected}
                            className={`whitespace-nowrap px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all text-sm sm:text-base ${isConnected
                                ? 'bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white shadow-lg shadow-cyan-500/20'
                                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                }`}
                            title={!isConnected ? "Connect Wallet to Deploy" : ""}
                        >
                            🚀 Deploy Contract
                        </button>
                        <button
                            onClick={() => setIsDeployOpen(true)}
                            disabled={!isConnected}
                            className={`whitespace-nowrap px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all text-sm sm:text-base ${isConnected
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/20'
                                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                }`}
                            title={!isConnected ? "Connect Wallet to Register" : ""}
                        >
                            📝 Register Applet
                        </button>
                    </div>
                </div>


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

            {/* Register Deployed Applet Modal */}
            <RegisterAppletModal
                isOpen={isDeployOpen}
                onClose={() => setIsDeployOpen(false)}
                onSuccess={(appletData) => {
                    console.log("Registered:", appletData);
                    // Add to mock data so it shows immediately
                    mockRegisterApplet(
                        appletData.name,
                        appletData.description,
                        appletData.price,
                        appletData.inputSchema,
                        appletData.outputSchema
                    );
                    refetch();
                    setIsDeployOpen(false);
                }}
            />

            {/* Deploy Contract Modal */}
            <DeployContractModal
                isOpen={isDeployModalOpen}
                onClose={() => setIsDeployModalOpen(false)}
                onSuccess={(address) => {
                    console.log("Deployed contract at:", address);
                    setIsDeployModalOpen(false);
                }}
            />
        </div>
    );
}
