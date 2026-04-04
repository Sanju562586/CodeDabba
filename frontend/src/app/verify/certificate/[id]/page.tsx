"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { NavBar } from "@/components/landing/NavBar";
import api from "@/lib/axios";
import { CheckCircle2, ShieldAlert, Award, Calendar, FileText, User as UserIcon } from "lucide-react";

export default function VerificationPage() {
    const { id } = useParams();
    const [cert, setCert] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (id) {
            api.get(`/certificates/verify/${id}`)
                .then(res => {
                    setCert(res.data);
                    setLoading(false);
                })
                .catch(() => {
                    setError(true);
                    setLoading(false);
                });
        }
    }, [id]);

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-6"></div>
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] animate-pulse">Syncing with Registry...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white selection:bg-amber-500/30">
            <NavBar />
            <div className="container mx-auto px-6 py-32 flex flex-col items-center">
                
                {error ? (
                    <div className="max-w-md w-full bg-zinc-900/50 border border-red-500/20 rounded-[2.5rem] p-12 text-center shadow-2xl backdrop-blur-xl">
                        <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8">
                            <ShieldAlert className="w-10 h-10 text-red-500" />
                        </div>
                        <h1 className="text-3xl font-black italic uppercase italic tracking-tighter mb-4 text-red-400">UNVERIFIED RECORD</h1>
                        <p className="text-zinc-500 font-medium mb-8">This certification reference does not exist in the official CodeDabba achievement registry.</p>
                        <div className="text-[10px] font-mono text-zinc-700 bg-black/40 p-3 rounded-xl border border-white/5">{id}</div>
                    </div>
                ) : (
                    <div className="max-w-4xl w-full">
                        <div className="text-center mb-16">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full mb-6">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-green-500 italic">Verified Achievement Record</span>
                            </div>
                            <h1 className="text-5xl font-black italic uppercase italic tracking-tighter mb-4">Tactical Certification</h1>
                            <p className="text-zinc-500 uppercase text-[10px] font-black tracking-[0.3em]">Official Verification Registry for CodeDabba Protocols</p>
                        </div>

                        <div className="grid lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                <section className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-10 hover:bg-zinc-900/80 transition-all backdrop-blur-md">
                                    <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-8 border-b border-white/5 pb-4">Tactical Details</h2>
                                    
                                    <div className="grid md:grid-cols-2 gap-10">
                                        <div className="space-y-6">
                                            <div className="flex gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-center justify-center flex-shrink-0">
                                                    <UserIcon className="w-5 h-5 text-amber-500" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Certified Operative</p>
                                                    <p className="text-xl font-bold text-zinc-200">{cert.user.name}</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-violet-500/5 border border-violet-500/10 flex items-center justify-center flex-shrink-0">
                                                    <Award className="w-5 h-5 text-violet-500" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Protocol Achievement</p>
                                                    <p className="text-xl font-bold text-zinc-200 uppercase tracking-tight italic">
                                                        {cert.type === 'winner' ? `${cert.position} Place` : 'Tactical Completion'}
                                                    </p>
                                                    <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">Status: {cert.type}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="flex gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-fuchsia-500/5 border border-fuchsia-500/10 flex items-center justify-center flex-shrink-0">
                                                    <Calendar className="w-5 h-5 text-fuchsia-500" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Issue Date</p>
                                                    <p className="text-xl font-bold text-zinc-200">
                                                        {new Date(cert.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                                    <FileText className="w-5 h-5 text-emerald-500" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Hackathon Mission</p>
                                                    <p className="text-xl font-bold text-zinc-200">{cert.hackathon.title}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <div className="space-y-8 flex flex-col items-center">
                                <div className="p-4 bg-white rounded-2xl shadow-2xl shadow-white/5 border-4 border-amber-500/20">
                                    <img 
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://codedabba.com/verify/certificate/${id}`} 
                                        alt="Verification QR" 
                                        className="w-40 h-40"
                                    />
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Registry Reference ID</p>
                                    <p className="text-sm font-mono text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 px-6 py-2 rounded-xl text-center">
                                        {cert.certificateId}
                                    </p>
                                </div>
                                <a 
                                    href={cert.fileUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="w-full py-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs font-black italic uppercase tracking-widest text-zinc-300 hover:bg-zinc-800 transition-all text-center flex items-center justify-center gap-2 group"
                                >
                                    <FileText className="w-4 h-4 group-hover:text-amber-500 transition-colors" />
                                    Download Original PDF
                                </a>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-32 text-center opacity-30">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500">Official Certification Protocol of CodeDabba. Issued via secure tactical registry.</p>
                </div>

            </div>
        </div>
    );
}
