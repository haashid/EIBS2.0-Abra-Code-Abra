"use client";

import Link from "next/link";
import { useWeil } from "@/context/WeilProvider";
import { useEffect, useState } from "react";

export default function Navbar() {
    const { address, isConnected, connect, disconnect, isConnecting, error } = useWeil();
    const [mounted, setMounted] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleConnect = async () => {
        await connect();
    };

    return (
        <nav className="sticky top-0 z-40 flex items-center justify-between p-4 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
            {/* Logo */}
            <Link href="/" className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent shrink-0">
                WeilChain Nexus
            </Link>

            {/* Desktop Navigation - Hidden on mobile/tablet */}
            <div className="hidden xl:flex items-center gap-6">
                <Link href="/marketplace" className="text-gray-400 hover:text-white transition-colors text-sm">Marketplace</Link>
                <Link href="/pipeline" className="text-gray-400 hover:text-white transition-colors text-sm">Pipeline</Link>
                <Link href="/history" className="text-gray-400 hover:text-white transition-colors text-sm">History</Link>

                {mounted && isConnected ? (
                    <div className="flex items-center gap-3 ml-4">
                        <span className="text-xs text-gray-400 font-mono bg-gray-800 px-3 py-1.5 rounded-full flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            {typeof address === 'string' ? `${address.slice(0, 8)}...${address.slice(-6)}` : 'Connected'}
                        </span>
                        <button
                            onClick={() => disconnect()}
                            className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
                        >
                            Disconnect
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleConnect}
                        disabled={isConnecting}
                        className="ml-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg text-base font-semibold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-500/20"
                    >
                        {isConnecting ? (
                            <>
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Connecting...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Connect WAuth
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Mobile Hamburger Button - Visible on mobile/tablet */}
            <button
                className="xl:hidden p-2 text-gray-400 hover:text-white transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isMobileMenuOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                </svg>
            </button>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="absolute top-full left-0 right-0 bg-gray-900 border-b border-gray-800 p-4 flex flex-col gap-2 xl:hidden z-50 shadow-2xl">
                    <Link
                        href="/marketplace"
                        className="text-base text-gray-300 hover:text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        Marketplace
                    </Link>
                    <Link
                        href="/pipeline"
                        className="text-base text-gray-300 hover:text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        Pipeline
                    </Link>
                    <Link
                        href="/history"
                        className="text-base text-gray-300 hover:text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        History
                    </Link>

                    <div className="border-t border-gray-800 mt-2 pt-4">
                        {error && (
                            <p className="text-red-400 text-sm mb-3 px-4">{error}</p>
                        )}
                        {mounted && isConnected ? (
                            <div className="flex flex-col gap-3">
                                <span className="text-sm text-gray-400 font-mono bg-gray-800 px-4 py-2 rounded-lg text-center flex items-center justify-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    {typeof address === 'string' ? `${address.slice(0, 8)}...${address.slice(-6)}` : 'Connected'}
                                </span>
                                <button
                                    onClick={() => { disconnect(); setIsMobileMenuOpen(false); }}
                                    className="w-full px-4 py-3 text-sm font-medium text-red-400 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                                >
                                    Disconnect Wallet
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => { handleConnect(); setIsMobileMenuOpen(false); }}
                                disabled={isConnecting}
                                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isConnecting ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Connecting...
                                    </>
                                ) : (
                                    <>Connect WAuth</>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
