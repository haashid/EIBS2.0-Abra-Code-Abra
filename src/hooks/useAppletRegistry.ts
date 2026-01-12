"use client";

import { useWeil } from "@/context/WeilProvider";
import { useState, useCallback, useEffect } from "react";

const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_WEIL_REGISTRY_ADDRESS || "";
const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_WEIL_MARKETPLACE_ADDRESS || "";
const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_WEIL_TOKEN_ADDRESS || "";

// Type for Applet from our new AppletRegistry contract
export interface ContractApplet {
    token_id: string;
    name: string;
    description: string;
    applet_address: string;
    price: number;
    input_schema: string;
    output_schema: string;
    owner: string;
}

// Hook to read all applets from the contract
export function useApplets() {
    const { queryContract, isConnected, wallet } = useWeil();
    const [applets, setApplets] = useState<ContractApplet[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        // Only fetch if connected with a wallet and have registry address
        if (!isConnected || !wallet || !REGISTRY_ADDRESS) {
            // Return silently - wallet not connected yet
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Query Marketplace for all listed applets
            const contractToQuery = MARKETPLACE_ADDRESS || REGISTRY_ADDRESS;
            const methodName = MARKETPLACE_ADDRESS ? "get_all_listed_applets" : "get_all_applets";

            const result = await queryContract(
                contractToQuery,
                methodName,
                {}
            );
            setApplets(result || []);
        } catch (err: any) {
            setError(err.message);
            console.error("Failed to fetch applets:", err);
        } finally {
            setIsLoading(false);
        }
    }, [queryContract, isConnected, wallet]);

    // Auto-fetch when wallet connects
    useEffect(() => {
        if (isConnected && wallet) {
            refetch();
        }
    }, [isConnected, wallet, refetch]);

    return {
        applets,
        isLoading,
        error,
        refetch,
    };
}

// Hook to register a new applet
export function useRegisterApplet() {
    const { isConnected, wallet } = useWeil();
    const [isPending, setIsPending] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);

    const registerApplet = useCallback(async (
        name: string,
        description: string,
        priceInEther: string,
        inputSchema: string,
        outputSchema: string
    ) => {
        if (!isConnected || !wallet || !REGISTRY_ADDRESS) {
            throw new Error("Wallet not connected or registry address not set");
        }

        setIsPending(true);
        setIsConfirming(false);
        setIsSuccess(false);
        setError(null);
        setTxHash(null);

        try {
            // Convert price to uint (in smallest unit)
            const priceUint = Math.floor(parseFloat(priceInEther) * 1e18);

            console.log("Registering applet on chain:", {
                name, description, price: priceUint, inputSchema, outputSchema
            });

            const result = await wallet.contracts.execute(
                REGISTRY_ADDRESS,
                "register_applet",
                {
                    name,
                    description,
                    price: priceUint,
                    input_schema: inputSchema,
                    output_schema: outputSchema
                }
            );

            console.log("Registration result:", result);

            // Extract transaction hash if available
            if (result && result.transaction_id) {
                setTxHash(result.transaction_id);
            }

            setIsConfirming(true);
            setIsSuccess(true);
        } catch (err: any) {
            const msg = err.message || JSON.stringify(err);
            setError(msg);
            console.error("Failed to register applet:", err);
        } finally {
            setIsPending(false);
            setIsConfirming(false);
        }
    }, [isConnected, wallet]);

    return {
        registerApplet,
        hash: null,
        isPending,
        isConfirming,
        isSuccess,
        error,
    };
}
