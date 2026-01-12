"use client";

import { useWeil } from "@/context/WeilProvider";
import { useState, useCallback, useEffect } from "react";

const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_WEIL_TOKEN_ADDRESS || "";
const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_WEIL_MARKETPLACE_ADDRESS || "";

// Execution result from marketplace
export interface ExecutionResult {
    success: boolean;
    output: string;
    tokens_spent: number;
}

// Hook to get token balance
export function useTokenBalance() {
    const { queryContract, isConnected, wallet, address } = useWeil();
    const [balance, setBalance] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(false);

    const refetch = useCallback(async () => {
        if (!isConnected || !wallet || !TOKEN_ADDRESS || !address) {
            return;
        }

        setIsLoading(true);
        try {
            const result = await queryContract(
                TOKEN_ADDRESS,
                "balance_for",
                { addr: address }
            );
            setBalance(result || 0);
        } catch (err) {
            console.error("Failed to fetch balance:", err);
        } finally {
            setIsLoading(false);
        }
    }, [queryContract, isConnected, wallet, address]);

    useEffect(() => {
        if (isConnected && wallet) {
            refetch();
        }
    }, [isConnected, wallet, refetch]);

    return { balance, isLoading, refetch };
}

// Hook to approve tokens for marketplace spending
export function useApproveTokens() {
    const { wallet, isConnected } = useWeil();
    const [isPending, setIsPending] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const approve = useCallback(async (amount: number) => {
        if (!isConnected || !wallet || !TOKEN_ADDRESS || !MARKETPLACE_ADDRESS) {
            throw new Error("Not connected or addresses not configured");
        }

        setIsPending(true);
        setError(null);

        try {
            await wallet.contracts.execute(
                TOKEN_ADDRESS,
                "approve",
                {
                    spender: MARKETPLACE_ADDRESS,
                    amount: amount
                }
            );
            setIsSuccess(true);
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setIsPending(false);
        }
    }, [wallet, isConnected]);

    return { approve, isPending, isSuccess, error };
}

// Hook to execute an applet through the marketplace
export function useExecuteApplet() {
    const { wallet, isConnected } = useWeil();
    const [isExecuting, setIsExecuting] = useState(false);
    const [result, setResult] = useState<ExecutionResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const executeApplet = useCallback(async (
        appletId: string,
        input: string
    ): Promise<ExecutionResult> => {
        if (!isConnected || !wallet || !MARKETPLACE_ADDRESS) {
            throw new Error("Not connected or marketplace not configured");
        }

        setIsExecuting(true);
        setError(null);
        setResult(null);

        try {
            const execResult = await wallet.contracts.execute(
                MARKETPLACE_ADDRESS,
                "execute_applet",
                {
                    applet_id: appletId,
                    input: input
                }
            );

            const executionResult: ExecutionResult = {
                success: execResult?.success ?? true,
                output: execResult?.output ?? JSON.stringify(execResult),
                tokens_spent: execResult?.tokens_spent ?? 0
            };

            setResult(executionResult);
            return executionResult;
        } catch (err: any) {
            const errorMsg = err.message || JSON.stringify(err);
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setIsExecuting(false);
        }
    }, [wallet, isConnected]);

    return { executeApplet, isExecuting, result, error };
}

// Hook to execute a pipeline of applets
export function useExecutePipeline() {
    const { wallet, isConnected } = useWeil();
    const [isExecuting, setIsExecuting] = useState(false);
    const [result, setResult] = useState<ExecutionResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const executePipeline = useCallback(async (
        appletIds: string[],
        initialInput: string
    ): Promise<ExecutionResult> => {
        if (!isConnected || !wallet || !MARKETPLACE_ADDRESS) {
            throw new Error("Not connected or marketplace not configured");
        }

        setIsExecuting(true);
        setError(null);
        setResult(null);

        try {
            const execResult = await wallet.contracts.execute(
                MARKETPLACE_ADDRESS,
                "execute_pipeline",
                {
                    applet_ids: appletIds,
                    initial_input: initialInput
                }
            );

            const executionResult: ExecutionResult = {
                success: execResult?.success ?? true,
                output: execResult?.output ?? JSON.stringify(execResult),
                tokens_spent: execResult?.tokens_spent ?? 0
            };

            setResult(executionResult);
            return executionResult;
        } catch (err: any) {
            const errorMsg = err.message || JSON.stringify(err);
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setIsExecuting(false);
        }
    }, [wallet, isConnected]);

    return { executePipeline, isExecuting, result, error };
}
