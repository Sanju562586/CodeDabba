"use client";

import { motion } from "framer-motion";
import { Clock, Layers, ArrowRight, Lock } from "lucide-react";

// Blog is coming soon — no blog pages exist yet
// Show a preview with "Coming Soon" state instead of broken links

const BLOGS = [
    {
        title: "The Rise of AI in Frontend Development",
        excerpt: "How tools like Copilot and v0 are changing the way we build interfaces and what you need to learn to stay ahead.",
        date: "Feb 14, 2025",
        readTime: "5 min read",
        category: "AI & Tech",
        color: "from-blue-600/20 to-cyan-600/20",
        borderColor: "border-blue-500/20",
    },
    {
        title: "Mastering TypeScript Generics",
        excerpt: "A deep dive into one of TypeScript's most powerful features. Learn how to write reusable and type-safe code that scales.",
        date: "Feb 10, 2025",
        readTime: "8 min read",
        category: "Tutorial",
        color: "from-violet-600/20 to-purple-600/20",
        borderColor: "border-violet-500/20",
    },
    {
        title: "System Design 101: Scalability",
        excerpt: "Understanding the core principles of building scalable systems. Load balancing, caching, and database sharding explained.",
        date: "Feb 08, 2025",
        readTime: "12 min read",
        category: "System Design",
        color: "from-emerald-600/20 to-teal-600/20",
        borderColor: "border-emerald-500/20",
    },
];

export function BlogSection() {
    return (
        <section id="blogs" className="py-28 bg-black relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-end mb-14 gap-6">
                    <div>
                        <motion.span
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-violet-400 font-medium tracking-wide uppercase text-xs"
                        >
                            Community Insights
                        </motion.span>
                        <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-3xl font-bold text-white mt-2"
                        >
                            Latest from the Blog
                        </motion.h2>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-500 bg-zinc-900/50 border border-zinc-800 px-4 py-2 rounded-full">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Blog launching soon</span>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {BLOGS.map((blog, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-40px" }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className={`relative group rounded-2xl bg-gradient-to-br ${blog.color} border ${blog.borderColor} p-8 overflow-hidden`}
                        >
                            {/* Coming soon overlay */}
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl z-10">
                                <div className="bg-zinc-900/90 border border-white/10 rounded-xl px-6 py-3 flex items-center gap-2">
                                    <ArrowRight className="w-4 h-4 text-violet-400" />
                                    <span className="text-sm font-semibold text-white">Coming Soon</span>
                                </div>
                            </div>

                            <div className="mb-5">
                                <span className="px-3 py-1 text-xs font-semibold text-white bg-white/10 backdrop-blur-sm rounded-full border border-white/10">
                                    {blog.category}
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-white mb-3 leading-snug">
                                {blog.title}
                            </h3>

                            <p className="text-zinc-400 text-sm leading-relaxed mb-6 line-clamp-2">
                                {blog.excerpt}
                            </p>

                            <div className="flex items-center gap-4 text-xs text-zinc-500">
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{blog.readTime}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Layers className="w-3.5 h-3.5" />
                                    <span>{blog.date}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
