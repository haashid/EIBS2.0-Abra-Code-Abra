"use client";

import { useRef, useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";
import Link from "next/link"; // Added missing import

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className={`min-h-screen flex flex-col justify-center relative overscroll-none ${className}`}>
      <span
        style={{
          transform: isInView ? "none" : "translateY(50px)",
          opacity: isInView ? 1 : 0,
          transition: "all 0.9s cubic-bezier(0.17, 0.55, 0.55, 1) 0.2s"
        }}
      >
        {children}
      </span>
    </section>
  );
}

export default function Home() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Parallax configs
  const yHero = useTransform(scrollYProgress, [0, 0.2], [0, -100]);
  const yFeatures = useTransform(scrollYProgress, [0.1, 0.4], [100, 0]);

  return (
    <div className="bg-black text-white selection:bg-cyan-500/30 font-sans overflow-x-hidden relative">
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 origin-left z-50"
        style={{ scaleX }}
      />

      <Navbar />

      {/* HERO SECTION */}
      <header className="relative h-screen flex items-center justify-center overflow-hidden bg-[#0a0a0a]">
        {/* Advanced Dynamic Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Deep Space Base */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1a1a2e_0%,_#000000_100%)]" />

          {/* Active Mesh Grid */}
          <div className="absolute inset-0 opacity-30 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_70%,transparent_100%)]" />

          {/* Moving Light Orbs */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
              x: [0, 50, 0],
              y: [0, -30, 0]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen"
          />
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.4, 0.2],
              x: [0, -50, 0]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[150px] mix-blend-screen"
          />
        </div>

        <motion.div
          style={{ y: yHero }}
          className="relative z-10 text-center px-4 max-w-6xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 py-2 px-6 rounded-full bg-white/5 border border-white/10 text-cyan-400 text-sm font-bold tracking-widest uppercase backdrop-blur-xl shadow-[0_0_30px_rgba(34,211,238,0.15)] ring-1 ring-white/20">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse box-shadow-[0_0_10px_cyan]" />
              Web3 Infrastructure 2.0
            </div>
          </motion.div>

          <h1 className="text-7xl sm:text-8xl md:text-9xl font-black tracking-tighter mb-8 text-white relative z-10 drop-shadow-[0_0_50px_rgba(255,255,255,0.2)]">
            WeilChain <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-600">Nexus</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-12 font-light drop-shadow-md">
            The verifiable layer for the new web. <br />
            <span className="text-white font-semibold glow-text">Deploy once. Prove forever.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link href="/marketplace" className="group relative px-10 py-5 bg-white text-black text-lg font-bold rounded-full overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_60px_rgba(255,255,255,0.4)]">
              <span className="relative z-10 flex items-center gap-2">
                Enter Marketplace
                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-200 via-white to-blue-200 opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
            </Link>
            <a href="https://docs.weilliptic.network" target="_blank" className="px-10 py-5 bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 hover:border-white/30 text-white font-bold rounded-full transition-all shadow-lg hover:shadow-cyan-500/10">
              Read the Docs
            </a>
          </div>
        </motion.div>

        {/* Cinematic Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-3"
        >
          <span className="text-[10px] tracking-[0.3em] uppercase text-gray-500">Explore</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-gray-500/50 to-transparent" />
        </motion.div>
      </header>

      {/* TRUST INDICATORS (Replaces Fake Stats) */}
      <Section className="bg-[#050505] py-32 border-y border-white/5 relative overflow-hidden group">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#1a202c_0%,_#000000_60%)] opacity-40" />

        {/* Animated Background Mesh */}
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,rgba(255,255,255,0.03)_25%,transparent_25%,transparent_75%,rgba(255,255,255,0.03)_75%,rgba(255,255,255,0.03)),linear-gradient(45deg,rgba(255,255,255,0.03)_25%,transparent_25%,transparent_75%,rgba(255,255,255,0.03)_75%,rgba(255,255,255,0.03))] bg-[size:20px_20px]" />

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-200 via-white to-gray-400">Institutional Grade Infrastructure</h2>
            <p className="text-gray-500 text-sm font-bold tracking-widest uppercase">The Foundation of the Next Web</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { title: 'SECURE', icon: (props: any) => <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" {...props} />, desc: "Audited & Proven" },
              { title: 'VERIFIABLE', icon: (props: any) => <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" {...props} />, desc: "On-Chain Proofs" },
              { title: 'SCALABLE', icon: (props: any) => <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" {...props} />, desc: "Infinite Throughput" },
              { title: 'DECENTRALIZED', icon: (props: any) => <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" {...props} />, desc: "Community Owned" }
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className="relative group p-8 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-cyan-500/30 transition-all duration-300 backdrop-blur-sm"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />

                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-12 h-12 mb-4 rounded-xl bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:border-cyan-500/50 transition-all shadow-lg group-hover:shadow-cyan-500/20">
                    <svg className="w-6 h-6 text-gray-400 group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {item.icon({})}
                    </svg>
                  </div>
                  <span className="text-lg font-bold text-white mb-1 tracking-tight">{item.title}</span>
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-medium group-hover:text-cyan-400/80 transition-colors">{item.desc}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* VALUE PROPOSITION: App Store for Web3 */}
      <Section className="py-32 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[#08080a]" />
        <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-blue-900/10 to-transparent" />
        <div className="absolute -left-[10%] top-[20%] w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[100px]" />

        <motion.div style={{ y: yFeatures }} className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-16 relative z-10">
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 text-cyan-500 font-bold tracking-widest uppercase text-xs">
              <span className="w-8 h-[1px] bg-cyan-500" />
              Core Architecture
            </div>
            <h2 className="text-4xl md:text-6xl font-bold leading-tight text-white">
              The App Store for <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Decentralized Logic.</span>
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed">
              Stop rewriting the same standardized code. In WeilChain Nexus, every piece of logic is an **Applet**—verifiable, monetizable, and ready to snap into your application like a LEGO block.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/30 hover:bg-white/10 transition-all backdrop-blur-sm group">
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4 text-blue-400 group-hover:text-blue-300 group-hover:scale-110 transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">Instant Monetization</h3>
                <p className="text-sm text-gray-400">Publish your algorithm once. Get paid in YTK every time someone executes it.</p>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/30 hover:bg-white/10 transition-all backdrop-blur-sm group">
                <div className="w-12 h-12 bg-cyan-500/10 rounded-lg flex items-center justify-center mb-4 text-cyan-400 group-hover:text-cyan-300 group-hover:scale-110 transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">Cryptographic Verification</h3>
                <p className="text-sm text-gray-400">Every output is signed and proven. Your users verify the result, not your brand.</p>
              </div>
            </div>
          </div>

          {/* Visual: Isometric Code Blocks or similar */}
          <div className="flex-1 relative perspective-1000">
            <div className="relative z-10 grid gap-4 grid-cols-2 rotate-[-5deg] scale-90 md:scale-100 transform-style-3d">
              {[1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.05, translateZ: 20 }}
                  className="h-40 bg-gradient-to-br from-[#1a1a2e] to-black rounded-2xl border border-white/10 backdrop-blur-xl flex flex-col justify-between p-5 shadow-2xl group hover:border-cyan-500/20 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="w-8 h-8 rounded bg-white/5 group-hover:bg-cyan-500/20 transition-colors" />
                    <div className="px-2 py-1 bg-cyan-900/20 text-cyan-400 text-[10px] font-bold rounded border border-cyan-500/20">VERIFIED</div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 w-3/4 bg-white/5 rounded group-hover:bg-cyan-500/20 transition-colors" />
                    <div className="h-2 w-1/2 bg-white/5 rounded" />
                  </div>
                </motion.div>
              ))}
            </div>
            {/* Glow behind blocks */}
            <div className="absolute inset-0 bg-blue-500/20 blur-[100px] -z-10 animate-pulse-slow" />
          </div>
        </motion.div>
      </Section>

      {/* FEATURE: The Pipeline */}
      <Section className="py-32 relative border-t border-white/5 bg-[#030305] overflow-hidden">
        {/* Subtle Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />

        <div className="max-w-7xl mx-auto px-4 text-center mb-20 relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Build Complex Pipelines <br /> <span className="text-gray-500">Without Managing Servers.</span></h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Combine multiple Applets into a seamless workflow. Output from one becomes the input for the next. Fully on-chain.</p>
        </div>

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="relative bg-[#0a0a0c]/80 border border-white/10 rounded-2xl p-8 md:p-12 overflow-hidden backdrop-blur-xl shadow-2xl">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent -translate-y-1/2 border-t border-dashed border-gray-700" />

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
              {[
                { title: "Raw Data", icon: "📁" },
                { title: "AI Summarizer", icon: "🤖", active: true },
                { title: "Proof Gen", icon: "🔐", active: true },
                { title: "Verified Result", icon: "✅" }
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center gap-4 group">
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl shadow-lg transition-all duration-500 ${step.active
                    ? 'bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border border-cyan-500/40 text-white scale-110 shadow-[0_0_30px_rgba(34,211,238,0.15)]'
                    : 'bg-white/5 border border-white/5 text-gray-500 group-hover:bg-white/10 group-hover:text-gray-300'}`}>
                    {step.icon}
                  </div>
                  <span className={`text-sm font-bold uppercase tracking-wider ${step.active ? 'text-cyan-400' : 'text-gray-600'}`}>{step.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* CTA SECTION */}
      <section className="py-32 relative overflow-hidden">
        {/* Deep Gradient Background */}
        <div className="absolute inset-0 bg-[#020205]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/10 to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px]" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-5xl md:text-7xl font-bold mb-8 tracking-tighter text-white">
            Start Building Trust.
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-xl mx-auto leading-relaxed font-light">
            Join the decentralized compute revolution. Sign up today and get <strong className="text-cyan-400">10 YTK credits</strong> to deploy your first applet.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/marketplace" className="px-12 py-5 bg-white text-black text-lg font-bold rounded-full hover:bg-gray-200 transition-all shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] hover:-translate-y-1">
              Launch Applet
            </Link>
            <button onClick={() => alert("Contact Sales Demo")} className="px-12 py-5 bg-transparent border border-white/20 text-white text-lg font-bold rounded-full hover:bg-white/10 transition-all backdrop-blur-sm">
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-black py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            {/* Footer Logo */}
            <img src="/nexus%20logo.png" alt="WeilChain Logo" className="w-8 h-8 object-contain" />
            <span className="font-bold text-xl tracking-tighter text-white">WeilChain Nexus</span>
          </div>
          <div className="flex gap-8 text-sm text-gray-400 font-medium">
            <a href="#" className="hover:text-cyan-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-cyan-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-cyan-400 transition-colors">Twitter</a>
            <a href="#" className="hover:text-cyan-400 transition-colors">Discord</a>
          </div>
          <div className="text-gray-600 text-xs">
            © 2026 WeilChain Foundation. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
