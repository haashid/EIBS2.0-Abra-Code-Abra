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
    wasm_cid?: string;  // IPFS CID for WASM file
    widl_cid?: string;  // IPFS CID for WIDL file
    purchase_price?: number;  // Price to buy/download applet files
}

// Hook to read all applets from the contract
export function useApplets() {
    const { queryContract, isConnected, wallet } = useWeil();
    const [applets, setApplets] = useState<ContractApplet[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        // Require wallet connection to query (until public endpoint is available)
        if (!isConnected || !wallet || !REGISTRY_ADDRESS) {
            console.log("[Applets] Wallet not connected or no registry address");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const contractToQuery = REGISTRY_ADDRESS;

            console.log("[Applets] Querying get_all_applets from:", contractToQuery);

            // Query registry  
            const result = await queryContract(contractToQuery, "get_all_applets", {});

            console.log("[Applets] get_all_applets raw result:", result);
            console.log("[Applets] result type:", typeof result);
            console.log("[Applets] result is array:", Array.isArray(result));
            if (result) {
                console.log("[Applets] result.Ok:", result.Ok, "| type:", typeof result.Ok);
                console.log("[Applets] result.data:", result.data, "| type:", typeof result.data);
            }

            // Handle various response formats
            let appletList: any[] = [];

            if (Array.isArray(result)) {
                appletList = result;
            } else if (result?.Ok) {
                // Ok might contain array directly or as JSON string
                if (Array.isArray(result.Ok)) {
                    appletList = result.Ok;
                } else if (typeof result.Ok === 'string') {
                    try {
                        const parsed = JSON.parse(result.Ok);
                        appletList = Array.isArray(parsed) ? parsed : [];
                    } catch (e) {
                        console.error("[Applets] Failed to parse Ok string:", e);
                    }
                }
            } else if (result?.data) {
                if (Array.isArray(result.data)) {
                    appletList = result.data;
                } else if (typeof result.data === 'string') {
                    try {
                        const parsed = JSON.parse(result.data);
                        appletList = Array.isArray(parsed) ? parsed : [];
                    } catch (e) {
                        console.error("[Applets] Failed to parse data string:", e);
                    }
                }
            }

            console.log("[Applets] Parsed list:", appletList);

            const fetchedApplets: ContractApplet[] = appletList.map((applet, i) => ({
                token_id: String(applet.token_id ?? applet.id ?? i),
                name: applet.name || `Applet ${i}`,
                description: applet.description || "",
                applet_address: applet.applet_address || "",
                // Keep as raw Wei number/string for components to handle
                price: Number(applet.price) || 0,
                input_schema: applet.input_schema || "JSON",
                output_schema: applet.output_schema || "JSON",
                owner: applet.owner || "",
                wasm_cid: applet.wasm_cid,
                widl_cid: applet.widl_cid,
                // Keep as raw Wei
                purchase_price: Number(applet.purchase_price) || 0,
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
        if (isConnected && wallet && REGISTRY_ADDRESS) {
            refetch();
        }
    }, [isConnected, wallet, REGISTRY_ADDRESS, refetch]);

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

            // Validate transaction result before declaring success
            if (result?.Err || result?.error) {
                const errMsg = result.Err || result.error || 'Unknown error';
                throw new Error(`Registration failed: ${errMsg}`);
            }

            // Extract transaction hash if available
            if (result && result.transaction_id) {
                setTxHash(result.transaction_id);
            }

            // Only set success if we got a valid result (no error)
            setIsConfirming(true);

            // Brief delay to allow chain confirmation (WeilChain is fast)
            await new Promise(resolve => setTimeout(resolve, 500));

            setIsSuccess(true);
            console.log("Registration confirmed successfully");
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
