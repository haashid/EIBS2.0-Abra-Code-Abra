"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { WeilWalletConnection } from "@weilliptic/weil-sdk";

const SENTINEL_ENDPOINT = process.env.NEXT_PUBLIC_SENTINEL_ENDPOINT || "https://sentinel.unweil.me";
const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_WEIL_REGISTRY_ADDRESS || "";
const LOGGER_ADDRESS = process.env.NEXT_PUBLIC_WEIL_LOGGER_ADDRESS || "";

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

            if (!accounts || accounts.length === 0) {
                throw new Error("No accounts returned from WAuth");
            }

            // Success!
            setWallet(walletConnection);
            setAddress(accounts[0]);
            setIsConnected(true);

            console.log("Connected to WAuth:", accounts[0]);
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
        const result = await (wallet as any).contracts.execute(
            contractAddress,
            method,
            args
        );
        return result;
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
        const result = await (wallet as any).contracts.execute(
            contractAddress,
            method,
            args
        );
        return result;
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
        wallet,
    };

    return (
        <WeilContext.Provider value={value}>
            {children}
        </WeilContext.Provider>
    );
}
