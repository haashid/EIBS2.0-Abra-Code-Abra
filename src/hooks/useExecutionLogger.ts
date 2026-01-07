"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { keccak256, toBytes } from "viem";
import ExecutionLoggerABI from "@/abis/ExecutionLogger.json";

const EXECUTION_ADDRESS = process.env.NEXT_PUBLIC_EXECUTION_ADDRESS as `0x${string}` || "0x0000000000000000000000000000000000000000";

// Type for Execution from contract
export interface ContractExecution {
    id: bigint;
    user: string;
    pipelineId: string;
    appletIds: bigint[];
    totalPrice: bigint;
    resultHash: string;
    timestamp: bigint;
}

// Hook to read executions for current user
export function useUserExecutions() {
    const { address } = useAccount();

    const { data, isLoading, error, refetch } = useReadContract({
        address: EXECUTION_ADDRESS,
        abi: ExecutionLoggerABI,
        functionName: "getExecutionsByUser",
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
        },
    });

    return {
        executions: (data as ContractExecution[] | undefined) || [],
        isLoading,
        error,
        refetch,
    };
}

// Hook to log a new execution
export function useLogExecution() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const logExecution = async (
        appletIds: number[],
        totalPriceWei: bigint,
        resultData: any
    ) => {
        // Create pipeline ID from applet IDs
        const pipelineId = keccak256(toBytes(appletIds.join("-")));

        // Hash the result data
        const resultHash = keccak256(toBytes(JSON.stringify(resultData)));

        writeContract({
            address: EXECUTION_ADDRESS,
            abi: ExecutionLoggerABI,
            functionName: "logExecution",
            args: [pipelineId, appletIds.map(BigInt), totalPriceWei, resultHash],
        });
    };

    return {
        logExecution,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    };
}
