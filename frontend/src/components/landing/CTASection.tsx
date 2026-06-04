"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthProvider";
import { motion } from "framer-motion";
import { ArrowRight, Rocket } from "lucide-react";

export function CTASection() {
    const { user } = useAuth();

    return (
        <section className="py-28 relative overflow-hidden">
            {/* Layered background */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-950/60 via-black to-black" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-600/15 rounded-full blur-[100px]" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

            <div className="container mx-auto px-6 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm font-medium mb-8">
                        <Rocket className="w-4 h-4" />
                        <span>{user ? "Welcome back!" : "Start for free today"}</span>
                    </div>

                    <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white leading-tight">
                        {user ? "Ready to Continue\nYour Journey?" : "Ready to Start\nYour Journey?"}
                    </h2>

                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        {user
                            ? "Jump back into your dashboard to pick up right where you left off."
                            : "Join over 10,000 students mastering full-stack development. No credit card required to start."
                        }
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href={user ? "/dashboard" : "/register"}
                            className="inline-flex items-center justify-center gap-2 px-10 py-4 text-base font-bold text-white bg-violet-600 hover:bg-violet-500 rounded-2xl transition-all hover:scale-105 shadow-2xl shadow-violet-500/30"
                        >
                            {user ? "Go to Dashboard" : "Create Free Account"}
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        {!user && (
                            <Link
                                href="/courses"
                                className="inline-flex items-center justify-center gap-2 px-10 py-4 text-base font-bold text-zinc-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all hover:text-white"
                            >
                                Browse Free Courses
                            </Link>
                        )}
                    </div>

                    {!user && (
                        <p className="mt-6 text-sm text-zinc-600">
                            No credit card required · Cancel anytime · Free forever plan available
                        </p>
                    )}
                </motion.div>
            </div>
        </section>
    );
}
