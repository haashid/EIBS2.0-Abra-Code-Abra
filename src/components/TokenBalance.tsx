"use client";

import { useTokenBalance, useTokenInfo } from "@/hooks/useYutakaToken";
import { useWeil } from "@/context/WeilProvider";

export default function TokenBalance() {
    const { isConnected } = useWeil();
    const { balance, isLoading: balanceLoading } = useTokenBalance();
    const { details, isLoading: infoLoading } = useTokenInfo();

    if (!isConnected) {
        return null;
    }

    const isLoading = balanceLoading || infoLoading;
    const symbol = details?.symbol || "YTK";
    const decimals = details?.decimals || 6;

    // Format balance with decimals
    const formattedBalance = (balance / Math.pow(10, decimals)).toFixed(2);

    return (
        <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-3 py-2 border border-gray-700">
            <span className="text-cyan-400 font-medium">
                {isLoading ? (
                    <span className="animate-pulse">...</span>
                ) : (
                    `${formattedBalance} ${symbol}`
                )}
            </span>
        </div>
    );
}
