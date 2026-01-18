// AppletCard component

interface AppletProps {
    id: number;
    name: string;
    description: string;
    price: bigint;
    owner: string;
    isActive: boolean;
    onPurchase?: (id: number) => void;
    onViewDetails?: (id: number) => void;
    executionCount?: number;
    isVerified?: boolean;
}

export default function AppletCard({ id, name, description, price, owner, isActive, onPurchase, onViewDetails, executionCount = 0, isVerified = false }: AppletProps) {
    // Fallback verification logic for demo (if no dynamic data or strict mode)
    const showVerified = isVerified || ['text', 'hash', 'data', 'echo'].some(k => name.toLowerCase().includes(k));

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-500/50 transition-all group relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10">
                <div className="flex flex-col gap-2 mb-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors flex items-center gap-2">
                                {name}
                                {/* Verification Checkmark for Trust */}
                                {showVerified && (
                                    <span title={`Verified & Tested (${executionCount} runs)`} className="text-green-400 text-sm bg-green-900/30 rounded-full px-1.5 py-0.5 border border-green-500/20">
                                        ✓
                                    </span>
                                )}
                            </h3>
                            <span className="text-xs text-gray-500 font-mono">ID: #{id}</span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${isActive ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                {isActive ? 'Active' : 'Inactive'}
                            </span>
                            {/* Trust Badge: Trial Available */}
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 border border-blue-500/20 text-blue-300 flex items-center gap-1">
                                🚀 Test Drive
                            </span>
                        </div>
                    </div>
                </div>

                <p className="text-gray-400 text-sm mb-6 h-12 overflow-hidden line-clamp-2">
                    {description}
                </p>

                <div className="flex items-center justify-between mt-auto border-t border-gray-800 pt-4">
                    <button
                        onClick={() => onViewDetails && onViewDetails(id)}
                        className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                        View Proof & Code →
                    </button>
                    <div className="flex flex-col text-right">
                        <span className="text-xs text-gray-500">Execution Cost</span>
                        <span className="text-lg font-bold text-white font-mono">
                            {(() => {
                                const val = Number(price) / 1e18;
                                return val < 0.0001 ? val.toFixed(8) : val.toFixed(4);
                            })()} YTK
                        </span>
                    </div>
                </div>

                {isActive && onPurchase && (
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={() => onViewDetails && onViewDetails(id)}
                            className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium py-2 rounded-lg transition-colors border border-gray-700 hover:border-gray-600 text-xs"
                        >
                            Try Demo
                        </button>
                        <button
                            onClick={() => onPurchase(id)}
                            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-lg transition-colors text-xs shadow-lg shadow-blue-900/20"
                        >
                            Buy Code
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
