"use client";

import { useState } from "react";
import { formatEther, parseEther } from "viem";

interface PaymentBreakdown {
    appletName: string;
    price: bigint;
    owner: string;
}

interface PaymentConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    breakdown: PaymentBreakdown[];
    totalCost: bigint;
    userBalance: bigint;
    tokenSymbol?: string;
}

export default function PaymentConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    breakdown,
    totalCost,
    userBalance,
    tokenSymbol = "YTK"
}: PaymentConfirmModalProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const hasInsufficientBalance = userBalance < totalCost;

    const handleConfirm = async () => {
        // Temporarily bypass balance check - contract will enforce it anyway
        // if (hasInsufficientBalance) {
        //     setError("Insufficient token balance");
        //     return;
        // }

        setIsProcessing(true);
        setError(null);

        try {
            await onConfirm();
            onClose();
        } catch (err: any) {
            setError(err.message || "Payment failed");
        } finally {
            setIsProcessing(false);
        }
    };

    // Calculate payment distribution
    const platformFee = (totalCost * BigInt(10)) / BigInt(100); // 10%
    const networkFee = (totalCost * BigInt(5)) / BigInt(100); // 5%
    const developerAmount = totalCost - platformFee - networkFee; // 85%

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-900 to-black border border-cyan-500/30 rounded-2xl max-w-2xl w-full p-8 shadow-2xl shadow-cyan-500/20">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Confirm Payment</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                        disabled={isProcessing}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Balance Display */}
                <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-4 mb-6">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Your Balance:</span>
                        <span className="text-2xl font-bold text-white">
                            {formatEther(userBalance)} {tokenSymbol}
                        </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-gray-400">Total Cost:</span>
                        <span className="text-2xl font-bold text-cyan-400">
                            {formatEther(totalCost)} {tokenSymbol}
                        </span>
                    </div>
                    {hasInsufficientBalance && (
                        <div className="mt-3 text-red-400 text-sm flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Insufficient balance. You need {formatEther(totalCost - userBalance)} more {tokenSymbol}.
                        </div>
                    )}
                </div>

                {/* Applet Breakdown */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Applet Costs</h3>
                    <div className="space-y-2">
                        {breakdown.map((item, index) => (
                            <div
                                key={index}
                                className="flex justify-between items-center bg-gray-800/50 border border-gray-700/50 rounded-lg p-3"
                            >
                                <div>
                                    <div className="font-medium text-white">{item.appletName}</div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        Owner: {item.owner.substring(0, 10)}...{item.owner.substring(item.owner.length - 8)}
                                    </div>
                                </div>
                                <div className="text-cyan-400 font-semibold">
                                    {formatEther(item.price)} {tokenSymbol}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Revenue Distribution */}
                <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4 mb-6">
                    <h3 className="text-sm font-semibold text-gray-400 mb-3">Payment Distribution</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Developer (85%)</span>
                            <span className="text-green-400 font-medium">{formatEther(developerAmount)} {tokenSymbol}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Platform Fee (10%)</span>
                            <span className="text-blue-400 font-medium">{formatEther(platformFee)} {tokenSymbol}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Network Fee (5%)</span>
                            <span className="text-purple-400 font-medium">{formatEther(networkFee)} {tokenSymbol}</span>
                        </div>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isProcessing} // FORCE ENABLE: Removed || hasInsufficientBalance
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/30"
                    >
                        {isProcessing ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Processing...
                            </span>
                        ) : (
                            "Approve & Execute"
                        )}
                    </button>
                </div>

                {/* Info */}
                <div className="mt-4 text-xs text-gray-500 text-center">
                    This will execute a token approval followed by the pipeline execution.
                    <br />
                    You will sign two transactions: approve and execute.
                </div>
            </div>
        </div>
    );
}
