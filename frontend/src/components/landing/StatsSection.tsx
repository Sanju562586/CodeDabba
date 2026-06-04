"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";

const stats = [
    { label: "Active Learners", value: 10000, display: "10K+", color: "from-violet-500 to-fuchsia-500" },
    { label: "Code Submissions", value: 1500000, display: "1.5M+", color: "from-blue-500 to-cyan-500" },
    { label: "Expert Mentors", value: 500, display: "500+", color: "from-emerald-500 to-teal-500" },
    { label: "Countries", value: 30, display: "30+", color: "from-amber-500 to-orange-500" },
];

function AnimatedStat({ stat, delay, isInView }: { stat: typeof stats[0], delay: number, isInView: boolean }) {
    const [count, setCount] = useState(0);
    const target = stat.value > 1000 ? stat.value : stat.value;

    useEffect(() => {
        if (!isInView) return;
        const duration = 1800;
        const start = Date.now();
        const timer = setInterval(() => {
            const elapsed = Date.now() - start - delay;
            if (elapsed < 0) return;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress >= 1) clearInterval(timer);
        }, 16);
        return () => clearInterval(timer);
    }, [isInView, target, delay]);

    const formatCount = (n: number) => {
        if (n >= 1000000) return (n / 1000000).toFixed(1) + "M+";
        if (n >= 1000) return (n / 1000).toFixed(0) + "K+";
        return n + "+";
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: delay / 1000 }}
            className="flex flex-col items-center text-center group"
        >
            <div className={`text-5xl md:text-6xl font-bold font-counter mb-3 bg-gradient-to-b ${stat.color} bg-clip-text text-transparent`}>
                {isInView ? formatCount(count) : "0"}
            </div>
            <div className="text-sm md:text-base text-zinc-500 uppercase tracking-widest font-semibold">
                {stat.label}
            </div>
        </motion.div>
    );
}

export function StatsSection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-80px" });

    return (
        <section className="py-24 relative overflow-hidden" ref={ref}>
            {/* subtle separator lines */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/50 to-black/30" />

            <div className="container mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <span className="text-violet-400 font-medium tracking-wide uppercase text-xs">Trusted by developers worldwide</span>
                    <h2 className="text-2xl font-bold text-white mt-2">The numbers speak for themselves</h2>
                </motion.div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
                    {stats.map((stat, index) => (
                        <AnimatedStat key={index} stat={stat} delay={index * 150} isInView={isInView} />
                    ))}
                </div>
            </div>
        </section>
    );
}
