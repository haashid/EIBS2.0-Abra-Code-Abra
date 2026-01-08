"use client";

import { useState, useCallback } from "react";
import { useWeil } from "@/context/WeilProvider";

// Execution type matching the contract structure
export interface WeilExecution {
    id: number;
    user: string;
    applet_ids: number[];
    total_price: number;
    result_hash: string;
    timestamp: number;
}

export function useWeilLogger() {
    const { executeContract, queryContract, loggerAddress, isConnected, address } = useWeil();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get executions for current user
    const getMyExecutions = useCallback(async (): Promise<WeilExecution[]> => {
        if (!loggerAddress || !address) {
            return [];
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await queryContract(loggerAddress, "get_executions_by_user", {
                user: address,
            });
            return result || [];
        } catch (err: any) {
            setError(err.message);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, [queryContract, loggerAddress, address]);

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
            const result = await executeContract(loggerAddress, "log_execution", {
                applet_ids: appletIds,
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
            const result = await queryContract(loggerAddress, "get_execution_by_id", { id });
            return result || null;
        } catch (err: any) {
            setError(err.message);
            return null;
        }
    }, [queryContract, loggerAddress]);

    return {
        getMyExecutions,
        logExecution,
        getExecutionById,
        isLoading,
        error,
    };
}
