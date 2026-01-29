"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, ArrowRight, Truck, Box, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Hero() {
    const [trackingId, setTrackingId] = useState("");
    const router = useRouter();

    const handleTrack = (e: React.FormEvent) => {
        e.preventDefault();
        if (trackingId.trim()) {
            router.push(`/track/${trackingId}`);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
            },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.6, ease: "easeOut" as const },
        },
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 -z-10 h-full w-full overflow-hidden">
                <div className="absolute -top-[20%] -left-[10%] h-[70vh] w-[70vh] rounded-full bg-primary/20 blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
                <div className="absolute top-[40%] -right-[10%] h-[60vh] w-[60vh] rounded-full bg-blue-500/10 blur-[120px]" />
            </div>

            <div className="container px-4 sm:px-6 lg:px-8 relative z-10 grid lg:grid-cols-2 gap-12 items-center">

                {/* Left Content */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="text-center lg:text-left space-y-8"
                >
                    <motion.div variants={itemVariants} className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-primary backdrop-blur-md">
                        <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
                        Next-Gen Logistics
                    </motion.div>

                    <motion.h1 variants={itemVariants} className="text-5xl sm:text-7xl font-bold tracking-tight text-white leading-[1.1]">
                        Seamless <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
                            Delivery
                        </span>{" "}
                        Experience
                    </motion.h1>

                    <motion.p variants={itemVariants} className="text-lg text-white/60 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                        Track your packages in real-time with our premium courier service.
                        Experience speed, transparency, and reliability like never before.
                    </motion.p>

                    <motion.div variants={itemVariants}>
                        <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto lg:mx-0 p-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                                <Input
                                    placeholder="Enter Tracking ID (e.g. SWIFT-123)"
                                    className="pl-10 h-12 bg-transparent border-none text-white placeholder:text-white/40 focus-visible:ring-0 text-base"
                                    value={trackingId}
                                    onChange={(e) => setTrackingId(e.target.value)}
                                />
                            </div>
                            <Button size="lg" className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                                Track
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </form>
                    </motion.div>

                    <motion.div variants={itemVariants} className="pt-8 flex items-center justify-center lg:justify-start gap-8 text-white/40">
                        <div className="flex items-center gap-2">
                            <Truck className="h-5 w-5" />
                            <span className="text-sm">Global Shipping</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Box className="h-5 w-5" />
                            <span className="text-sm">Secure Packaging</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            <span className="text-sm">Real-time Tracking</span>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Right Content (Visuals) */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                    className="hidden lg:block relative"
                >
                    {/* Glass Card 1 - Status */}
                    <motion.div
                        animate={{ y: [0, -20, 0] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-0 right-10 z-20"
                    >
                        <div className="p-4 w-64 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                            <div className="flex items-center justify-between mb-4">
                                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                                    <Box className="h-5 w-5" />
                                </div>
                                <span className="px-2 py-1 rounded-full bg-white/5 text-xs text-white/60">Now</span>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-white/60">Status</p>
                                <p className="text-lg font-semibold text-white">Out for Delivery</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Glass Card 2 - Map/Route */}
                    <motion.div
                        className="relative z-10 mt-20 ml-10"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                    >
                        <div className="p-6 w-96 h-80 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                            {/* Fake Map UI */}
                            <div className="h-full w-full rounded-2xl bg-white/5 opacity-50 relative">
                                <div className="absolute top-[20%] left-[30%] h-3 w-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                                <div className="absolute bottom-[30%] right-[20%] h-3 w-3 rounded-full bg-primary shadow-[0_0_10px_rgba(255,92,0,0.8)]" />
                                {/* Dotted path */}
                                <svg className="absolute inset-0 h-full w-full">
                                    <path d="M 120 70 Q 200 150 280 200" fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="2" strokeDasharray="4 4" />
                                </svg>
                            </div>

                            <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center gap-4">
                                <div className="flex-1">
                                    <p className="text-xs text-white/40">Estimated Arrival</p>
                                    <p className="text-sm font-medium text-white">Today, 2:30 PM</p>
                                </div>
                                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white">
                                    <ArrowRight className="h-4 w-4" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
