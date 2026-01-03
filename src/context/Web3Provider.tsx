"use client";

import { WagmiProvider, createConfig, http } from "wagmi";
import { sepolia, localhost } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { injected } from "wagmi/connectors";
import { ReactNode } from "react";

const config = createConfig({
    chains: [localhost, sepolia],
    transports: {
        [localhost.id]: http(),
        [sepolia.id]: http(),
    },
    connectors: [injected()],
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </WagmiProvider>
    );
}
