"use client";

import { useAuth } from "@/context/AuthProvider";
import { useState, useEffect } from "react";
import { Loader2, Users, BookOpen, Activity, AlertCircle, TrendingUp, ShieldCheck } from "lucide-react";
import api from "@/lib/axios";
import Link from "next/link";
import { motion } from "framer-motion";

interface AdminStats {
    totalUsers: number;
    totalMentors: number;
    totalStudents: number;
    totalCourses: number;
    pendingApplications: number;
    pendingReviews: number;
}

export default function AdminDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [usersRes, coursesRes, appsRes] = await Promise.all([
                api.get('/users'),
                api.get('/courses/admin/all'),
                api.get('/mentor-applications'),
            ]);

            const users = usersRes.data || [];
            const courses = coursesRes.data?.data || [];
            const applications = appsRes.data || [];

            setStats({
                totalUsers: users.length,
                totalMentors: users.filter((u: any) => u.role === 'MENTOR').length,
                totalStudents: users.filter((u: any) => u.role === 'STUDENT').length,
                totalCourses: courses.length,
                pendingApplications: applications.filter((a: any) => a.status === 'PENDING').length,
                pendingReviews: courses.filter((c: any) =>
                    c.status === 'curriculum_under_review' || c.status === 'content_under_review'
                ).length,
            });
        } catch (error) {
            console.error("Failed to fetch admin stats", error);
        } finally {
            setLoading(false);
        }
    };

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
            <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] bg-violet-600/10 rounded-full blur-[150px] mix-blend-screen pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-600/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />

            <div className="container mx-auto px-6 py-24 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="mb-14"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-400 uppercase tracking-widest mb-4 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Super Admin Access</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 tracking-tight mb-2">
                        Global Operations
                    </h1>
                    <p className="text-zinc-400 text-lg mt-2">Platform analytics and oversight for <span className="text-white font-semibold">{user?.name || 'Admin'}</span></p>
                </motion.div>

                {loading ? (
                    <div className="flex justify-center py-24">
                        <Loader2 className="w-12 h-12 animate-spin text-violet-500" />
                    </div>
                ) : (
                    <>
                        {/* Primary Stats */}
                        <motion.div 
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            className="grid md:grid-cols-3 gap-6 mb-8"
                        >
                            <motion.div variants={itemVariants} className="group relative">
                                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity duration-500 blur-xl" />
                                <div className="relative h-full p-8 bg-zinc-900/60 backdrop-blur-xl rounded-3xl border border-white/5 hover:border-blue-500/40 transition-colors shadow-2xl overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all pointer-events-none group-hover:scale-110">
                                        <Users className="w-32 h-32 text-blue-500" />
                                    </div>
                                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-500/20">
                                        <Users className="w-7 h-7 text-blue-400" />
                                    </div>
                                    <p className="text-blue-400/80 text-xs font-bold uppercase tracking-widest mb-2">Total Users</p>
                                    <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-500 tracking-tighter">
                                        {stats?.totalUsers ?? 0}
                                    </p>
                                    <div className="mt-6 flex items-center gap-4 p-4 bg-black/40 rounded-2xl border border-white/5">
                                        <div className="flex-1 text-center border-r border-white/5">
                                            <p className="text-xl font-bold text-violet-400">{stats?.totalMentors ?? 0}</p>
                                            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mt-1">Mentors</p>
                                        </div>
                                        <div className="flex-1 text-center">
                                            <p className="text-xl font-bold text-cyan-400">{stats?.totalStudents ?? 0}</p>
                                            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mt-1">Students</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div variants={itemVariants} className="group relative">
                                <div className="absolute inset-0 bg-gradient-to-b from-pink-500/20 to-transparent opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity duration-500 blur-xl" />
                                <div className="relative h-full p-8 bg-zinc-900/60 backdrop-blur-xl rounded-3xl border border-white/5 hover:border-pink-500/40 transition-colors shadow-2xl overflow-hidden flex flex-col">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all pointer-events-none group-hover:scale-110">
                                        <BookOpen className="w-32 h-32 text-pink-500" />
                                    </div>
                                    <div className="w-14 h-14 rounded-2xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20 mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-pink-500/20">
                                        <BookOpen className="w-7 h-7 text-pink-400" />
                                    </div>
                                    <p className="text-pink-400/80 text-xs font-bold uppercase tracking-widest mb-2">Total Courses</p>
                                    <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-500 tracking-tighter">
                                        {stats?.totalCourses ?? 0}
                                    </p>
                                    
                                    <div className="mt-auto pt-6">
                                        {(stats?.pendingReviews ?? 0) > 0 ? (
                                            <div className="p-4 bg-yellow-500/10 rounded-2xl border border-yellow-500/20 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <AlertCircle className="w-4 h-4 text-yellow-500 animate-pulse" />
                                                    <span className="text-sm font-bold text-yellow-500">{stats?.pendingReviews} Review{stats?.pendingReviews !== 1 ? 's' : ''} Pending</span>
                                                </div>
                                                <Link href="/admin/reviews" className="text-xs font-bold text-yellow-400 hover:text-white transition-colors">Action Required →</Link>
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 flex items-center gap-2">
                                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                                <span className="text-sm font-semibold text-emerald-500/80">All courses reviewed</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div variants={itemVariants} className="group relative">
                                <div className="absolute inset-0 bg-gradient-to-b from-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity duration-500 blur-xl" />
                                <div className="relative h-full p-8 bg-zinc-900/60 backdrop-blur-xl rounded-3xl border border-white/5 hover:border-amber-500/40 transition-colors shadow-2xl overflow-hidden flex flex-col">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all pointer-events-none group-hover:scale-110">
                                        <Activity className="w-32 h-32 text-amber-500" />
                                    </div>
                                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-amber-500/20">
                                        <Activity className="w-7 h-7 text-amber-400" />
                                    </div>
                                    <p className="text-amber-400/80 text-xs font-bold uppercase tracking-widest mb-2">Mentor Applications</p>
                                    <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-500 tracking-tighter">
                                        {stats?.pendingApplications ?? 0}
                                    </p>
                                    
                                    <div className="mt-auto pt-6">
                                        <Link 
                                            href="/admin/applications"
                                            className="w-full inline-flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-black py-3 rounded-2xl text-sm font-bold transition-all border border-amber-500/20 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                                        >
                                            Process Applications
                                            <TrendingUp className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                        
                        {/* Quick Actions */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="grid md:grid-cols-3 gap-4"
                        >
                            <Link
                                href="/admin/users"
                                className="flex items-center gap-4 p-5 bg-zinc-900/30 border border-zinc-800 rounded-xl hover:border-violet-500/40 hover:bg-zinc-900/60 transition-all group shadow-lg"
                            >
                                <div className="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center border border-violet-500/20 group-hover:scale-110 transition-transform">
                                    <Users className="w-5 h-5 text-violet-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white group-hover:text-violet-400 transition-colors">Manage Users</p>
                                    <p className="text-xs text-zinc-500">View, promote &amp; remove users</p>
                                </div>
                            </Link>

                            <Link
                                href="/admin/applications"
                                className="flex items-center gap-4 p-5 bg-zinc-900/30 border border-zinc-800 rounded-xl hover:border-pink-500/40 hover:bg-zinc-900/60 transition-all group shadow-lg"
                            >
                                <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center border border-pink-500/20 group-hover:scale-110 transition-transform">
                                    <Activity className="w-5 h-5 text-pink-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white group-hover:text-pink-400 transition-colors">
                                        Mentor Applications
                                        {(stats?.pendingApplications ?? 0) > 0 && (
                                            <span className="ml-2 px-1.5 py-0.5 bg-pink-500/20 text-pink-400 text-[10px] rounded-full font-bold">
                                                {stats?.pendingApplications}
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-xs text-zinc-500">Review &amp; approve applicants</p>
                                </div>
                            </Link>

                            <Link
                                href="/admin/reviews"
                                className="flex items-center gap-4 p-5 bg-zinc-900/30 border border-zinc-800 rounded-xl hover:border-amber-500/40 hover:bg-zinc-900/60 transition-all group shadow-lg"
                            >
                                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform">
                                    <BookOpen className="w-5 h-5 text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors">
                                        Course Reviews
                                        {(stats?.pendingReviews ?? 0) > 0 && (
                                            <span className="ml-2 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] rounded-full font-bold">
                                                {stats?.pendingReviews}
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-xs text-zinc-500">Review curriculum &amp; content</p>
                                </div>
                            </Link>
                        </motion.div>
                    </>
                )}
            </div>
        </div>
    );
}
