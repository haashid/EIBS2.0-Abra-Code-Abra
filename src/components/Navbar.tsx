"use client";

import Link from "next/link";
import { useWeil } from "@/context/WeilProvider";
import { useEffect, useState } from "react";
import { useTokenBalance } from "@/hooks/useYutakaToken";
import { formatEther } from "viem";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
    const { address, isConnected, connect, disconnect, isConnecting, error } = useWeil();
    const [mounted, setMounted] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Fetch token balance if connected
    const { balance, isLoading: balanceLoading } = useTokenBalance(address || "");

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleConnect = async () => {
        await connect();
    };

    return (
        <motion.nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'py-4 bg-[#030305]/80 backdrop-blur-xl border-b border-white/5' : 'py-6 bg-transparent'}`}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                {/* Logo */}
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                    {/* User logo from public/nexus logo.png */}
                    <img src="/nexus%20logo.png" alt="WeilChain Logo" className="w-8 h-8 object-contain" />
                    <span className="text-xl font-bold tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                        WeilChain <span className="text-cyan-500 font-light">Nexus</span>
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden xl:flex items-center gap-8">
                    <NavLink href="/marketplace">Marketplace</NavLink>
                    <NavLink href="/pipeline">Pipeline</NavLink>
                    <NavLink href="/history">History</NavLink>
                </div>

                {/* Actions */}
                <div className="hidden xl:flex items-center gap-4">
                    {mounted && isConnected ? (
                        <div className="flex items-center gap-3">
                            {balance > 0 && (
                                <div className="hidden md:flex flex-col items-end mr-2">
                                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">Balance</span>
                                    <span className="text-sm font-medium font-mono text-cyan-400">
                                        {balanceLoading ? "..." : Number(formatEther(BigInt(balance))).toFixed(4)} YTK
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse" />
                                <span className="text-xs font-mono text-gray-300">
                                    {typeof address === 'string' ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}
                                </span>
                            </div>

                            <button
                                onClick={() => disconnect()}
                                className="text-xs text-gray-500 hover:text-red-400 transition-colors uppercase tracking-wider font-medium"
                            >
                                Disconnect
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleConnect}
                            disabled={isConnecting}
                            className="relative group px-6 py-2 bg-white text-black rounded-lg font-bold text-sm overflow-hidden transition-all hover:scale-105"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                                {!isConnecting && (
                                    <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                )}
                            </span>
                        </button>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="xl:hidden p-2 text-white/70 hover:text-white transition-colors"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {isMobileMenuOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="xl:hidden border-t border-white/5 bg-[#030305] overflow-hidden"
                    >
                        <div className="px-6 py-8 flex flex-col gap-4">
                            <MobileNavLink href="/marketplace" onClick={() => setIsMobileMenuOpen(false)}>Marketplace</MobileNavLink>
                            <MobileNavLink href="/pipeline" onClick={() => setIsMobileMenuOpen(false)}>Pipeline</MobileNavLink>
                            <MobileNavLink href="/history" onClick={() => setIsMobileMenuOpen(false)}>History</MobileNavLink>

                            <div className="h-px bg-white/5 my-2" />

                            {mounted && isConnected ? (
                                <div className="flex flex-col gap-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">Wallet</span>
                                        <span className="font-mono text-sm text-gray-300">{typeof address === 'string' ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}</span>
                                    </div>
                                    <button
                                        onClick={() => { disconnect(); setIsMobileMenuOpen(false); }}
                                        className="w-full py-3 bg-red-500/10 text-red-400 rounded-lg text-sm font-medium"
                                    >
                                        Disconnect
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => { handleConnect(); setIsMobileMenuOpen(false); }}
                                    className="w-full py-3 bg-white text-black rounded-lg text-sm font-bold"
                                >
                                    Connect Wallet
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}

function NavLink({ href, children }: { href: string, children: React.ReactNode }) {
    return (
        <Link href={href} className="text-sm font-medium text-gray-400 hover:text-white transition-colors relative group">
            {children}
            <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-white transition-all group-hover:w-full" />
        </Link>
    );
}

function MobileNavLink({ href, onClick, children }: { href: string, onClick: () => void, children: React.ReactNode }) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className="text-lg font-medium text-gray-300 hover:text-white"
        >
            {children}
        </Link>
    );
}
