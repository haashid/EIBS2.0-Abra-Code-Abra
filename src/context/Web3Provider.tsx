"use client";

import { WagmiProvider, createConfig, http } from "wagmi";
import { sepolia, mainnet, localhost } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { injected, walletConnect, coinbaseWallet } from "wagmi/connectors";
import { ReactNode } from "react";

// WalletConnect Project ID - Get yours at https://cloud.walletconnect.com
const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

// Determine which chains to support based on environment
const chains = process.env.NODE_ENV === "development"
    ? [localhost, sepolia] as const
    : [sepolia, mainnet] as const;

// Configure wagmi with multiple wallet options
const config = createConfig({
    chains,
    transports: {
        [localhost.id]: http(),
        [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC || "https://rpc.sepolia.org"),
        [mainnet.id]: http(),
    },
    connectors: [
        // MetaMask and browser wallets
        injected({
            shimDisconnect: true,
        }),
        // WalletConnect (only if project ID is provided)
        ...(WALLETCONNECT_PROJECT_ID ? [
            walletConnect({
                projectId: WALLETCONNECT_PROJECT_ID,
                showQrModal: true,
            }),
        ] : []),
        // Coinbase Wallet
        coinbaseWallet({
            appName: "WeilChain Nexus",
        }),
    ],
});

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Reduce unnecessary refetches
            staleTime: 1000 * 60 * 5, // 5 minutes
            refetchOnWindowFocus: false,
        },
    },
});

export function Web3Provider({ children }: { children: ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </WagmiProvider>
    );
}
