"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Users, Clock, DollarSign, BookMarked } from "lucide-react";
import Link from "next/link";

const benefits = [
    { icon: DollarSign, text: "Earn competitive compensation for your time" },
    { icon: Clock, text: "Flexible schedule — mentor on your terms" },
    { icon: Users, text: "Network with other industry experts" },
    { icon: BookMarked, text: "Access to exclusive teaching resources & tools" },
];

export function MentorApplicationSection() {
    return (
        <section id="become-mentor" className="py-28 bg-zinc-950 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-fuchsia-600/8 rounded-full blur-[120px]" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* Content Side */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-left"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold uppercase tracking-wide mb-6">
                            <Users className="w-3.5 h-3.5" />
                            <span>Join Our Mentor Network</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                            Become a{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
                                Mentor
                            </span>
                        </h2>
                        <p className="text-lg text-zinc-400 mb-10 leading-relaxed">
                            Share your expertise and help shape the next generation of developers.
                            As a CodeDabba mentor, you'll guide students through real-world projects, review their code, and earn for every session.
                        </p>

                        <div className="space-y-4">
                            {benefits.map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.15 + i * 0.08 }}
                                    className="flex items-center gap-4 group"
                                >
                                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    </div>
                                    <span className="text-zinc-300 font-medium">{item.text}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* CTA Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="relative"
                    >
                        <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 backdrop-blur-xl border border-white/8 rounded-3xl p-12 shadow-2xl text-center">
                            {/* Decorative glow */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />

                            <div className="w-20 h-20 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-violet-500/20">
                                <Users className="w-10 h-10 text-violet-400" />
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-3">Ready to make an impact?</h3>
                            <p className="text-zinc-400 mb-8 max-w-xs mx-auto leading-relaxed text-sm">
                                Join hundreds of mentors already changing lives through code. Applications are reviewed on a rolling basis.
                            </p>

                            <Link
                                href="/mentor-application"
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-white bg-violet-600 rounded-2xl hover:bg-violet-500 transition-all hover:scale-105 shadow-xl shadow-violet-500/25 w-full"
                            >
                                Apply to Become a Mentor
                                <ArrowRight className="w-5 h-5" />
                            </Link>

                            <p className="text-xs text-zinc-600 mt-5">
                                Takes 5 minutes · Response within 48 hours
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
