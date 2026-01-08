"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

// Sentinel endpoint for WeilChain
const SENTINEL_ENDPOINT = process.env.NEXT_PUBLIC_SENTINEL_ENDPOINT || "https://sentinel.unweil.me";

// Contract addresses (set after deployment)
const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_WEIL_REGISTRY_ADDRESS || "";
const LOGGER_ADDRESS = process.env.NEXT_PUBLIC_WEIL_LOGGER_ADDRESS || "";

// Type for WAuth extension (browser injected)
interface WAuthExtension {
    isConnected: () => Promise<boolean>;
    getAccounts: () => Promise<string[]>;
    requestAccounts: () => Promise<string[]>;
    signTransaction: (txn: any) => Promise<string>;
    execute: (contractAddress: string, method: string, args: any) => Promise<any>;
    query: (contractAddress: string, method: string, args: any) => Promise<any>;
}

interface WeilContextType {
    isConnected: boolean;
    address: string | null;
    connect: () => Promise<void>;
    disconnect: () => void;
    isConnecting: boolean;
    error: string | null;
    // Contract execution helpers
    executeContract: (address: string, method: string, args: any) => Promise<any>;
    queryContract: (address: string, method: string, args: any) => Promise<any>;
    // Pre-configured contract addresses
    registryAddress: string;
    loggerAddress: string;
    sentinelEndpoint: string;
}

const WeilContext = createContext<WeilContextType | null>(null);

export function useWeil() {
    const context = useContext(WeilContext);
    if (!context) {
        throw new Error("useWeil must be used within a WeilProvider");
    }
    return context;
}

// Get WAuth extension from window
function getWAuth(): WAuthExtension | null {
    if (typeof window !== "undefined" && (window as any).wauth) {
        return (window as any).wauth as WAuthExtension;
    }
    return null;
}

export function WeilProvider({ children }: { children: ReactNode }) {
    const [isConnected, setIsConnected] = useState(false);
    const [address, setAddress] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Check for existing WAuth wallet connection on mount
    useEffect(() => {
        checkExistingConnection();
    }, []);

    const checkExistingConnection = async () => {
        try {
            const wauth = getWAuth();
            if (wauth) {
                const connected = await wauth.isConnected();
                if (connected) {
                    const accounts = await wauth.getAccounts();
                    if (accounts && accounts.length > 0) {
                        setAddress(accounts[0]);
                        setIsConnected(true);
                    }
                }
            }
        } catch (err) {
            console.log("No existing WAuth connection");
        }
    };

    const connect = useCallback(async () => {
        setIsConnecting(true);
        setError(null);

        try {
            const wauth = getWAuth();

            if (!wauth) {
                throw new Error("WAuth wallet extension not found. Please install it from the Chrome Web Store: https://chromewebstore.google.com/detail/wauth/nmdlcegenjnehamofkaaifhgjibdpdag");
            }

            // Request connection
            const accounts = await wauth.requestAccounts();

            if (!accounts || accounts.length === 0) {
                throw new Error("No accounts found. Please create or import an account in WAuth.");
            }

            setAddress(accounts[0]);
            setIsConnected(true);
        } catch (err: any) {
            setError(err.message || "Failed to connect wallet");
            console.error("WAuth connection error:", err);
        } finally {
            setIsConnecting(false);
        }
    }, []);

    const disconnect = useCallback(() => {
        setAddress(null);
        setIsConnected(false);
        setError(null);
    }, []);

    const executeContract = useCallback(async (
        contractAddress: string,
        method: string,
        args: any
    ): Promise<any> => {
        const wauth = getWAuth();
        if (!wauth || !isConnected) {
            throw new Error("Wallet not connected");
        }

        try {
            const result = await wauth.execute(contractAddress, method, args);
            return result;
        } catch (err: any) {
            throw new Error(`Contract execution failed: ${err.message}`);
        }
    }, [isConnected]);

    const queryContract = useCallback(async (
        contractAddress: string,
        method: string,
        args: any
    ): Promise<any> => {
        const wauth = getWAuth();
        if (!wauth) {
            throw new Error("WAuth not available");
        }

        try {
            const result = await wauth.query(contractAddress, method, args);
            return result;
        } catch (err: any) {
            throw new Error(`Contract query failed: ${err.message}`);
        }
    }, []);

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
    };

    return (
        <WeilContext.Provider value={value}>
            {children}
        </WeilContext.Provider>
    );
}
