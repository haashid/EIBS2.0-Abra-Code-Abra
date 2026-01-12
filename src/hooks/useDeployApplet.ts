"use client";

import { useWeil } from "@/context/WeilProvider";
import { useState, useCallback } from "react";

const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_WEIL_REGISTRY_ADDRESS || "";

export interface DeploymentResult {
    contractAddress: string;
    transactionId: string;
}

/**
 * Hook to deploy WASM applets via backend API
 * Uses Next.js API route that calls wadk CLI for real deployment
 */
export function useDeployApplet() {
    const { wallet, isConnected, address } = useWeil();
    const [isDeploying, setIsDeploying] = useState(false);
    const [deploymentProgress, setDeploymentProgress] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<DeploymentResult | null>(null);

    const deployAndRegister = useCallback(async (
        wasmFile: File,
        widlFile: File | null,
        metadata: {
            name: string;
            description: string;
            price: string;
            inputSchema: string;
            outputSchema: string;
        }
    ): Promise<DeploymentResult | null> => {
        if (!isConnected) {
            setError("Wallet not connected");
            return null;
        }

        setIsDeploying(true);
        setError(null);
        setResult(null);

        try {
            // Step 1: Deploy via backend API
            setDeploymentProgress("Uploading WASM to server...");

            const formData = new FormData();
            formData.append('wasm', wasmFile);
            if (widlFile) {
                formData.append('widl', widlFile);
            }
            formData.append('name', metadata.name);
            formData.append('description', metadata.description);

            setDeploymentProgress("Deploying to WeilChain via wadk...");

            const response = await fetch('/api/deploy', {
                method: 'POST',
                body: formData
            });

            const deployResult = await response.json();

            if (!response.ok) {
                throw new Error(deployResult.error || deployResult.details || 'Deployment failed');
            }

            const contractAddress = deployResult.contractAddress;
            const transactionId = deployResult.transactionId || `tx_${Date.now()}`;

            if (!contractAddress) {
                // Show warning but don't fail - deployment might have partially succeeded
                console.warn("Deployment response:", deployResult);
                throw new Error(deployResult.warning || "No contract address returned");
            }

            // Step 2: Register in on-chain Registry
            setDeploymentProgress("Registering on blockchain...");

            if (REGISTRY_ADDRESS && wallet && (wallet as any).contracts?.execute) {
                try {
                    const priceUint = Math.floor(parseFloat(metadata.price) * 1e18);

                    await (wallet as any).contracts.execute(
                        REGISTRY_ADDRESS,
                        "register_applet",
                        {
                            name: metadata.name,
                            description: metadata.description,
                            price: priceUint,
                            applet_address: contractAddress,
                            input_schema: metadata.inputSchema,
                            output_schema: metadata.outputSchema
                        }
                    );
                    setDeploymentProgress("Registered on-chain!");
                } catch (regError: any) {
                    console.warn("On-chain registration failed:", regError.message);
                    // Continue - deployment succeeded even if registration failed
                }
            }

            setDeploymentProgress("Done!");

            const deploymentResult: DeploymentResult = {
                contractAddress,
                transactionId
            };

            setResult(deploymentResult);
            return deploymentResult;

        } catch (err: any) {
            const msg = err.message || JSON.stringify(err);
            setError(msg);
            console.error("Deployment failed:", err);
            return null;
        } finally {
            setIsDeploying(false);
        }
    }, [isConnected, wallet, address]);

    return {
        deployAndRegister,
        isDeploying,
        deploymentProgress,
        error,
        result
    };
}
