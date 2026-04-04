"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Plus, Loader2, Calendar, Users, Award, ExternalLink, Eye, Trophy, Shield } from "lucide-react";

import { toast } from 'react-hot-toast';
import Link from "next/link";

interface Hackathon {
    id: string;
    title: string;
    status: string;
    registrationStart: string;
    registrationEnd: string;
    startDate: string;
    endDate: string;
    maxParticipants?: number;
    maxTeamSize: number;
    teamCount?: number;
    bannerUrl?: string;
    rounds: { id: string; title: string; status: string; roundNumber: number }[];
}

export default function HackathonManagement() {
    const [hackathons, setHackathons] = useState<Hackathon[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHackathons();
    }, []);

    const fetchHackathons = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/hackathons');
            setHackathons(data);
        } catch (error) {
            console.error("Failed to fetch hackathons", error);
            toast.error("Failed to load hackathons");
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            await api.patch(`/hackathons/${id}/status`, { status: newStatus });
            setHackathons(prev => prev.map(h => h.id === id ? { ...h, status: newStatus } : h));
            toast.success(`Hackathon status updated to ${newStatus.replace(/_/g, ' ')}`);
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const finalizeTeams = async (id: string) => {
        try {
            const loadingToast = toast.loading("Finalizing squads and converting individual warriors...");
            await api.post(`/hackathons/${id}/finalize-teams`);
            toast.dismiss(loadingToast);
            toast.success("Squads finalized! Moving to approval phase.");
            fetchHackathons();
        } catch (error) {
            toast.error("Failed to finalize teams");
        }
    };

    if (loading) return <div className="flex justify-center p-24"><Loader2 className="w-12 h-12 animate-spin text-pink-500" /></div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center bg-zinc-900/50 p-8 rounded-[2rem] border border-zinc-800">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Trophy className="w-6 h-6 text-pink-500" />
                        Hackathon Hub
                    </h2>
                    <p className="text-zinc-500 mt-1">Initialize and coordinate competitions</p>
                </div>
                <Link
                    href="/admin/hackathons/create"
                    className="flex items-center gap-2 px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-pink-600/20 active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    Launch Hackathon
                </Link>
            </div>

            {hackathons.length === 0 ? (
                <div className="text-center py-24 bg-zinc-900/30 border border-zinc-800 rounded-[2rem] border-dashed">
                    <Award className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-zinc-500 mb-2">No active projects</h2>
                    <p className="text-zinc-600">The arena is empty. Start your first competition.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {hackathons.map((h) => (
                        <div key={h.id} className="group bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden hover:border-pink-500/30 transition-all flex flex-col md:flex-row shadow-xl">
                            {/* Banner Small */}
                            <div className="w-full md:w-64 aspect-video md:aspect-auto bg-zinc-800 relative flex-shrink-0 border-r border-zinc-800">
                                {h.bannerUrl ? (
                                    <img src={h.bannerUrl} alt={h.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-700 font-black italic bg-zinc-900/50">
                                        CD HACK
                                    </div>
                                )}
                                <div className="absolute top-4 left-4">
                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest backdrop-blur-md border ${h.status === 'registration_open' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                        h.status === 'registration_closed' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                            h.status === 'approval_in_progress' ? 'bg-violet-500/20 text-violet-400 border-violet-500/30' :
                                                'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
                                        }`}>
                                        {h.status.replace(/_/g, ' ')}
                                    </span>
                                </div>
                            </div>

                            <div className="p-8 flex-1 flex flex-col justify-between">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-2">{h.title}</h3>
                                        <div className="flex flex-wrap gap-4 text-xs text-zinc-500 font-medium capitalize">
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-zinc-800 rounded-md border border-zinc-700">
                                                <Users className="w-3.5 h-3.5 text-pink-500" />
                                                <span className="text-white font-bold">{h.teamCount || 0}</span>
                                                <span className="text-zinc-600 font-bold uppercase"> Squads Registered</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(h.startDate).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Users className="w-3.5 h-3.5" />
                                                1-{h.maxTeamSize} Pax
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 text-zinc-400">
                                        <Link 
                                            href={`/admin/hackathons/${h.id}`} 
                                            className="px-6 py-2 bg-pink-600/10 hover:bg-pink-600 text-pink-500 hover:text-white rounded-lg transition-all border border-pink-500/20 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest"
                                            title="Hackathon Management"
                                        >
                                            <Shield className="w-4 h-4" />
                                            Manage Engine
                                        </Link>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-6 border-t border-zinc-800/50">
                                    <div className="flex gap-2">
                                        <div className="flex items-center gap-3 px-4 py-2 bg-zinc-950/50 border border-zinc-800 rounded-xl">
                                            <Shield className="w-3.5 h-3.5 text-pink-500 animate-pulse" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                                                Engine Managed Lifecycle
                                            </span>
                                        </div>
                                        {h.status === 'approval_in_progress' && (
                                            <Link
                                                href={`/admin/hackathons/${h.id}`}
                                                className="px-3 py-1.5 bg-fuchsia-600 text-white rounded-md hover:bg-fuchsia-700 transition-all text-[10px] font-black uppercase tracking-wider shadow-lg shadow-fuchsia-600/20"
                                            >
                                                Review & Approve Squads
                                            </Link>
                                        )}

                                        {h.rounds?.some(r => r.status === 'judging') && (
                                            <div className="flex gap-2">
                                                {h.rounds.filter(r => r.status === 'judging').map(r => (
                                                    <Link
                                                        key={r.id}
                                                        href={`/admin/hackathons/${h.id}`}
                                                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-all text-[10px] font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20"
                                                    >
                                                        Judging: {r.title}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Global Status</span>
                                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{h.status.replace(/_/g, ' ')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
