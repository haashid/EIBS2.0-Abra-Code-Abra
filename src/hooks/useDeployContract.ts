"use client";

import { useWeil } from "@/context/WeilProvider";
import { useState, useCallback } from "react";

// Hook to deploy contracts directly from browser
export function useDeployContract() {
    const { wallet, isConnected, podId } = useWeil();
    const [isDeploying, setIsDeploying] = useState(false);
    const [deployedAddress, setDeployedAddress] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fileToHex = async (file: File): Promise<string> => {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const deployContract = useCallback(async (
        wasmFile: File,
        widlFile: File,
        metadata?: { author?: string; description?: string }
    ): Promise<string> => {
        if (!isConnected || !wallet) {
            throw new Error("Wallet not connected");
        }

        setIsDeploying(true);
        setError(null);
        setDeployedAddress(null);

        try {
            // Convert files to hex
            const [wasmHex, widlContent] = await Promise.all([
                fileToHex(wasmFile),
                widlFile.text()
            ]);

            console.log("Deploying contract...");
            console.log("WASM size:", wasmFile.size, "bytes");
            console.log("WIDL length:", widlContent.length, "chars");

            // Deploy using wallet SDK
            // Note: SDK signature may vary - trying different patterns
            let result: any;
            try {
                // Try new-style object argument first
                result = await (wallet.contracts as any).deploy({
                    wasm: wasmHex,
                    widl: widlContent,
                    author: metadata?.author || "WeilChain Nexus",
                    pod: podId || "senate",
                });
            } catch {
                // Fallback to positional arguments
                result = await (wallet.contracts as any).deploy(
                    wasmHex,
                    widlContent,
                    metadata?.author || "WeilChain Nexus",
                    podId || "senate"
                );
            }

            console.log("Deploy result:", result);

            const address = typeof result === 'string'
                ? result
                : result?.contract_address || result?.address || String(result);
            setDeployedAddress(address);
            return address;
        } catch (err: any) {
            const errorMsg = err.message || JSON.stringify(err);
            setError(errorMsg);
            console.error("Deploy failed:", err);
            throw new Error(errorMsg);
        } finally {
            setIsDeploying(false);
        }
    }, [wallet, isConnected]);

    return { deployContract, isDeploying, deployedAddress, error };
}
