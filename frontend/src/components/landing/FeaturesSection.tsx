"use client";

import { Video, Code, ShieldCheck, Award, Zap, GitBranch } from "lucide-react";
import { motion } from "framer-motion";

const features = [
    {
        icon: <Video className="h-6 w-6 text-blue-400" />,
        title: "Structured Learning",
        description: "Modules and chapters are unlocked progressively. Complete each task to access the next lesson — no skipping ahead.",
        color: "bg-blue-500/10 border-blue-500/20",
        hoverColor: "hover:border-blue-500/60 hover:shadow-blue-500/10",
        glow: "group-hover:bg-blue-500/5",
        iconBg: "bg-blue-500/10 border-blue-500/20",
    },
    {
        icon: <Code className="h-6 w-6 text-emerald-400" />,
        title: "Hands-on Coding",
        description: "Write real code in our browser-based editor. Your submissions are automatically tested and verified instantly.",
        color: "bg-emerald-500/10 border-emerald-500/20",
        hoverColor: "hover:border-emerald-500/60 hover:shadow-emerald-500/10",
        glow: "group-hover:bg-emerald-500/5",
        iconBg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
        icon: <ShieldCheck className="h-6 w-6 text-purple-400" />,
        title: "Verified Certificates",
        description: "Earn certificates that prove your skills — because you coded the project, not just watched someone else do it.",
        color: "bg-purple-500/10 border-purple-500/20",
        hoverColor: "hover:border-purple-500/60 hover:shadow-purple-500/10",
        glow: "group-hover:bg-purple-500/5",
        iconBg: "bg-purple-500/10 border-purple-500/20",
    },
    {
        icon: <Award className="h-6 w-6 text-amber-400" />,
        title: "Expert Mentorship",
        description: "Learn from industry professionals. Get your code reviewed and your questions answered in live mentor sessions.",
        color: "bg-amber-500/10 border-amber-500/20",
        hoverColor: "hover:border-amber-500/60 hover:shadow-amber-500/10",
        glow: "group-hover:bg-amber-500/5",
        iconBg: "bg-amber-500/10 border-amber-500/20",
    },
    {
        icon: <Zap className="h-6 w-6 text-fuchsia-400" />,
        title: "Hackathons",
        description: "Compete in time-boxed hackathons, work in teams, and build projects under pressure — just like the real world.",
        color: "bg-fuchsia-500/10 border-fuchsia-500/20",
        hoverColor: "hover:border-fuchsia-500/60 hover:shadow-fuchsia-500/10",
        glow: "group-hover:bg-fuchsia-500/5",
        iconBg: "bg-fuchsia-500/10 border-fuchsia-500/20",
    },
    {
        icon: <GitBranch className="h-6 w-6 text-cyan-400" />,
        title: "Real Projects",
        description: "Every course culminates in a real project you can add to your portfolio and show to future employers.",
        color: "bg-cyan-500/10 border-cyan-500/20",
        hoverColor: "hover:border-cyan-500/60 hover:shadow-cyan-500/10",
        glow: "group-hover:bg-cyan-500/5",
        iconBg: "bg-cyan-500/10 border-cyan-500/20",
    },
];

export function FeaturesSection() {
    return (
        <section id="features" className="py-28 bg-zinc-950 relative overflow-hidden">
            {/* Ambient background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-violet-900/8 rounded-full blur-[120px]" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-violet-400 font-medium tracking-wide uppercase text-xs"
                    >
                        Why learners choose us
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl md:text-4xl font-bold tracking-tight text-white mt-3 mb-4"
                    >
                        Why CodeDabba Works
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-zinc-400 max-w-2xl mx-auto"
                    >
                        We've replaced passive watching with active building. Every feature is designed to accelerate your journey to mastery.
                    </motion.p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-40px" }}
                            transition={{ duration: 0.5, delay: index * 0.08 }}
                        >
                            <FeatureCard {...feature} />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function FeatureCard({
    icon, title, description, color, hoverColor, glow, iconBg
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    color: string;
    hoverColor: string;
    glow: string;
    iconBg: string;
}) {
    return (
        <div className={`group relative p-8 rounded-2xl border transition-all duration-300 ${color} ${hoverColor} hover:shadow-2xl hover:-translate-y-1`}>
            {/* Glow on hover */}
            <div className={`absolute inset-0 rounded-2xl transition-opacity duration-300 opacity-0 group-hover:opacity-100 ${glow} pointer-events-none`} />

            <div className={`mb-5 w-12 h-12 rounded-xl flex items-center justify-center border ${iconBg} group-hover:scale-110 transition-transform duration-300`}>
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
            <p className="text-zinc-400 leading-relaxed text-sm">{description}</p>
        </div>
    );
}
