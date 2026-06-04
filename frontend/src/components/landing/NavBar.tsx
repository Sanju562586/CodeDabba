"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Code2, Menu, X, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";

export function NavBar() {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { user, isLoading } = useAuth();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/landing" className="flex items-center gap-2 group">
                    <div className="p-2 rounded-lg bg-violet-600/10 border border-violet-500/20 group-hover:border-violet-500/50 transition-colors">
                        <Code2 className="w-5 h-5 text-violet-400" />
                    </div>
                    <span className="font-bold text-lg text-white">CodeDabba</span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8">
                    <Link href="/courses" className={`text-sm font-medium transition-colors ${pathname.startsWith('/courses') ? 'text-white' : 'text-zinc-400 hover:text-white'}`}>
                        Courses
                    </Link>
                    <Link href="/hackathons" className={`text-sm font-medium transition-colors ${pathname.startsWith('/hackathons') ? 'text-white' : 'text-zinc-400 hover:text-white'}`}>
                        Hackathons
                    </Link>
                    <Link href="/pricing" className={`text-sm font-medium transition-colors ${pathname === '/pricing' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}>
                        Pricing
                    </Link>
                </div>

                {/* Desktop CTA */}
                <div className="hidden md:flex items-center gap-3">
                    {isLoading ? (
                        <div className="w-24 flex justify-center">
                            <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
                        </div>
                    ) : user ? (
                        <Link
                            href="/dashboard"
                            className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-500 transition-colors shadow-lg shadow-violet-500/20 flex items-center gap-2"
                        >
                            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                                {user.name?.charAt(0) || 'U'}
                            </div>
                            My Dashboard
                        </Link>
                    ) : (
                        <div className="flex gap-2">
                            <Link
                                href="/login"
                                className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 border border-white/5 rounded-lg transition-colors"
                            >
                                Log In
                            </Link>
                            <Link
                                href="/register"
                                className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-all shadow-lg shadow-violet-500/20"
                            >
                                Start Free
                            </Link>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Toggle menu"
                >
                    {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden absolute top-16 left-0 right-0 bg-zinc-900/95 backdrop-blur-xl border-b border-white/5 p-6 flex flex-col gap-5">
                    <Link href="/courses" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors" onClick={() => setIsMenuOpen(false)}>
                        Courses
                    </Link>
                    <Link href="/hackathons" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors" onClick={() => setIsMenuOpen(false)}>
                        Hackathons
                    </Link>
                    <Link href="/pricing" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors" onClick={() => setIsMenuOpen(false)}>
                        Pricing
                    </Link>
                    <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                        {isLoading ? (
                            <div className="w-full flex justify-center py-2">
                                <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
                            </div>
                        ) : user ? (
                            <Link href="/dashboard" className="px-4 py-3 text-center text-sm font-semibold text-white bg-violet-600 rounded-xl" onClick={() => setIsMenuOpen(false)}>
                                My Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link href="/login" className="px-4 py-3 text-center text-sm font-medium text-zinc-300 bg-zinc-800 rounded-xl" onClick={() => setIsMenuOpen(false)}>
                                    Log In
                                </Link>
                                <Link href="/register" className="px-4 py-3 text-center text-sm font-semibold text-white bg-violet-600 rounded-xl" onClick={() => setIsMenuOpen(false)}>
                                    Start Free
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
