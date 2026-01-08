"use client";

import { useState, useCallback } from "react";
import { useWeil } from "@/context/WeilProvider";

// Applet type matching the contract structure
export interface WeilApplet {
    id: number;
    name: string;
    description: string;
    price: number;
    owner: string;
    input_schema: string;
    output_schema: string;
    is_active: boolean;
}

export function useWeilRegistry() {
    const { executeContract, queryContract, registryAddress, isConnected } = useWeil();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get all active applets
    const getApplets = useCallback(async (): Promise<WeilApplet[]> => {
        if (!registryAddress) {
            console.warn("Registry address not configured");
            return [];
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await queryContract(registryAddress, "get_applets", {});
            return result || [];
        } catch (err: any) {
            setError(err.message);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, [queryContract, registryAddress]);

    // Register a new applet
    const registerApplet = useCallback(async (
        name: string,
        description: string,
        price: number,
        inputSchema: string,
        outputSchema: string
    ): Promise<number | null> => {
        if (!isConnected || !registryAddress) {
            setError("Wallet not connected or registry not configured");
            return null;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await executeContract(registryAddress, "register_applet", {
                name,
                description,
                price,
                input_schema: inputSchema,
                output_schema: outputSchema,
            });
            return result;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [executeContract, registryAddress, isConnected]);

    // Get applet by ID
    const getAppletById = useCallback(async (id: number): Promise<WeilApplet | null> => {
        if (!registryAddress) {
            return null;
        }

        try {
            const result = await queryContract(registryAddress, "get_applet_by_id", { id });
            return result || null;
        } catch (err: any) {
            setError(err.message);
            return null;
        }
    }, [queryContract, registryAddress]);

    return {
        getApplets,
        registerApplet,
        getAppletById,
        isLoading,
        error,
    };
}
