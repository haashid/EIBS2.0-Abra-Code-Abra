import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/context/Web3Provider";
import { MockDataProvider } from "@/context/MockDataContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WeilChain Nexus",
  description: "Decentralized Applet Marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Web3Provider>
          <MockDataProvider>
            {children}
          </MockDataProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
