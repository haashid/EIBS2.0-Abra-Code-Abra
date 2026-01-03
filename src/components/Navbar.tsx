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

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <nav className="flex items-center justify-between p-6 bg-gray-900 border-b border-gray-800">
            <div className="flex items-center gap-8">
                <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    WeilChain Nexus
                </Link>
                <div className="flex gap-6 text-gray-400">
                    <Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link>
                    <Link href="/pipeline" className="hover:text-white transition-colors">Pipeline</Link>
                    <Link href="/history" className="hover:text-white transition-colors">History</Link>
                </div>
            </div>

            <div>
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
        </nav>
    );
}
