"use client";

import Navbar from "@/components/Navbar";
import Link from "next/link";
import IntroAnimation from "@/components/IntroAnimation";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30 overflow-x-hidden">
      <IntroAnimation />
      <Navbar />

      <main className="flex flex-col items-center justify-center pt-12 sm:pt-20 px-4 sm:px-6 text-center">
        {/* Hero Section */}
        <div className="relative mb-6 sm:mb-8 w-full max-w-4xl">
          <div className="absolute inset-0 bg-blue-500 blur-[100px] opacity-20 rounded-full animate-pulse" />
          <h1 className="relative text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter bg-gradient-to-br from-white via-gray-200 to-gray-500 bg-clip-text text-transparent mb-4 sm:mb-6 leading-tight">
            WeilChain Nexus
          </h1>
        </div>

        <p className="max-w-xl sm:max-w-2xl text-sm sm:text-base md:text-xl text-gray-400 mb-8 sm:mb-12 leading-relaxed px-2">
          The decentralized marketplace for AI applets. Discover, compose, and execute powerful modular workflows on the blockchain.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-16 sm:mb-24 w-full max-w-md sm:max-w-none px-4">
          <Link
            href="/marketplace"
            className="group relative px-6 sm:px-8 py-3 sm:py-4 bg-white text-black rounded-lg font-bold text-base sm:text-lg hover:bg-gray-200 transition-colors overflow-hidden text-center"
          >
            <span className="relative z-10">Explore Marketplace</span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity" />
          </Link>
          <Link
            href="/pipeline"
            className="px-6 sm:px-8 py-3 sm:py-4 bg-gray-900 border border-gray-800 text-white rounded-lg font-bold text-base sm:text-lg hover:bg-gray-800 transition-colors text-center"
          >
            Build Pipeline
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-6xl w-full text-left px-4 pb-12">
          <FeatureCard
            title="Decentralized Registry"
            desc="Censorship-resistant applet discovery powered by smart contracts."
            icon="🌐"
          />
          <FeatureCard
            title="Composable Workflows"
            desc="Chain typically incompatible tools into seamless automated pipelines."
            icon="⚡"
          />
          <FeatureCard
            title="Verifiable Execution"
            desc="Full history and cryptographic proof of every execution on-chain."
            icon="🔒"
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ title, desc, icon }: { title: string, desc: string, icon: string }) {
  return (
    <div className="p-5 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl bg-gray-900/50 border border-gray-800 hover:border-gray-700 transition-colors">
      <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{icon}</div>
      <h3 className="text-lg sm:text-xl font-bold mb-2 text-white">{title}</h3>
      <p className="text-gray-400 text-sm sm:text-base">{desc}</p>
    </div>
  );
}
