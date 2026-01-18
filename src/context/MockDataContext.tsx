"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Types
export interface Applet {
    id: number;
    name: string;
    description: string;
    price: string; // in ETH/tokens
    owner: string;
    inputSchema: string;
    outputSchema: string;
    contractAddress?: string; // On-chain contract address
}

export interface ExecutionLog {
    id: number;
    pipelineId: string;
    appletIds: number[];
    totalPrice: string;
    timestamp: number;
    status: "Success" | "Failed";
    result?: any;
}

interface MockDataContextType {
    applets: Applet[];
    executions: ExecutionLog[];
    registerApplet: (name: string, description: string, price: string, inputSchema: string, outputSchema: string) => void;
    logExecution: (appletIds: number[], totalPrice: string, result: any) => void;
}

const MockDataContext = createContext<MockDataContextType | undefined>(undefined);

// Initial Mock Data - Real Working Applets
// All applets now come from real AppletRegistry contract, so this array is cleared.
const INITIAL_APPLETS: Applet[] = [];

const INITIAL_EXECUTIONS: ExecutionLog[] = [
    { id: 101, pipelineId: "0x8f...2a", appletIds: [1, 3], totalPrice: "0.015", timestamp: Math.floor(Date.now() / 1000) - 3600, status: 'Success' },
    { id: 102, pipelineId: "0x3b...9c", appletIds: [2, 4], totalPrice: "0.035", timestamp: Math.floor(Date.now() / 1000) - 86400, status: 'Success' },
];

export function MockDataProvider({ children }: { children: React.ReactNode }) {
    // Keep execution logs for history, but remove mock applets
    // All applets now come from real AppletRegistry contract
    const [applets, setApplets] = useState<Applet[]>(INITIAL_APPLETS);
    const [executions, setExecutions] = useState<ExecutionLog[]>(INITIAL_EXECUTIONS);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load from LocalStorage on mount
    useEffect(() => {
        const savedApplets = localStorage.getItem("weilchain_applets_v2");
        const savedExecutions = localStorage.getItem("weilchain_executions_v2");

        if (savedApplets) setApplets(JSON.parse(savedApplets));
        if (savedExecutions) setExecutions(JSON.parse(savedExecutions));
        setIsInitialized(true);
    }, []);

    // Save to LocalStorage whenever state changes
    useEffect(() => {
        if (!isInitialized) return;
        localStorage.setItem("weilchain_applets_v2", JSON.stringify(applets));
        localStorage.setItem("weilchain_executions_v2", JSON.stringify(executions));
    }, [applets, executions, isInitialized]);

    const registerApplet = (name: string, description: string, price: string, inputSchema: string, outputSchema: string) => {
        const maxId = applets.length > 0 ? Math.max(...applets.map(a => a.id)) : 0;
        const newApplet: Applet = {
            id: maxId + 1,
            name,
            description,
            price,
            inputSchema: inputSchema || "JSON",
            outputSchema: outputSchema || "JSON",
            owner: "0xUser...", // Mock owner
        };
        setApplets([...applets, newApplet]);
    };

    const logExecution = (appletIds: number[], totalPrice: string, result: any) => {
        const newExecution: ExecutionLog = {
            id: executions.length + 100 + 1,
            pipelineId: `0x${Math.random().toString(16).slice(2, 10)}...`,
            appletIds,
            totalPrice,
            timestamp: Math.floor(Date.now() / 1000),
            status: "Success",
            result
        };
        setExecutions([newExecution, ...executions]);
    };

    return (
        <MockDataContext.Provider value={{ applets, executions, registerApplet, logExecution }}>
            {children}
        </MockDataContext.Provider>
    );
}

export function useMockData() {
    const context = useContext(MockDataContext);
    if (context === undefined) {
        throw new Error("useMockData must be used within a MockDataProvider");
    }
    return context;
}
