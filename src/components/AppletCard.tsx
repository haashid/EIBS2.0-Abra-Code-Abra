import { formatEther } from "viem";

interface AppletProps {
    id: number;
    name: string;
    description: string;
    price: bigint;
    owner: string;
    isActive: boolean;
    onPurchase?: (id: number) => void;
    onViewDetails?: (id: number) => void;
}

export default function AppletCard({ id, name, description, price, owner, isActive, onPurchase, onViewDetails }: AppletProps) {
    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-500/50 transition-all group relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{name}</h3>
                        <span className="text-xs text-gray-500 font-mono">ID: #{id}</span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${isActive ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                        {isActive ? 'Active' : 'Inactive'}
                    </span>
                </div>

                <p className="text-gray-400 text-sm mb-6 h-12 overflow-hidden line-clamp-2">
                    {description}
                </p>

                <div className="flex items-center justify-between mt-auto border-t border-gray-800 pt-4">
                    <button
                        onClick={() => onViewDetails && onViewDetails(id)}
                        className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                        View Details →
                    </button>
                    <div className="flex flex-col text-right">
                        <span className="text-xs text-gray-500">Price</span>
                        <span className="text-lg font-bold text-white font-mono">{formatEther(price)} ETH</span>
                    </div>
                </div>

                {isActive && onPurchase && (
                    <button
                        onClick={() => onPurchase(id)}
                        className="w-full mt-4 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 rounded-lg transition-colors border border-gray-700 hover:border-gray-600"
                    >
                        Add to Pipeline
                    </button>
                )}
            </div>
        </div>
    );
}
