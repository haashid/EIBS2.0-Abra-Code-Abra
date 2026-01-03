"use client";

import Navbar from "@/components/Navbar";
import Link from "next/link";

import IntroAnimation from "@/components/IntroAnimation";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30">
      <IntroAnimation />
      <Navbar />

      <main className="flex flex-col items-center justify-center pt-20 px-6 text-center">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-blue-500 blur-[100px] opacity-20 rounded-full animate-pulse" />
          <h1 className="relative text-6xl md:text-8xl font-bold tracking-tighter bg-gradient-to-br from-white via-gray-200 to-gray-500 bg-clip-text text-transparent mb-6">
            WeilChain Nexus
          </h1>
        </div>

        <p className="max-w-2xl text-xl text-gray-400 mb-12 leading-relaxed">
          The decentralized marketplace for AI applets. Discover, compose, and execute powerful modular workflows on the blockchain.
        </p>

        <div className="flex flex-wrap justify-center gap-6 mb-24">
          <Link href="/marketplace" className="group relative px-8 py-4 bg-white text-black rounded-lg font-bold text-lg hover:bg-gray-200 transition-colors overflow-hidden">
            <span className="relative z-10">Explore Marketplace</span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity" />
          </Link>
          <Link href="/pipeline" className="px-8 py-4 bg-gray-900 border border-gray-800 text-white rounded-lg font-bold text-lg hover:bg-gray-800 transition-colors">
            Build Pipeline
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full text-left">
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
    <div className="p-8 rounded-2xl bg-gray-900/50 border border-gray-800 hover:border-gray-700 transition-colors">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
      <p className="text-gray-400">{desc}</p>
    </div>
  );
}
