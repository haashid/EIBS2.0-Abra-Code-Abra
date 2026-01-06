import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/context/Web3Provider";
import { MockDataProvider } from "@/context/MockDataContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WeilChain Nexus",
  description: "Decentralized Applet Marketplace",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
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
