"use client";

import { useState, useCallback } from "react";
import { useWeil } from "@/context/WeilProvider";

// Execution type matching the contract structure
export interface WeilExecution {
    id: number;
    user: string;
    applet_ids_json: string;
    total_price: number;
    result_hash: string;
    timestamp: number;
}

export function useWeilLogger() {
    const { executeContract, queryContract, loggerAddress, isConnected, address } = useWeil();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get execution count for current user
    const getMyExecutionCount = useCallback(async (): Promise<number> => {
        if (!loggerAddress || !address) {
            return 0;
        }

        try {
            const result = await queryContract(loggerAddress, "get_user_execution_count", {
                user: address,
            });
            return result || 0;
        } catch (err: any) {
            console.error("Failed to get execution count:", err);
            return 0;
        }
    }, [queryContract, loggerAddress, address]);

    // Get total execution count
    const getTotalExecutionCount = useCallback(async (): Promise<number> => {
        if (!loggerAddress) {
            return 0;
        }

        try {
            const result = await queryContract(loggerAddress, "get_execution_count", {});
            return result || 0;
        } catch (err: any) {
            console.error("Failed to get total execution count:", err);
            return 0;
        }
    }, [queryContract, loggerAddress]);

    // Log a new execution
    const logExecution = useCallback(async (
        appletIds: number[],
        totalPrice: number,
        resultHash: string
    ): Promise<number | null> => {
        if (!isConnected || !loggerAddress) {
            setError("Wallet not connected or logger not configured");
            return null;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Convert applet IDs array to JSON string as contract expects
            const appletIdsJson = JSON.stringify(appletIds);

            const result = await executeContract(loggerAddress, "log_execution", {
                applet_ids_json: appletIdsJson,
                total_price: totalPrice,
                result_hash: resultHash,
            });
            return result;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [executeContract, loggerAddress, isConnected]);

    // Get execution by ID
    const getExecutionById = useCallback(async (id: number): Promise<WeilExecution | null> => {
        if (!loggerAddress) {
            return null;
        }

        try {
            const result = await queryContract(loggerAddress, "get_execution", { id });
            return result || null;
        } catch (err: any) {
            setError(err.message);
            return null;
        }
    }, [queryContract, loggerAddress]);

    // Get execution count for specific applet
    const getAppletExecutionCount = useCallback(async (appletId: number): Promise<number> => {
        if (!loggerAddress) {
            return 0;
        }

        try {
            // Try querying specific applet stats (if supported by contract)
            const result = await queryContract(loggerAddress, "get_applet_execution_count", {
                applet_id: appletId
            });
            return Number(result) || 0;
        } catch (err: any) {
            // Fallback: This method might not exist on all contract versions
            console.warn(`Failed to get applet execution count for #${appletId}:`, err.message);
            return 0;
        }
    }, [queryContract, loggerAddress]);

    return {
        getMyExecutionCount,
        getTotalExecutionCount,
        getAppletExecutionCount,
        logExecution,
        getExecutionById,
        isLoading,
        error,
    };
}
