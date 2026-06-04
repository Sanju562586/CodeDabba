"use client";

import React from "react";
import { ResponsiveRobot } from "@/components/ResponsiveRobot";
import { Code2 } from "lucide-react";
import Link from "next/link";

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
    robotFocusedField?: string | null;
}

export function AuthLayout({ children, title, subtitle, robotFocusedField }: AuthLayoutProps) {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-neutral-950 p-4">
            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-zinc-800 min-h-[600px]">

                {/* Left Side — Visual Panel */}
                <div className="hidden lg:flex relative bg-indigo-950 flex-col p-12 text-white overflow-hidden">
                    {/* Background photo overlay */}
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2671&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                    {/* Logo */}
                    <div className="relative z-10 shrink-0">
                        <Link href="/landing" className="flex items-center gap-2 w-fit">
                            <div className="p-1.5 rounded-lg bg-white/10 border border-white/20">
                                <Code2 className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold tracking-tight">CodeDabba</span>
                        </Link>
                    </div>

                    {/* Robot */}
                    <div className="relative z-10 flex-1 flex items-center justify-center w-full min-h-[200px] my-4">
                        <ResponsiveRobot focusedField={robotFocusedField ?? null} />
                    </div>

                    {/* Quote */}
                    <div className="relative z-10 max-w-lg space-y-3 shrink-0">
                        <blockquote className="text-3xl font-bold tracking-tight text-white leading-snug">
                            "Discipline is the bridge between goals and accomplishment."
                        </blockquote>
                        <p className="text-base text-zinc-400">
                            Join thousands of developers building their future with consistent practice.
                        </p>
                    </div>
                </div>

                {/* Right Side — Form */}
                <div className="w-full bg-zinc-950 p-8 lg:p-12 flex items-center justify-center">
                    <div className="w-full max-w-md space-y-8">
                        <div className="text-center lg:text-left space-y-2">
                            <h1 className="text-3xl font-bold tracking-tight text-white">{title}</h1>
                            <p className="text-zinc-400">{subtitle}</p>
                        </div>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
