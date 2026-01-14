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
            const contractToQuery = REGISTRY_ADDRESS;

            console.log("[Applets] Querying get_all_applets from:", contractToQuery);

            // Try get_all_applets directly
            const result = await queryContract(contractToQuery, "get_all_applets", {});

            console.log("[Applets] get_all_applets raw result:", result);
            console.log("[Applets] result type:", typeof result);
            console.log("[Applets] result is array:", Array.isArray(result));

            // Handle various response formats
            let appletList: any[] = [];
            if (Array.isArray(result)) {
                appletList = result;
            } else if (result?.Ok && Array.isArray(result.Ok)) {
                appletList = result.Ok;
            } else if (result?.data && Array.isArray(result.data)) {
                appletList = result.data;
            }

            console.log("[Applets] Parsed list:", appletList);

            const fetchedApplets: ContractApplet[] = appletList.map((applet, i) => ({
                token_id: String(applet.token_id ?? applet.id ?? i),
                name: applet.name || `Applet ${i}`,
                description: applet.description || "",
                applet_address: applet.applet_address || "",
                price: Number(applet.price) || 0,
                input_schema: applet.input_schema || "JSON",
                output_schema: applet.output_schema || "JSON",
                owner: applet.owner || "",
            }));

            console.log("[Applets] Mapped applets:", fetchedApplets);
            setApplets(fetchedApplets);
        } catch (err: any) {
            setError(err.message);
            console.error("[Applets] Failed to fetch applets:", err);
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
        appletAddress: string,  // Contract address of the deployed applet
        priceInTokens: number,
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
            console.log("Registering applet on chain:", {
                name, description, appletAddress, price: priceInTokens, inputSchema, outputSchema
            });

            // New registry signature with applet_address
            const result = await wallet.contracts.execute(
                REGISTRY_ADDRESS,
                "register_applet",
                {
                    name,
                    description,
                    applet_address: appletAddress,
                    price: priceInTokens,
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
