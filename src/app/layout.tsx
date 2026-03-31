import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WeilProvider } from "@/context/WeilProvider";
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
    <html lang="en" className="scroll-smooth overflow-x-hidden">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body className={inter.className + " overflow-x-hidden"}>
        <WeilProvider>
          <MockDataProvider>
            {children}
          </MockDataProvider>
        </WeilProvider>
      </body>
    </html>
  );
}
