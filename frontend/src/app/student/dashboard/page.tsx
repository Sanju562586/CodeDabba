"use client";

import { useAuth } from "@/context/AuthProvider";
import { useState, useEffect } from "react";
import { Loader2, Users as UsersIcon, ArrowRight, Award, BookOpen, Trophy, Sparkles } from "lucide-react";
import api from "@/lib/axios";
import Link from "next/link";
import { motion } from "framer-motion";

export default function StudentDashboard() {
    const { user } = useAuth();
    const [certificates, setCertificates] = useState<any[]>([]);
    const [invitationCount, setInvitationCount] = useState(0);
    const [stats, setStats] = useState({ courses: 0, hackathons: 0, certificates: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const [invRes, certRes, courseRes, hackRes] = await Promise.all([
                    api.get('/hackathons/mine/invitations'),
                    api.get('/certificates/my'),
                    api.get('/courses/enrolled'),
                    api.get('/hackathons/mine/registrations')
                ]);
                
                setInvitationCount(invRes.data.length);
                setCertificates(certRes.data);
                
                setStats({
                    courses: courseRes.data.length,
                    hackathons: hackRes.data.length,
                    certificates: certRes.data.length
                });
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
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
        show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
    };

    return (
        <div className="w-full relative min-h-screen overflow-hidden">
            {/* Background effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-600/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
            
            <div className="container mx-auto px-6 py-24 relative z-10">

                {/* Hero Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="mb-14 relative"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-zinc-300 mb-4 backdrop-blur-md">
                        <Sparkles className="w-4 h-4 text-violet-400" />
                        <span>Welcome back to academy</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/40 tracking-tight mb-2">
                        {greeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">{user?.name?.split(' ')[0]}</span>!
                    </h1>
                    <p className="text-zinc-400 text-lg">Your learning journey continues. Let's make today count.</p>
                </motion.div>

                {/* Team Invitation Alert */}
                {invitationCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-12"
                    >
                        <Link href="/student/hackathons" className="group block p-[1px] bg-gradient-to-r from-fuchsia-500 via-violet-500 to-fuchsia-500 rounded-3xl hover:scale-[1.02] transition-transform duration-300 shadow-2xl shadow-fuchsia-500/20">
                            <div className="bg-zinc-950/90 backdrop-blur-xl rounded-[calc(1.5rem-1px)] p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
                                {/* Subtle inner glow */}
                                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                
                                <div className="flex items-center gap-6 relative z-10">
                                    <div className="w-16 h-16 bg-gradient-to-br from-fuchsia-500 to-violet-500 rounded-2xl flex items-center justify-center shadow-lg shadow-fuchsia-500/30 group-hover:animate-pulse">
                                        <UsersIcon className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-1">Team Invitation Pending</h2>
                                        <p className="text-zinc-400 text-base">You have <span className="text-fuchsia-400 font-bold">{invitationCount}</span> pending team invitation{invitationCount > 1 ? 's' : ''} for hackathons.</p>
                                    </div>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors relative z-10 shrink-0 self-end md:self-auto">
                                    <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                )}

                {/* Stats Grid */}
                {loading ? (
                    <div className="flex justify-center py-24">
                        <Loader2 className="w-12 h-12 animate-spin text-violet-500" />
                    </div>
                ) : (
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="grid md:grid-cols-3 gap-6 mb-16"
                    >
                        {/* Courses Stat */}
                        <motion.div variants={itemVariants} className="group relative">
                            <div className="absolute inset-0 bg-gradient-to-b from-violet-500/20 to-transparent opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity duration-500 blur-xl" />
                            <div className="relative h-full p-8 bg-zinc-900/40 backdrop-blur-xl border border-white/5 hover:border-violet-500/30 rounded-3xl transition-colors">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20 group-hover:scale-110 transition-transform duration-300">
                                        <BookOpen className="w-6 h-6 text-violet-400" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-5xl font-black text-white tracking-tighter">{stats.courses}</h3>
                                    <p className="text-zinc-400 font-medium">Enrolled Courses</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Hackathons Stat */}
                        <motion.div variants={itemVariants} className="group relative">
                            <div className="absolute inset-0 bg-gradient-to-b from-fuchsia-500/20 to-transparent opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity duration-500 blur-xl" />
                            <div className="relative h-full p-8 bg-zinc-900/40 backdrop-blur-xl border border-white/5 hover:border-fuchsia-500/30 rounded-3xl transition-colors">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/10 flex items-center justify-center border border-fuchsia-500/20 group-hover:scale-110 transition-transform duration-300">
                                        <Trophy className="w-6 h-6 text-fuchsia-400" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-5xl font-black text-white tracking-tighter">{stats.hackathons}</h3>
                                    <p className="text-zinc-400 font-medium">Hackathons Joined</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Certificates Stat */}
                        <motion.div variants={itemVariants} className="group relative">
                            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity duration-500 blur-xl" />
                            <div className="relative h-full p-8 bg-zinc-900/40 backdrop-blur-xl border border-white/5 hover:border-amber-500/30 rounded-3xl transition-colors">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform duration-300">
                                        <Award className="w-6 h-6 text-amber-400" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-5xl font-black text-white tracking-tighter">{stats.certificates}</h3>
                                    <p className="text-zinc-400 font-medium">Certificates Earned</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* Certificates Section */}
                {!loading && certificates.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <Award className="w-6 h-6 text-amber-400" />
                                Honors & Awards
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {certificates.map((cert: any, i) => (
                                <motion.div
                                    key={cert.id}
                                    whileHover={{ y: -8, scale: 1.02 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                    className="group relative"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <div className="relative bg-zinc-900/60 backdrop-blur-xl border border-zinc-700/50 rounded-3xl overflow-hidden hover:border-amber-500/50 transition-colors shadow-2xl flex flex-col h-full">
                                        {/* Certificate Header Pattern */}
                                        <div className="h-24 bg-gradient-to-br from-amber-600/20 to-yellow-600/5 relative overflow-hidden border-b border-white/5 shrink-0">
                                            <div className="absolute top-0 right-0 p-4">
                                                <Award className="w-16 h-16 text-amber-500/10 rotate-12" />
                                            </div>
                                        </div>
                                        <div className="p-6 relative pt-0 flex flex-col flex-1">
                                            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-2xl flex items-center justify-center -mt-7 mb-4 shadow-lg shadow-amber-500/30 border-4 border-zinc-900 shrink-0">
                                                <Award className="w-6 h-6 text-white" />
                                            </div>
                                            
                                            <div className="mb-3">
                                                <div className={`inline-flex px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide border ${cert.type === 'winner' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-zinc-800 text-zinc-400 border-white/5'}`}>
                                                    {cert.type === 'winner' ? `🏆 ${cert.position}` : cert.type === 'course_completion' ? 'Course Completion' : 'Participation'}
                                                </div>
                                            </div>

                                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-400 transition-colors line-clamp-2">
                                                {cert.type === 'course_completion' ? cert.course?.title : cert.hackathon?.title}
                                            </h3>
                                            
                                            <p className="text-xs text-zinc-500 font-mono mb-6 mt-auto">ID: {cert.certificateId}</p>
                                            
                                            <div className="pt-4 border-t border-white/5 flex items-center gap-3 mt-auto">
                                                <a
                                                    href={cert.fileUrl ? (cert.fileUrl.includes('/upload/') ? cert.fileUrl.replace('/upload/', '/upload/fl_attachment/') : cert.fileUrl) : '#'}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    download={`CodeDabba_Certificate_${cert.certificateId}.pdf`}
                                                    className="flex-1 inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-amber-500 hover:text-black text-white py-2.5 rounded-xl text-sm font-semibold transition-all group-hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                                                >
                                                    Download
                                                </a>
                                                <Link
                                                    href={`/verify/certificate/${cert.certificateId}`}
                                                    className="px-4 py-2.5 border border-white/5 rounded-xl text-sm font-semibold text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                                                >
                                                    Verify
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
                
                {!loading && certificates.length === 0 && (
                    <div className="text-center py-28 bg-zinc-950/50 border border-zinc-800 rounded-3xl border-dashed">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                            <Award className="w-8 h-8 text-amber-400/50" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">No certificates yet</h2>
                        <p className="text-zinc-500 mb-2 max-w-sm mx-auto text-sm leading-relaxed">
                            Complete a course or participate in a hackathon to earn your first certificate.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
