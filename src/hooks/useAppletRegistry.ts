"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, keccak256, toBytes } from "viem";
import AppletRegistryABI from "@/abis/AppletRegistry.json";

const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as `0x${string}` || "0x0000000000000000000000000000000000000000";

// Type for Applet from contract
export interface ContractApplet {
    id: bigint;
    name: string;
    description: string;
    price: bigint;
    owner: string;
    inputSchemaHash: string;
    outputSchemaHash: string;
    isActive: boolean;
}

// Hook to read all applets from the contract
export function useApplets() {
    const { data, isLoading, error, refetch } = useReadContract({
        address: REGISTRY_ADDRESS,
        abi: AppletRegistryABI,
        functionName: "getApplets",
    });

    return {
        applets: (data as ContractApplet[] | undefined) || [],
        isLoading,
        error,
        refetch,
    };
}

// Hook to register a new applet
export function useRegisterApplet() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const registerApplet = async (
        name: string,
        description: string,
        priceInEther: string,
        inputSchema: string,
        outputSchema: string
    ) => {
        const priceWei = parseEther(priceInEther);
        const inputHash = keccak256(toBytes(inputSchema));
        const outputHash = keccak256(toBytes(outputSchema));

        writeContract({
            address: REGISTRY_ADDRESS,
            abi: AppletRegistryABI,
            functionName: "registerApplet",
            args: [name, description, priceWei, inputHash, outputHash],
        });
    };

    return {
        registerApplet,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    };
}
