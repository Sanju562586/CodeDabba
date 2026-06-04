"use client";

import Link from "next/link";
import { ArrowRight, Terminal, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthProvider";

export function HeroSection() {
    const { user } = useAuth();

    return (
        <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-black selection:bg-violet-500/30">

            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-violet-700/25 rounded-full blur-[140px] mix-blend-screen" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen" />
                <div className="absolute top-[30%] left-[50%] transform -translate-x-1/2 w-[900px] h-[600px] bg-indigo-500/8 rounded-full blur-[120px] opacity-60" />
            </div>

            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-30" />

            <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center py-16">

                {/* Text Content */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-left"
                >
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm font-medium mb-8"
                    >
                        <Sparkles className="w-4 h-4" />
                        <span>The Future of Coding Education</span>
                    </motion.div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1] mb-6">
                        Boost Your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 animate-gradient">
                            Developer Career
                        </span>
                    </h1>

                    <p className="text-lg text-zinc-400 mb-8 max-w-lg leading-relaxed">
                        Stop watching tutorials. Start building real-world projects with structured learning, hands-on coding challenges, and expert mentorship.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 mt-8">
                        {user ? (
                            <Link
                                href="/dashboard"
                                className="px-8 py-4 text-base font-bold text-white bg-violet-600 rounded-2xl hover:bg-violet-500 transition-all hover:scale-105 shadow-xl shadow-violet-500/25 flex items-center justify-center gap-2"
                            >
                                Go to Dashboard
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        ) : (
                            <Link
                                href="/register"
                                className="px-8 py-4 text-base font-bold text-white bg-violet-600 rounded-2xl hover:bg-violet-500 transition-all hover:scale-105 shadow-xl shadow-violet-500/25 flex items-center justify-center gap-2"
                            >
                                Start Learning Free
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        )}
                        <Link
                            href="/courses"
                            className="px-8 py-4 text-base font-bold text-zinc-300 border border-zinc-700 bg-zinc-900/50 backdrop-blur-sm rounded-2xl hover:bg-zinc-800 transition-all hover:text-white flex items-center justify-center"
                        >
                            Browse Courses
                        </Link>
                    </div>

                    {!user && (
                        <div className="mt-4 text-sm text-zinc-500">
                            Already have an account?{" "}
                            <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors font-medium">
                                Log in →
                            </Link>
                        </div>
                    )}

                    {/* Stats Mini */}
                    <div className="mt-12 flex items-center gap-8 text-sm font-medium text-zinc-500">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-zinc-300">1.2k Online Now</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-violet-500" />
                            <span className="text-zinc-300">Run code in browser</span>
                        </div>
                    </div>
                </motion.div>

                {/* Visual Content (Code Editor Card) */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                    className="relative hidden lg:block"
                >
                    <div className="relative z-10 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl shadow-violet-500/10">
                        {/* Window chrome */}
                        <div className="flex items-center gap-2 mb-5 border-b border-white/5 pb-4">
                            <div className="w-3 h-3 rounded-full bg-red-500/80" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                            <div className="w-3 h-3 rounded-full bg-green-500/80" />
                            <div className="ml-auto flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs text-zinc-500 font-mono">app.tsx — CodeDabba</span>
                            </div>
                        </div>

                        <div className="space-y-3 font-mono text-sm">
                            <div className="flex gap-4">
                                <span className="text-zinc-700 select-none w-4 text-right shrink-0">1</span>
                                <div>
                                    <span className="text-pink-400">import</span>
                                    <span className="text-white ml-2">{"{ Future }"}</span>
                                    <span className="text-pink-400 ml-2">from</span>
                                    <span className="text-emerald-400 ml-2">'codedabba'</span>
                                    <span className="text-zinc-600">;</span>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <span className="text-zinc-700 select-none w-4 text-right shrink-0">2</span>
                                <span />
                            </div>
                            <div className="flex gap-4">
                                <span className="text-zinc-700 select-none w-4 text-right shrink-0">3</span>
                                <div>
                                    <span className="text-violet-400">function</span>
                                    <span className="text-yellow-300 ml-2">BuildCareer</span>
                                    <span className="text-zinc-400">() {"{"}</span>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <span className="text-zinc-700 select-none w-4 text-right shrink-0">4</span>
                                <div className="pl-6">
                                    <span className="text-zinc-400">const</span>
                                    <span className="text-blue-300 ml-2">skills</span>
                                    <span className="text-pink-400 ml-2">=</span>
                                    <span className="text-white ml-2">await</span>
                                    <span className="text-emerald-300 ml-2">learn()</span>
                                    <span className="text-zinc-600">;</span>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <span className="text-zinc-700 select-none w-4 text-right shrink-0">5</span>
                                <div className="pl-6">
                                    <span className="text-zinc-400">return</span>
                                    <span className="text-orange-300 ml-2">skills.mastery</span>
                                    <span className="text-zinc-400">;</span>
                                </div>
                            </div>
                            <div className="flex gap-4 items-center">
                                <span className="text-zinc-700 select-none w-4 text-right shrink-0">6</span>
                                <div className="flex items-center gap-1">
                                    <span className="text-zinc-400">{"}"}</span>
                                    <span className="animate-pulse ml-1 inline-block w-2 h-4 bg-violet-400 rounded-sm" />
                                </div>
                            </div>
                        </div>

                        {/* Output Panel */}
                        <div className="mt-5 p-4 bg-black/50 rounded-2xl border border-white/5">
                            <div className="text-xs text-zinc-600 font-mono mb-2">// Output</div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold">✓</div>
                                <div>
                                    <div className="text-xs text-zinc-500 font-mono">mastery.level</div>
                                    <div className="text-sm font-bold text-white">Senior Developer</div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Badge */}
                        <div className="absolute -bottom-6 -right-6 bg-zinc-800/90 backdrop-blur-sm p-4 rounded-2xl border border-white/10 shadow-xl flex items-center gap-3 animate-bounce-slow">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                <ArrowRight className="w-5 h-5 -rotate-45" />
                            </div>
                            <div>
                                <div className="text-[10px] text-zinc-500 uppercase tracking-wide">Growth</div>
                                <div className="text-sm font-bold text-white">+125% Skills</div>
                            </div>
                        </div>
                    </div>

                    {/* Decorative glow behind card */}
                    <div className="absolute inset-0 bg-violet-600/5 rounded-3xl blur-2xl -z-10 scale-110" />
                </motion.div>
            </div>
        </section>
    );
}
