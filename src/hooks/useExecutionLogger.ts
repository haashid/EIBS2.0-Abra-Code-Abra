"use client";

import { useWeil } from "@/context/WeilProvider";
import { useState, useCallback } from "react";

const LOGGER_ADDRESS = process.env.NEXT_PUBLIC_WEIL_LOGGER_ADDRESS || "";

// Type for Execution
export interface ContractExecution {
    id: string;
    user: string;
    pipelineId: string;
    appletIds: number[];
    totalPrice: string;
    resultHash: string;
    timestamp: number;
}

// Hook to read executions for current user
export function useUserExecutions() {
    const { address, queryContract } = useWeil();
    const [executions, setExecutions] = useState<ContractExecution[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        if (!address || !LOGGER_ADDRESS) return;

        setIsLoading(true);
        setError(null);

        try {
            const result = await queryContract(
                LOGGER_ADDRESS,
                "get_executions_by_user",
                { user: address }
            );
            setExecutions(result || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [address, queryContract]);

    return {
        executions,
        isLoading,
        error,
        refetch,
    };
}

// Hook to log a new execution
export function useLogExecution() {
    const { executeContract, isConnected } = useWeil();
    const [isPending, setIsPending] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const logExecution = useCallback(async (
        appletIds: number[],
        totalPriceWei: bigint,
        resultData: any
    ) => {
        if (!isConnected || !LOGGER_ADDRESS) {
            throw new Error("Wallet not connected or logger address not set");
        }

        setIsPending(true);
        setIsSuccess(false);
        setError(null);

        try {
            // Create result hash from data
            const resultHash = btoa(JSON.stringify(resultData)).slice(0, 64);

            await executeContract(
                LOGGER_ADDRESS,
                "log_execution",
                {
                    applet_ids: appletIds,
                    total_price: totalPriceWei.toString(),
                    result_hash: resultHash
                }
            );

            setIsSuccess(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsPending(false);
        }
    }, [executeContract, isConnected]);

    return {
        logExecution,
        isPending,
        isConfirming: isPending,
        isSuccess,
        error,
    };
}
