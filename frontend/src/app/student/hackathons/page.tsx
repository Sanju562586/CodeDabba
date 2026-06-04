"use client";

import { useState, useEffect } from "react";
import { Loader2, Trophy, Users as UsersIcon, Calendar, ArrowRight, Sparkles } from "lucide-react";
import api from "@/lib/axios";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";

interface HackathonRegistration {
    id: string;
    hackathon: {
        id: string;
        title: string;
        bannerUrl?: string;
        startDate: string;
        status: string;
    };
    registrationType: 'individual' | 'team';
    teamName?: string;
    isTeamLead: boolean;
    teamMembers?: {
        id: string;
        name: string;
        email: string;
        isTeamLead: boolean;
    }[];
}

export default function StudentHackathonsPage() {
    const [myHackathons, setMyHackathons] = useState<HackathonRegistration[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyHackathons = async () => {
            try {
                const { data } = await api.get('/hackathons/mine/registrations');
                setMyHackathons(data);
            } catch (error) {
                console.error("Failed to fetch hackathons", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMyHackathons();
    }, []);

    const handleGenerateCertificate = async (hackathonId: string) => {
        const loadingToast = toast.loading("Generating your certificate...");
        try {
            await api.post(`/certificates/${hackathonId}`);
            toast.success("Certificate generated! Check your dashboard.", { id: loadingToast });
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to generate certificate.", { id: loadingToast });
        }
    };

    return (
        <div className="w-full">
            <div className="container mx-auto px-6 py-28">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-10"
                >
                    <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
                        <Trophy className="w-8 h-8 text-fuchsia-500" />
                        My Hackathons
                    </h1>
                    <p className="text-zinc-500 text-sm mt-2">Manage your hackathon participations and teams.</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    {loading ? (
                        <div className="flex justify-center py-24">
                            <Loader2 className="w-8 h-8 animate-spin text-fuchsia-500" />
                        </div>
                    ) : myHackathons.length > 0 ? (
                        <div className="grid md:grid-cols-2 gap-6">
                            {myHackathons.map((reg, i) => (
                                <motion.div
                                    key={reg.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.08 }}
                                    className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl overflow-hidden hover:border-fuchsia-500/40 transition-all group shadow-xl hover:shadow-fuchsia-500/10"
                                >
                                    <div className="h-40 bg-zinc-800 relative overflow-hidden">
                                        {reg.hackathon.bannerUrl ? (
                                            <img src={reg.hackathon.bannerUrl} alt={reg.hackathon.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-fuchsia-900/30 to-purple-900/20">
                                                <Trophy className="w-12 h-12 text-fuchsia-500/30" />
                                            </div>
                                        )}
                                        <div className="absolute top-4 right-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${reg.hackathon.status === 'registration_open' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : reg.hackathon.status === 'completed' ? 'bg-zinc-800/80 text-zinc-400 border-white/10' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                                {reg.hackathon.status === 'registration_open' ? 'Registration Open' : reg.hackathon.status === 'completed' ? 'Completed' : 'In Progress'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-fuchsia-300 transition-colors leading-snug">
                                            {reg.hackathon.title}
                                        </h3>

                                        <div className="flex flex-wrap gap-4 mb-4 text-xs text-zinc-500">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-violet-400" />
                                                {new Date(reg.hackathon.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <UsersIcon className="w-3.5 h-3.5 text-fuchsia-400" />
                                                {reg.registrationType === 'individual' ? 'Individual' : `Team: ${reg.teamName}`}
                                            </div>
                                        </div>

                                        {reg.registrationType === 'team' && reg.teamMembers && (
                                            <div className="mb-5 p-3 bg-black/30 rounded-xl border border-white/5">
                                                <p className="text-xs text-zinc-600 uppercase tracking-wider mb-2 font-semibold">Team Members</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {reg.teamMembers.map(m => (
                                                        <div key={m.id} title={m.email} className={`px-3 py-1 rounded-lg text-xs font-medium border ${m.isTeamLead ? 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20' : 'bg-zinc-800/50 text-zinc-400 border-white/5'}`}>
                                                            {m.name} {m.isTeamLead && '👑'}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-3">
                                            <Link href={`/hackathons/${reg.hackathon.id}/team`} className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-semibold transition-colors text-center flex items-center justify-center gap-2">
                                                View Details <ArrowRight className="w-3.5 h-3.5" />
                                            </Link>

                                            {reg.hackathon.status === 'completed' && (
                                                <button
                                                    onClick={() => handleGenerateCertificate(reg.hackathon.id)}
                                                    className="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-500 rounded-xl text-sm font-bold transition-all"
                                                >
                                                    Get Certificate
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-28 bg-zinc-950/50 border border-zinc-800 rounded-3xl border-dashed">
                            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center">
                                <Trophy className="w-8 h-8 text-fuchsia-400/50" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">No hackathons joined yet</h3>
                            <p className="text-zinc-500 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
                                Join a hackathon to challenge yourself, collaborate with others, and build something amazing in a limited time.
                            </p>
                            <Link href="/hackathons" className="px-8 py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl font-semibold transition-all shadow-xl shadow-fuchsia-600/20 inline-flex items-center gap-2">
                                <Trophy className="w-4 h-4" />
                                Browse Hackathons
                            </Link>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
