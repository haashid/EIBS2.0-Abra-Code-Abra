"use client";

import { useEffect, useState } from "react";

export default function DebugWalletPage() {
    const [info, setInfo] = useState<string>("Loading...");

    useEffect(() => {
        const debug = async () => {
            const lines: string[] = [];

            lines.push("=== Window Wallet Objects ===");

            // Check common wallet properties
            const walletKeys = ['wauth', 'WeilWallet', 'ethereum', 'weilliptic'];
            for (const key of walletKeys) {
                const obj = (window as any)[key];
                if (obj) {
                    lines.push(`\n>> window.${key} EXISTS`);
                    lines.push(`   Type: ${typeof obj}`);

                    // Get all properties
                    const props = Object.getOwnPropertyNames(obj);
                    lines.push(`   Properties: ${props.join(', ')}`);

                    // Get prototype methods
                    const proto = Object.getPrototypeOf(obj);
                    if (proto) {
                        const protoProps = Object.getOwnPropertyNames(proto);
                        lines.push(`   Prototype: ${protoProps.join(', ')}`);
                    }

                    // Check for request method
                    if (typeof obj.request === 'function') {
                        lines.push(`   Has request() method: YES`);
                    }

                    // Check for connect method
                    if (typeof obj.connect === 'function') {
                        lines.push(`   Has connect() method: YES`);
                    }

                    // Check for enable method
                    if (typeof obj.enable === 'function') {
                        lines.push(`   Has enable() method: YES`);
                    }

                    // Try to call wallet_getSettings if request exists
                    if (typeof obj.request === 'function') {
                        try {
                            const settings = await obj.request({ method: 'wallet_getSettings' });
                            lines.push(`   wallet_getSettings: ${JSON.stringify(settings)}`);
                        } catch (e: any) {
                            lines.push(`   wallet_getSettings ERROR: ${e.message}`);
                        }

                        try {
                            const accounts = await obj.request({ method: 'wallet_getAccounts' });
                            lines.push(`   wallet_getAccounts: ${JSON.stringify(accounts)}`);
                        } catch (e: any) {
                            lines.push(`   wallet_getAccounts ERROR: ${e.message}`);
                        }
                    }
                } else {
                    lines.push(`\n>> window.${key} NOT FOUND`);
                }
            }

            setInfo(lines.join('\n'));
        };

        // Wait for wallet injection
        setTimeout(debug, 1000);
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 text-green-400 p-8 font-mono">
            <h1 className="text-2xl mb-4">🔍 Wallet Debug</h1>
            <pre className="whitespace-pre-wrap bg-black p-4 rounded border border-green-800">
                {info}
            </pre>
            <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded"
            >
                Refresh
            </button>
        </div>
    );
}
