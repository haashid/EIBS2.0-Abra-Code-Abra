"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { parseEther, formatEther } from "viem";

// Types
export interface Applet {
    id: number;
    name: string;
    description: string;
    price: string; // Stored as string to avoid serialization issues, converted when needed
    inputSchema: string;
    outputSchema: string;
    owner: string;
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
    registerApplet: (name: string, description: string, price: string) => void;
    logExecution: (appletIds: number[], totalPrice: string, result: any) => void;
}

const MockDataContext = createContext<MockDataContextType | undefined>(undefined);

// Initial Mock Data
const INITIAL_APPLETS: Applet[] = [
    { id: 1, name: "Sentiment Analysis", description: "Analyzes text sentiment", price: "0.05", inputSchema: "Text", outputSchema: "JSON", owner: "0x123..." },
    { id: 2, name: "Image Resizer", description: "Resizes images", price: "0.01", inputSchema: "Image", outputSchema: "Image", owner: "0xABC..." },
    { id: 3, name: "Data Cleaner", description: "Cleans CSV data", price: "0.02", inputSchema: "CSV", outputSchema: "CSV", owner: "0x456..." },
    { id: 4, name: "Translator", description: "Translates text", price: "0.03", inputSchema: "Text", outputSchema: "Text", owner: "0x789..." },
    { id: 5, name: "AI Summarizer", description: "Summarizes long text", price: "0.08", inputSchema: "Text", outputSchema: "Text", owner: "0xDEF..." },
];

const INITIAL_EXECUTIONS: ExecutionLog[] = [
    { id: 101, pipelineId: "0x8f...2a", appletIds: [1, 3], totalPrice: "0.07", timestamp: Math.floor(Date.now() / 1000) - 3600, status: 'Success' },
    { id: 102, pipelineId: "0x3b...9c", appletIds: [2, 2, 4], totalPrice: "0.025", timestamp: Math.floor(Date.now() / 1000) - 86400, status: 'Success' },
];

export function MockDataProvider({ children }: { children: React.ReactNode }) {
    const [applets, setApplets] = useState<Applet[]>(INITIAL_APPLETS);
    const [executions, setExecutions] = useState<ExecutionLog[]>(INITIAL_EXECUTIONS);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load from LocalStorage on mount
    useEffect(() => {
        const savedApplets = localStorage.getItem("weilchain_applets");
        const savedExecutions = localStorage.getItem("weilchain_executions");

        if (savedApplets) setApplets(JSON.parse(savedApplets));
        if (savedExecutions) setExecutions(JSON.parse(savedExecutions));
        setIsInitialized(true);
    }, []);

    // Save to LocalStorage whenever state changes
    useEffect(() => {
        if (!isInitialized) return;
        localStorage.setItem("weilchain_applets", JSON.stringify(applets));
        localStorage.setItem("weilchain_executions", JSON.stringify(executions));
    }, [applets, executions, isInitialized]);

    const registerApplet = (name: string, description: string, price: string) => {
        const newApplet: Applet = {
            id: applets.length + 1,
            name,
            description,
            price,
            inputSchema: "Unknown",
            outputSchema: "Unknown",
            owner: "0xUser...", // Mock owner
        };
        setApplets([...applets, newApplet]);
    };

    const logExecution = (appletIds: number[], totalPrice: string, result: any) => {
        const newExecution: ExecutionLog = {
            id: executions.length + 100 + 1, // Simple ID generation
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
