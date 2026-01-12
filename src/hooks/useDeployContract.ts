"use client";

import { useWeil } from "@/context/WeilProvider";
import { useState, useCallback } from "react";

// Hook to deploy contracts directly from browser
export function useDeployContract() {
    const { wallet, isConnected } = useWeil();
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
            const result = await wallet.contracts.deploy({
                wasm: wasmHex,
                widl: widlContent,
                author: metadata?.author || "WeilChain Nexus",
                description: metadata?.description || "Deployed via WeilChain Nexus",
            });

            console.log("Deploy result:", result);

            const address = result?.contract_address || result?.address || result;
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
