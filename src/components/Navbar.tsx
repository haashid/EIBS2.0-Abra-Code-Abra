"use client";

import Link from "next/link";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { useEffect, useState } from "react";

export default function Navbar() {
    const { address, isConnected } = useAccount();
    const { connect } = useConnect();
    const { disconnect } = useDisconnect();
    const [mounted, setMounted] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <nav className="relative flex items-center justify-between p-4 md:p-6 bg-gray-900 border-b border-gray-800">
            <div className="flex items-center gap-8">
                <Link href="/" className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    WeilChain Nexus
                </Link>
                {/* Desktop Menu */}
                <div className="hidden lg:flex gap-6 text-gray-400">
                    <Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link>
                    <Link href="/pipeline" className="hover:text-white transition-colors">Pipeline</Link>
                    <Link href="/history" className="hover:text-white transition-colors">History</Link>
                </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-4">
                {/* Wallet Button (Visible on all screens, simplified on mobile if needed) */}
                <div className="hidden lg:block">
                    {mounted && isConnected ? (
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-400 font-mono bg-gray-800 px-3 py-1 rounded-full">
                                {address?.slice(0, 6)}...{address?.slice(-4)}
                            </span>
                            <button
                                onClick={() => disconnect()}
                                className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
                            >
                                Disconnect
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => connect({ connector: injected() })}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)]"
                        >
                            Connect Wallet
                        </button>
                    )}
                </div>

                {/* Hamburger Button */}
                <button
                    className="lg:hidden p-2 text-gray-400 hover:text-white"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {isMobileMenuOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="absolute top-full left-0 right-0 bg-gray-900 border-b border-gray-800 p-6 flex flex-col gap-4 lg:hidden z-50 shadow-2xl animate-in slide-in-from-top-2">
                    <Link href="/marketplace" className="text-lg text-gray-300 hover:text-white py-2 border-b border-gray-800" onClick={() => setIsMobileMenuOpen(false)}>Marketplace</Link>
                    <Link href="/pipeline" className="text-lg text-gray-300 hover:text-white py-2 border-b border-gray-800" onClick={() => setIsMobileMenuOpen(false)}>Pipeline</Link>
                    <Link href="/history" className="text-lg text-gray-300 hover:text-white py-2 border-b border-gray-800" onClick={() => setIsMobileMenuOpen(false)}>History</Link>

                    <div className="pt-4">
                        {mounted && isConnected ? (
                            <div className="flex flex-col gap-4">
                                <span className="text-sm text-gray-400 font-mono bg-gray-800 px-3 py-2 rounded-lg text-center">
                                    {address?.slice(0, 6)}...{address?.slice(-4)}
                                </span>
                                <button
                                    onClick={() => { disconnect(); setIsMobileMenuOpen(false); }}
                                    className="w-full px-4 py-3 text-sm font-medium text-red-400 bg-gray-800/50 rounded-lg"
                                >
                                    Disconnect Wallet
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => { connect({ connector: injected() }); setIsMobileMenuOpen(false); }}
                                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium"
                            >
                                Connect Wallet
                            </button>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
