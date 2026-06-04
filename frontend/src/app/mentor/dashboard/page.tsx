"use client";

import { useAuth } from "@/context/AuthProvider";
import { useState, useEffect } from "react";
import { Activity, Shield, Code2, Globe, Users, Trophy } from "lucide-react";
import api from "@/lib/axios";
import { motion } from "framer-motion";

export default function MentorDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ courses: 0, hackathons: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [hRes, cRes] = await Promise.all([
                    api.get('/hackathons/mentor/hackathons'),
                    api.get('/courses/my-courses')
                ]);
                setStats({ hackathons: hRes.data.length, courses: cRes.data.length });
            } catch (error) {
                console.error("Failed to fetch stats", error);
            }
        };
        fetchStats();
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <div className="w-full relative min-h-screen overflow-hidden">
            {/* Background effects */}
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-600/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />

            {/* Hero Header */}
            <div className="relative pt-32 pb-16 border-b border-white/5 bg-zinc-950/50 backdrop-blur-3xl z-10">
                <div className="container mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-widest rounded-full border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                Command Center Access Granted
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 mb-3 tracking-tight">
                            Mentor HQ
                        </h1>
                        <p className="text-zinc-400 text-lg">Directing operations for <span className="text-white font-semibold">{user?.name}</span></p>
                    </motion.div>
                </div>
            </div>

            <main className="container mx-auto px-6 py-16 relative z-10">
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {/* Active Missions Card */}
                    <motion.div variants={itemVariants} className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity duration-500 blur-xl" />
                        <div className="relative h-full p-8 bg-zinc-900/60 backdrop-blur-xl border border-white/5 hover:border-emerald-500/40 rounded-3xl transition-all duration-300 overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 pointer-events-none">
                                <Trophy className="w-32 h-32 text-emerald-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                                <Shield className="w-6 h-6 text-emerald-500" />
                                Deployment Summary
                            </h3>
                            <div className="p-6 bg-black/40 rounded-2xl border border-zinc-800/50 backdrop-blur-md relative z-10 group-hover:border-emerald-500/20 transition-colors">
                                <p className="text-emerald-500/70 text-xs font-bold uppercase tracking-widest mb-2">Active Hackathons</p>
                                <div className="flex items-end gap-3">
                                    <p className="text-5xl font-black text-white">{stats.hackathons}</p>
                                    <p className="text-zinc-500 font-medium mb-1 tracking-wide">Missions</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Academy Overview Card */}
                    <motion.div variants={itemVariants} className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-teal-500/20 to-transparent opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity duration-500 blur-xl" />
                        <div className="relative h-full p-8 bg-zinc-900/60 backdrop-blur-xl border border-white/5 hover:border-teal-500/40 rounded-3xl transition-all duration-300 overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500 pointer-events-none">
                                <Code2 className="w-32 h-32 text-teal-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                                <Code2 className="w-6 h-6 text-teal-500" />
                                Academy Overview
                            </h3>
                            <div className="p-6 bg-black/40 rounded-2xl border border-zinc-800/50 backdrop-blur-md relative z-10 group-hover:border-teal-500/20 transition-colors">
                                <p className="text-teal-500/70 text-xs font-bold uppercase tracking-widest mb-2">My Courses</p>
                                <div className="flex items-end gap-3">
                                    <p className="text-5xl font-black text-white">{stats.courses}</p>
                                    <p className="text-zinc-500 font-medium mb-1 tracking-wide">Published</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Network Status Card */}
                    <motion.div variants={itemVariants} className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity duration-500 blur-xl" />
                        <div className="relative h-full p-8 bg-zinc-900/60 backdrop-blur-xl border border-white/5 hover:border-cyan-500/40 rounded-3xl transition-all duration-300 overflow-hidden shadow-2xl flex flex-col">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500 pointer-events-none">
                                <Globe className="w-32 h-32 text-cyan-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                                <Globe className="w-6 h-6 text-cyan-500" />
                                Network Status
                            </h3>
                            <div className="flex-1 flex items-center justify-center p-6 bg-black/40 rounded-2xl border border-zinc-800/50 backdrop-blur-md relative z-10 group-hover:border-cyan-500/20 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="w-4 h-4 rounded-full bg-cyan-400 z-10 relative"></div>
                                        <div className="absolute inset-0 w-4 h-4 rounded-full bg-cyan-400 animate-ping opacity-75"></div>
                                    </div>
                                    <p className="text-2xl font-bold text-cyan-400 tracking-wide">Connected</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </main>
        </div>
    );
}
