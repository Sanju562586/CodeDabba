"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Trophy, Clock, Filter, Globe } from "lucide-react";
import api from "@/lib/axios";

interface MentorHackathon {
    id: string;
    title: string;
    status: string;
    assignmentType: string;
    startDate: string;
    endDate: string;
}

export default function MentorHackathonsPage() {
    const [hackathons, setHackathons] = useState<MentorHackathon[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHackathons();
    }, []);

    const fetchHackathons = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/hackathons/mentor/hackathons');
            setHackathons(data);
        } catch (error) {
            console.error("Failed to fetch hackathons", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <div className="container mx-auto px-6 py-24">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400 flex items-center gap-4">
                            <Trophy className="w-8 h-8 text-emerald-500" />
                            Ongoing Operations
                        </h1>
                        <p className="text-zinc-400 mt-2">Validate squads and provide technical oversight during hackathons.</p>
                    </div>
                    <div className="p-3 bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors cursor-pointer">
                        <Filter className="w-5 h-5 text-zinc-400" />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-24">
                        <Clock className="w-12 h-12 animate-pulse text-emerald-500" />
                    </div>
                ) : hackathons.length === 0 ? (
                    <div className="text-center py-32 bg-zinc-900/30 border border-zinc-800 rounded-3xl border-dashed">
                        <Clock className="w-16 h-16 text-zinc-800 mx-auto mb-6" />
                        <h3 className="text-xl font-bold text-white mb-2">No Missions Assigned</h3>
                        <p className="text-zinc-500">Waiting for deployment orders from HQ...</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {hackathons.map((h) => (
                            <Link key={`${h.id}-${h.assignmentType}`} href={`/mentor/hackathons/${h.id}`} className="group flex flex-col md:flex-row items-center gap-8 p-8 bg-zinc-900/40 backdrop-blur-md border border-zinc-800 rounded-3xl hover:border-emerald-500/40 transition-all hover:bg-zinc-900/80 shadow-xl">
                                <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500/20 transition-all border border-emerald-500/20 group-hover:scale-105">
                                    <Globe className="w-10 h-10 group-hover:rotate-12 transition-transform" />
                                </div>

                                <div className="flex-1 text-center md:text-left">
                                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3">
                                        <span className="px-3 py-1 bg-zinc-800/80 text-zinc-300 text-[10px] font-bold uppercase tracking-widest rounded-full border border-zinc-700">
                                            {h.status?.replace(/_/g, ' ') || 'ACTIVE'}
                                        </span>
                                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-emerald-500/20">
                                            {h.assignmentType} Scope
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors">{h.title}</h3>
                                    <p className="text-zinc-500 text-xs font-medium mt-2">ID: {h.id?.split('-')[0] || 'N/A'}</p>
                                </div>

                                <div className="flex flex-col items-center md:items-end gap-4 w-full md:w-auto mt-4 md:mt-0 pt-6 md:pt-0 border-t md:border-t-0 border-zinc-800">
                                    <div className="flex items-center gap-2 px-6 py-3 bg-black/40 border border-zinc-800 rounded-xl group-hover:border-emerald-500/50 transition-colors">
                                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                                            View Hubs <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
