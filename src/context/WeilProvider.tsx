"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { WeilWalletConnection } from "@weilliptic/weil-sdk";

const SENTINEL_ENDPOINT = process.env.NEXT_PUBLIC_SENTINEL_ENDPOINT || "https://sentinel.unweil.me";
const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_WEIL_REGISTRY_ADDRESS || "";
const LOGGER_ADDRESS = process.env.NEXT_PUBLIC_WEIL_LOGGER_ADDRESS || "";
const POD_ID = process.env.NEXT_PUBLIC_WEIL_POD_ID || "";

interface WeilContextType {
    isConnected: boolean;
    address: string | null;
    connect: () => Promise<void>;
    disconnect: () => void;
    isConnecting: boolean;
    error: string | null;
    executeContract: (address: string, method: string, args: any) => Promise<any>;
    queryContract: (address: string, method: string, args: any) => Promise<any>;
    registryAddress: string;
    loggerAddress: string;
    sentinelEndpoint: string;
    podId: string;
    wallet: WeilWalletConnection | null;
}

const WeilContext = createContext<WeilContextType | null>(null);

export function useWeil() {
    const context = useContext(WeilContext);
    if (!context) {
        throw new Error("useWeil must be used within a WeilProvider");
    }
    return context;
}

export function WeilProvider({ children }: { children: ReactNode }) {
    const [isConnected, setIsConnected] = useState(false);
    const [address, setAddress] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [wallet, setWallet] = useState<WeilWalletConnection | null>(null);

    const connect = useCallback(async () => {
        setIsConnecting(true);
        setError(null);

        try {
            // Check for window.WeilWallet (as shown in Discord)
            if (typeof window === "undefined") {
                throw new Error("Not in browser context");
            }

            const weilWallet = (window as any).WeilWallet;

            if (!weilWallet) {
                const keys = Object.keys(window).filter(k =>
                    k.toLowerCase().includes('weil') || k.toLowerCase().includes('wauth')
                );
                throw new Error(`WeilWallet not found. Found: ${keys.join(', ') || 'none'}`);
            }

            // Create wallet connection (as shown in Discord)
            const walletConnection = new WeilWalletConnection({
                walletProvider: weilWallet
            });

            // Request accounts using weil_requestAccounts (mentioned in Discord)
            const accounts = await weilWallet.request({ method: 'weil_requestAccounts' });
            console.log("[WAuth] Raw accounts response:", accounts, typeof accounts);

            // Try to extract address from different response formats
            let userAddress: string | null = null;
            if (Array.isArray(accounts) && accounts.length > 0) {
                userAddress = accounts[0];
            } else if (typeof accounts === 'string') {
                userAddress = accounts;
            } else if (accounts?.accounts && Array.isArray(accounts.accounts) && accounts.accounts.length > 0) {
                // WAuth returns {type: '...', accounts: [...], requestId: '...'}
                userAddress = accounts.accounts[0];
            } else if (accounts?.address) {
                userAddress = accounts.address;
            } else if (accounts?.result) {
                userAddress = Array.isArray(accounts.result) ? accounts.result[0] : accounts.result;
            }

            if (!userAddress) {
                console.warn("[WAuth] Could not extract address from:", accounts);
                // Continue anyway - wallet is connected but address unknown
            }

            // Success!
            setWallet(walletConnection);
            setAddress(userAddress);
            setIsConnected(true);

            console.log("Connected to WAuth:", userAddress);
        } catch (err: any) {
            // Handle various error formats
            let msg = "Failed to connect";
            if (err.message) {
                msg = err.message;
            } else if (typeof err === 'string') {
                msg = err;
            } else if (err.code) {
                msg = `Error code: ${err.code}`;
            } else {
                msg = `Connection failed: ${JSON.stringify(err)}`;
            }
            setError(msg);
            console.error("WAuth connection error:", msg, err);
        } finally {
            setIsConnecting(false);
        }
    }, []);

    const disconnect = useCallback(() => {
        setWallet(null);
        setAddress(null);
        setIsConnected(false);
        setError(null);
    }, []);

    // Execute contract method (as shown in Discord)
    const executeContract = useCallback(async (
        contractAddress: string,
        method: string,
        args: any
    ): Promise<any> => {
        if (!wallet || !isConnected) {
            throw new Error("Wallet not connected");
        }

        // wallet.contracts.execute(address, methodName, args)
        const response = await (wallet as any).contracts.execute(
            contractAddress,
            method,
            args
        );

        console.log("[WeilSDK] execute raw response:", response);

        // Extract actual result from SDK response wrapper
        if (response?.result !== undefined) return response.result;
        if (response?.data !== undefined) return response.data;
        if (response?.Ok !== undefined) return response.Ok;
        if (response?.value !== undefined) return response.value;
        return response;
    }, [wallet, isConnected]);

    const queryContract = useCallback(async (
        contractAddress: string,
        method: string,
        args: any
    ): Promise<any> => {
        if (!wallet) {
            throw new Error("Wallet not available");
        }

        // For queries, might need contracts.query or similar
        const response = await (wallet as any).contracts.execute(
            contractAddress,
            method,
            args
        );

        console.log("[WeilSDK] query raw response:", response);
        console.log("[WeilSDK] response keys:", response ? Object.keys(response) : 'null');

        // Log potential data fields
        if (response) {
            console.log("[WeilSDK] response.result:", response.result);
            console.log("[WeilSDK] response.data:", response.data);
            console.log("[WeilSDK] response.txn_result:", response.txn_result);
            console.log("[WeilSDK] response.payload:", response.payload);
            console.log("[WeilSDK] response.contracts:", response.contracts);
        }

        // Extract actual result from SDK response wrapper - try many fields
        if (response?.result !== undefined) return response.result;
        if (response?.data !== undefined) return response.data;
        if (response?.txn_result !== undefined) {
            // txn_result might be JSON string or object
            if (typeof response.txn_result === 'string') {
                try {
                    return JSON.parse(response.txn_result);
                } catch {
                    return response.txn_result;
                }
            }
            return response.txn_result;
        }
        if (response?.Ok !== undefined) return response.Ok;
        if (response?.value !== undefined) return response.value;
        if (response?.payload !== undefined) return response.payload;
        if (response?.contracts !== undefined) return response.contracts;
        return response;
    }, [wallet]);

    const value: WeilContextType = {
        isConnected,
        address,
        connect,
        disconnect,
        isConnecting,
        error,
        executeContract,
        queryContract,
        registryAddress: REGISTRY_ADDRESS,
        loggerAddress: LOGGER_ADDRESS,
        sentinelEndpoint: SENTINEL_ENDPOINT,
        podId: POD_ID,
        wallet,
    };

    return (
        <WeilContext.Provider value={value}>
            {children}
        </WeilContext.Provider>
    );
}
