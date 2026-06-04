import { NavBar } from "@/components/landing/NavBar";
import { HeroSection } from "@/components/landing/HeroSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { BlogSection } from "@/components/landing/BlogSection";
import { MentorApplicationSection } from "@/components/landing/MentorApplicationSection";
import { CTASection } from "@/components/landing/CTASection";
import Link from "next/link";
import { Code2, BookOpen, DollarSign, Users } from "lucide-react";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-violet-500/30">
            <NavBar />

            <main>
                <HeroSection />
                <StatsSection />
                <FeaturesSection />
                <BlogSection />
                <MentorApplicationSection />
                <CTASection />
            </main>

            <footer className="bg-zinc-950 border-t border-white/5">
                <div className="container mx-auto px-6 py-16">
                    <div className="grid md:grid-cols-4 gap-10 mb-12">
                        {/* Brand */}
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 rounded-lg bg-violet-600/10 border border-violet-500/20">
                                    <Code2 className="w-5 h-5 text-violet-400" />
                                </div>
                                <span className="text-xl font-bold text-white">CodeDabba</span>
                            </div>
                            <p className="text-zinc-500 text-sm leading-relaxed max-w-xs">
                                Master coding by building real-world projects. The most structured path to becoming a confident developer.
                            </p>
                            <div className="mt-6 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs text-zinc-500">Platform is live and accepting learners</span>
                            </div>
                        </div>

                        {/* Platform Links */}
                        <div>
                            <h4 className="font-semibold text-white mb-5 text-sm uppercase tracking-wider">Platform</h4>
                            <ul className="space-y-3 text-sm text-zinc-500">
                                <li>
                                    <Link href="/courses" className="hover:text-white transition-colors flex items-center gap-2 group">
                                        <BookOpen className="w-3.5 h-3.5 group-hover:text-violet-400 transition-colors" />
                                        Browse Courses
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/hackathons" className="hover:text-white transition-colors flex items-center gap-2 group">
                                        <Users className="w-3.5 h-3.5 group-hover:text-violet-400 transition-colors" />
                                        Hackathons
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/pricing" className="hover:text-white transition-colors flex items-center gap-2 group">
                                        <DollarSign className="w-3.5 h-3.5 group-hover:text-violet-400 transition-colors" />
                                        Pricing
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/mentor-application" className="hover:text-white transition-colors flex items-center gap-2 group">
                                        <Code2 className="w-3.5 h-3.5 group-hover:text-violet-400 transition-colors" />
                                        Become a Mentor
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Get Started */}
                        <div>
                            <h4 className="font-semibold text-white mb-5 text-sm uppercase tracking-wider">Get Started</h4>
                            <ul className="space-y-3 text-sm text-zinc-500">
                                <li>
                                    <Link href="/register" className="hover:text-white transition-colors">
                                        Create Free Account
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/login" className="hover:text-white transition-colors">
                                        Sign In
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/courses" className="hover:text-white transition-colors">
                                        Free Courses
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-600">
                        <span>© {new Date().getFullYear()} CodeDabba. All rights reserved.</span>
                        <span className="text-xs">Built with ❤️ for aspiring developers</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
