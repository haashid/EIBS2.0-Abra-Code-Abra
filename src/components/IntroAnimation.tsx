"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export default function IntroAnimation() {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Hide animation after 2.5 seconds
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 3800);
        return () => clearTimeout(timer);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -50, transition: { duration: 0.8, ease: "easeInOut" } }}
                >
                    <div className="relative z-10">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5, filter: "blur(10px)" }}
                            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            className="relative"
                        >
                            {/* Gradient Glow */}
                            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-50 blur-[50px] rounded-full" />

                            {/* Text */}
                            <h1 className="relative text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 tracking-tighter">
                                WeilChain Nexus
                            </h1>
                        </motion.div>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1, duration: 0.8 }}
                            className="text-gray-500 text-center mt-4 text-sm md:text-base font-mono tracking-widest uppercase"
                        >
                            Decentralized Intelligence
                        </motion.p>
                    </div>

                    {/* Particle/Grid Background Effect */}
                    <div className="absolute inset-0 z-0 opacity-20">
                        <svg width="100%" height="100%">
                            <defs>
                                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#grid)" />
                        </svg>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
