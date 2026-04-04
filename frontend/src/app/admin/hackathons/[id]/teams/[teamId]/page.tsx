"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from "@/context/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { NavBar } from "@/components/landing/NavBar";
import { 
    ArrowLeft, Users, UserCheck, Shield, ExternalLink, 
    FileText, CheckCircle2, XCircle, AlertCircle, 
    Trophy, Download, Play, Github, Star, Award,
    MessageSquare, Hash, Layers, Layout, ChevronRight,
    Loader2, Clock
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/axios";
import { toast } from 'react-hot-toast';

export default function TeamDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { role, user } = useAuth();
    const [team, setTeam] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('submissions');
    
    // Evaluation state
    const [showEvalModal, setShowEvalModal] = useState(false);
    const [evaluatingSubId, setEvaluatingSubId] = useState<string | null>(null);
    const [evalScore, setEvalScore] = useState(5);
    const [evalFeedback, setEvalFeedback] = useState("");
    const [submittingEval, setSubmittingEval] = useState(false);

    const hackathonId = params.id as string;
    const teamId = params.teamId as string;

    useEffect(() => {
        fetchTeamDetails();
    }, [teamId]);

    const fetchTeamDetails = async () => {
        try {
            const res = await api.get(`/hackathons/teams/${teamId}/details`);
            setTeam(res.data);
        } catch (error) {
            toast.error("Failed to intercept legion intelligence");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        try {
            await api.patch(`/hackathons/teams/${teamId}/approve`);
            toast.success("Squad status: APPROVED. Deployment cleared.");
            fetchTeamDetails();
        } catch (error) {
            toast.error("Failed to execute clearance protocol");
        }
    };

    const handleReject = async (reason: string) => {
        try {
            await api.patch(`/hackathons/teams/${teamId}/reject`, { reason });
            toast.success("Squad status: EXILED. Protocol complete.");
            fetchTeamDetails();
        } catch (error) {
            toast.error("Failed to initiate exile protocol");
        }
    };

    const handleEvaluate = async () => {
        if (!evaluatingSubId) return;
        setSubmittingEval(true);
        try {
            await api.post(`/hackathons/submissions/${evaluatingSubId}/evaluate`, {
                score: evalScore,
                feedback: evalFeedback
            });
            toast.success("Mission evaluation logged into tactical registers.");
            setShowEvalModal(false);
            fetchTeamDetails();
        } catch (error) {
            toast.error("Failed to submit evaluation data");
        } finally {
            setSubmittingEval(false);
        }
    };

    const isAssigned = team?.mentors?.some((m: any) => m.mentorId === user?.id);
    const now = new Date();
    
    // Squad Approval Phase Validation
    const isApprovalPhase = team?.hackathon?.approvalEnd 
        ? now <= new Date(team.hackathon.approvalEnd)
        : true;
        
    const canAction = role === 'MENTOR' && isAssigned && isApprovalPhase;
    const canEvaluateBase = role === 'MENTOR' && isAssigned && team?.status === 'approved' && team?.hackathon?.status === 'ROUND_EVALUATION';

    if (loading) return (
        <ProtectedRoute allowedRoles={['ADMIN', 'MENTOR']}>
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-pink-500" />
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Decoding Squad Profile...</p>
                </div>
            </div>
        </ProtectedRoute>
    );

    if (!team) return (
        <ProtectedRoute allowedRoles={['ADMIN', 'MENTOR']}>
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-zinc-900 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-zinc-500 uppercase tracking-tighter">Squad Not Found</h2>
                    <button onClick={() => router.back()} className="mt-8 text-pink-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all flex items-center gap-2 mx-auto">
                        <ArrowLeft className="w-4 h-4" />
                        Retreat to Hub
                    </button>
                </div>
            </div>
        </ProtectedRoute>
    );

    return (
        <ProtectedRoute allowedRoles={['ADMIN', 'MENTOR']}>
            <div className="min-h-screen bg-black text-white selection:bg-pink-500/30">
                <NavBar />
                
                <div className="container mx-auto px-6 py-24">
                    {/* 1. TOP BAR */}
                    <div className="flex items-center justify-between mb-12">
                        <div className="flex items-center gap-8">
                            <button 
                                onClick={() => router.back()}
                                className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all bg-zinc-900/50 px-6 py-3 rounded-xl border border-zinc-800/50"
                            >
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                Back
                            </button>
                            <div className="flex flex-col">
                                <h1 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-4">
                                    {team.name}
                                    {team.status === 'approved' && <CheckCircle2 className="w-8 h-8 text-green-500" />}
                                    {team.status === 'rejected' && <XCircle className="w-8 h-8 text-red-500" />}
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className={`px-6 py-2.5 text-[10px] font-black rounded-xl uppercase tracking-[0.2em] border transition-all flex items-center gap-2 ${
                                team.status === 'approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                team.status === 'winner' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                team.status === 'pending_approval' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                'bg-red-500/10 text-red-500 border-red-500/20'
                            }`}>
                                <div className={`w-2 h-2 rounded-full ${
                                    team.status === 'approved' ? 'bg-green-500' :
                                    team.status === 'winner' ? 'bg-amber-500' :
                                    team.status === 'pending_approval' ? 'bg-orange-500' :
                                    'bg-red-500'
                                }`}></div>
                                {team.status === 'pending_approval' ? 'Pending' :
                                 team.status === 'winner' ? (team.hackathon?.status?.toUpperCase() === 'COMPLETED' ? 'Winner (Hackathon Completed)' : 'Winner') :
                                 team.status === 'approved' ? (team.hackathon?.status?.toUpperCase() === 'COMPLETED' ? 'Approved (Hackathon Completed)' : 'Approved') : 
                                 (team.hackathon?.status?.toUpperCase() === 'COMPLETED' ? 'Eliminated (Hackathon Completed)' : 'Eliminated')}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* 2. TEAM INFO CARD (Left Sidebar) */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2rem] p-8 shadow-xl">
                                <SectionHeader icon={Users} label="The Collective" />
                                <div className="space-y-4 mt-6">
                                    {team.members?.map((m: any) => (
                                        <div key={m.id} className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black border transition-colors ${
                                                m.isTeamLead ? 'bg-pink-500/20 text-pink-500 border-pink-500/30' : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                                            }`}>
                                                {m.student?.name?.charAt(0) || 'U'}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={`text-[11px] font-black uppercase tracking-tight flex items-center gap-1.5 ${
                                                    m.isTeamLead ? 'text-white' : 'text-zinc-500'
                                                }`}>
                                                    {m.student?.name}
                                                    {m.isTeamLead && <Star className="w-3 h-3 text-pink-500 fill-pink-500" />}
                                                </span>
                                                <span className="text-[9px] text-zinc-600 font-mono lowercase">{m.student?.email}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="my-8 border-t border-zinc-800/50"></div>

                                <SectionHeader icon={UserCheck} label="Deployed Mentors" />
                                <div className="space-y-4 mt-6">
                                    {team.mentors?.length > 0 ? team.mentors.map((m: any) => (
                                        <div key={m.id} className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-[10px] font-black border border-indigo-500/20">
                                                {m.name?.charAt(0)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black uppercase tracking-tight text-white">{m.name}</span>
                                                <span className="text-[9px] text-indigo-500/60 uppercase font-black tracking-widest">Archon Assigned</span>
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-[10px] text-zinc-700 italic font-black uppercase tracking-widest text-center py-4 bg-zinc-950/30 border border-zinc-800 border-dashed rounded-xl">
                                            No Archons Assigned
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 3. MAIN CONTENT (Tabs) */}
                        <div className="lg:col-span-3 space-y-8">
                            {/* TABS HEADER */}
                            <div className="flex gap-2 p-1.5 bg-zinc-900/50 border border-zinc-800 rounded-2xl w-fit">
                                {[
                                    { id: 'submissions', label: 'Mission Hub', icon: Layout },
                                    { id: 'status', label: 'Status', icon: Shield }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                            activeTab === tab.id 
                                            ? 'bg-gradient-to-r from-pink-600 to-pink-500 text-white shadow-lg shadow-pink-600/20' 
                                            : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
                                        }`}
                                    >
                                        <tab.icon className="w-4 h-4" />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* TAB CONTENT */}
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {activeTab === 'submissions' && (
                                    <SubmissionsTab 
                                        rounds={team.roundsData} 
                                        stats={team.scoringInfo}
                                        onEvaluate={(subId: string) => {
                                            setEvaluatingSubId(subId);
                                            setEvalScore(5);
                                            setEvalFeedback("");
                                            setShowEvalModal(true);
                                        }}
                                        canEvaluate={canEvaluateBase}
                                    />
                                )}
                                {activeTab === 'status' && <StatusTab team={team} onApprove={handleApprove} onReject={handleReject} canAction={canAction} />}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tactical Evaluation Modal */}
                {showEvalModal && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl">
                            <div className="p-8 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/20">
                                <div className="flex items-center gap-3">
                                    <Award className="w-6 h-6 text-pink-500" />
                                    <h3 className="font-black text-2xl uppercase tracking-tighter text-white">Squad Assessment</h3>
                                </div>
                                <button onClick={() => setShowEvalModal(false)} className="p-2 hover:bg-zinc-800 rounded-lg transition-all">
                                    <XCircle className="w-6 h-6 text-zinc-500" />
                                </button>
                            </div>
                            
                            <div className="p-8 space-y-8">
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Combat Effectiveness (Score)</label>
                                        <div className="text-2xl font-black text-pink-500">{evalScore}<span className="text-zinc-700 text-xs lowercase">/10</span></div>
                                    </div>
                                    <input 
                                        type="range" min="0" max="10" step="0.5"
                                        value={evalScore}
                                        onChange={(e) => setEvalScore(parseFloat(e.target.value))}
                                        className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-pink-500"
                                    />
                                    <div className="flex justify-between mt-2 text-[8px] font-black text-zinc-700 uppercase tracking-widest">
                                        <span>Incompetent</span>
                                        <span>Optimal</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 block">Tactical Intel (Feedback)</label>
                                    <textarea 
                                        placeholder="Identify squad strengths and strategic failures..."
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-6 text-[11px] font-bold text-white placeholder:text-zinc-700 focus:border-pink-500 outline-none transition-all min-h-[120px] resize-none"
                                        value={evalFeedback}
                                        onChange={(e) => setEvalFeedback(e.target.value)}
                                    />
                                </div>

                                <button 
                                    onClick={handleEvaluate}
                                    disabled={submittingEval}
                                    className="w-full py-5 bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-xl shadow-pink-600/20 disabled:opacity-50"
                                >
                                    {submittingEval ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" /> Logged...
                                        </>
                                    ) : (
                                        <>
                                            <Shield className="w-4 h-4" /> Finalize Assessment
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}

function SectionHeader({ icon: Icon, label }: any) {
    return (
        <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-pink-500" />
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{label}</h3>
        </div>
    );
}

function SubmissionsTab({ rounds, stats, onEvaluate, canEvaluate }: { rounds: any[], stats: any, onEvaluate: (id: string) => void, canEvaluate: boolean }) {
    if (!rounds || rounds.length === 0) return <EmptyTab icon={FileText} message="No missions logged in deployment logs." />;

    const s = stats || { roundScore: 0, weightedScore: 0, totalScore: 0 };

    return (
        <div className="space-y-12">
            {/* 1. Performance Overview - Single Large Cumulative Score */}
            <div className="bg-zinc-900/50 border border-zinc-800 p-12 rounded-[2.5rem] flex flex-col items-center text-center relative overflow-hidden group shadow-2xl">
                 <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent opacity-20"></div>
                 <Trophy className="w-8 h-8 mb-4 text-pink-500 opacity-40 transition-transform group-hover:scale-110" />
                 <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] mb-4">Total Protocol Points (All Rounds)</p>
                 <div className="text-8xl font-black text-pink-500 tracking-tighter transition-transform duration-500 group-hover:scale-105">
                    {s.totalScore?.toFixed(1) || '0.0'}
                 </div>
                 <div className="mt-8 h-1 w-24 bg-zinc-800 rounded-full group-hover:w-48 transition-all duration-500"></div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
                <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Tactical visibility engaged. All submission cycles synchronized.
                </span>
            </div>
            {rounds.map((round: any, rIdx: number) => (
                <div key={rIdx} className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-zinc-800"></div>
                        <h4 className="text-[13px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-3">
                            Round {round.roundNumber}: {round.title}
                        </h4>
                        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-zinc-800"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {(!round.submissions || round.submissions.length === 0) ? (
                            <div className="p-8 bg-zinc-900/50 border border-zinc-800 border-dashed rounded-[2rem] text-center ext-zinc-500 col-span-1 md:col-span-2">
                                <FileText className="w-8 h-8 mx-auto mb-4 opacity-20" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">No submission</p>
                                {canEvaluate && (
                                    <div className="inline-flex items-center gap-2 px-4 py-3 bg-zinc-900 border border-zinc-800 text-zinc-500 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-not-allowed">
                                        <Shield className="w-3.5 h-3.5" /> Scoring locked
                                    </div>
                                )}
                            </div>
                        ) : round.submissions.map((sub: any) => (
                            <div key={sub.id} className={`p-8 bg-zinc-900 border rounded-[2rem] shadow-xl relative overflow-hidden transition-all hover:scale-[1.02] ${
                                sub.isFinal ? 'border-indigo-500 shadow-indigo-500/5 bg-indigo-500/[0.02]' : 'border-zinc-800'
                            }`}>
                                {sub.isFinal && (
                                    <div className="absolute top-0 right-0 px-6 py-2 bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest rounded-bl-2xl flex items-center gap-2">
                                        <Star className="w-3 h-3 fill-white" /> Final Artifact
                                    </div>
                                )}
                                
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-6">
                                            <div className="px-6 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-inner flex flex-col items-center group-hover:border-pink-500/20 transition-all duration-500">
                                                <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest mb-1">Combat Rating</p>
                                                <p className={`text-2xl font-black ${sub.score ? 'text-pink-500' : 'text-zinc-800'}`}>
                                                    {sub.score ? sub.score.toFixed(1) : '---'}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <h5 className="text-[14px] font-black text-white uppercase tracking-tight flex items-center gap-3">
                                                    RECORD 
                                                    <span className={`text-[8px] px-2 py-0.5 rounded border font-black tracking-[0.2em] ${
                                                        sub.score ? 'bg-pink-600/20 text-pink-500 border-pink-500/30' : 'bg-zinc-800 text-zinc-600 border-zinc-700 opacity-50'
                                                    }`}>
                                                        {sub.score ? 'VERIFIED' : 'PENDING'}
                                                    </span>
                                                </h5>
                                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">MISSION ARTIFACT #{sub.id.split('-')[0]}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Protocol Timestamp</p>
                                            <p className="text-[11px] font-bold text-zinc-400 mt-1">
                                                {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : 
                                                 (sub.createdAt ? new Date(sub.createdAt).toLocaleString() : 'N/A')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-y border-zinc-800/80 p-6 bg-zinc-950/20 rounded-[2.5rem]">
                                        {/* Deployment Intel (Description) */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-700"></div>
                                                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.3em]">Deployment Intel (Mission Artifact Report)</p>
                                            </div>
                                            <p className="text-[12px] text-zinc-400 font-bold leading-relaxed border-l-2 border-zinc-800/50 pl-4 py-1 italic">
                                                {sub.description || 'No operational intel provided with this artifact submission.'}
                                            </p>
                                        </div>
                                        
                                        {/* Strategic Feedback (Mentor) */}
                                        <div className={`p-6 rounded-[2rem] space-y-4 transition-all duration-500 ${
                                            sub.feedback 
                                                ? 'bg-pink-600/5 border border-pink-500/20 shadow-lg shadow-pink-500/5' 
                                                : 'bg-zinc-950/40 border border-zinc-800 border-dashed opacity-40 hover:opacity-100 hover:border-zinc-700 hover:bg-zinc-800/10'
                                        }`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-1.5 h-1.5 rounded-full ${sub.feedback ? 'bg-pink-500' : 'bg-zinc-800'}`}></div>
                                                <p className={`text-[8px] font-black uppercase tracking-[0.3em] ${sub.feedback ? 'text-pink-500' : 'text-zinc-700'}`}>Archon Strategic Review</p>
                                            </div>
                                            {sub.feedback ? (
                                                <p className="text-[12px] text-white font-black leading-relaxed italic border-l-2 border-pink-500/30 pl-4">
                                                    "{sub.feedback}"
                                                </p>
                                            ) : (
                                                <p className="text-[11px] text-zinc-700 font-bold italic pl-4">
                                                    Scoring cycle in progress. Feedback pending Archon review.
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 pt-4 border-t border-zinc-800">
                                        {canEvaluate && (
                                            (() => {
                                                const isBeforeEnd = !round.evaluationEnd || new Date() <= new Date(round.evaluationEnd);
                                                const isAfterStart = !round.evaluationStart || new Date() >= new Date(round.evaluationStart);
                                                const isWithinWindow = isBeforeEnd && isAfterStart;

                                                return isWithinWindow ? (
                                                    <button 
                                                        onClick={() => onEvaluate(sub.id)}
                                                        className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-pink-600 to-pink-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-pink-600/20"
                                                    >
                                                        <Award className="w-3.5 h-3.5" /> Scoring enabled
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border border-zinc-800 text-zinc-500 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-not-allowed">
                                                        <Shield className="w-3.5 h-3.5" /> Scoring locked
                                                    </div>
                                                );
                                            })()
                                        )}
                                        {sub.githubLink && (
                                            <Link href={sub.githubLink} target="_blank" className="flex items-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-white hover:text-black rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">
                                                <Github className="w-3.5 h-3.5" /> View Github
                                            </Link>
                                        )}
                                        {sub.videoUrl && (
                                            <Link href={sub.videoUrl} target="_blank" className="flex items-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-pink-600 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">
                                                <Play className="w-3.5 h-3.5" /> Watch Video
                                            </Link>
                                        )}
                                        {sub.zipUrl && (
                                            <Link href={sub.zipUrl} target="_blank" className="flex items-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-indigo-600 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">
                                                <Download className="w-3.5 h-3.5" /> Download ZIP
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}



function StatusTab({ team, onApprove, onReject, canAction }: { team: any, onApprove: () => void, onReject: (r: string) => void, canAction: boolean }) {
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [reason, setReason] = useState("");

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className={`p-12 border rounded-[3rem] shadow-2xl text-center space-y-8 overflow-hidden relative ${
                team.status === 'approved' ? 'bg-green-500/5 border-green-500/20' :
                team.status === 'winner' ? 'bg-amber-500/5 border-amber-500/20' :
                team.status === 'pending_approval' ? 'bg-orange-500/5 border-orange-500/20' :
                'bg-red-500/5 border-red-500/20'
            }`}>
                <div className={`text-9xl font-black uppercase tracking-tighter opacity-[0.02] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap`}>
                    {team.status.replace('_', ' ')}
                </div>

                <div className="relative z-10 flex flex-col items-center">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-8 shadow-2xl transition-transform hover:scale-110 duration-500 ${
                        team.status === 'approved' ? 'bg-green-500 shadow-green-500/20' :
                        team.status === 'winner' ? 'bg-amber-500 shadow-amber-500/20' :
                        team.status === 'pending_approval' ? 'bg-orange-500 shadow-orange-500/20' :
                        'bg-red-500 shadow-red-500/20'
                    }`}>
                        {team.status === 'approved' ? <CheckCircle2 className="w-12 h-12 text-white" /> :
                         team.status === 'winner' ? <Trophy className="w-12 h-12 text-white" /> :
                         team.status === 'pending_approval' ? <Clock className="w-12 h-12 text-white" /> :
                         <XCircle className="w-12 h-12 text-white" />}
                    </div>
                    
                    <p className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.5em] mb-4">Deployment Protocol Status</p>
                    <h4 className={`text-5xl font-black uppercase tracking-tighter mb-4 ${
                        team.status === 'approved' ? 'text-green-500' :
                        team.status === 'winner' ? 'text-amber-500' :
                        team.status === 'pending_approval' ? 'text-orange-500' :
                        'text-red-500'
                    }`}>
                        {team.status === 'pending_approval' ? 'Awaiting Clearance' :
                         team.status === 'winner' ? (team.hackathon?.status?.toUpperCase() === 'COMPLETED' ? 'Winner (Hackathon Completed)' : 'Winner') :
                         team.status === 'approved' ? (team.hackathon?.status?.toUpperCase() === 'COMPLETED' ? 'Approved (Hackathon Completed)' : 'Approved') : 
                         (team.hackathon?.status?.toUpperCase() === 'COMPLETED' ? 'Eliminated (Hackathon Completed)' : 'Eliminated')}
                    </h4>

                    {team.status === 'pending_approval' && !showRejectForm && (
                        <div className="flex flex-col items-center mt-12 w-full max-w-sm">
                            {canAction ? (
                                <div className="flex gap-4 w-full">
                                    <button 
                                        onClick={onApprove}
                                        className="flex-1 py-4 bg-green-600 hover:bg-green-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-green-600/20 transition-all active:scale-95"
                                    >
                                        Grant Clearance
                                    </button>
                                    <button 
                                        onClick={() => setShowRejectForm(true)}
                                        className="flex-1 py-4 bg-zinc-900 border border-zinc-800 hover:bg-red-600 hover:border-red-600 text-zinc-400 hover:text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all active:scale-95"
                                    >
                                        Deny Protocol
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-zinc-950/50 border border-zinc-900/50 p-6 rounded-2xl w-full flex flex-col items-center gap-4">
                                    <Shield className="w-8 h-8 text-zinc-800" />
                                    <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest text-center leading-relaxed">
                                        Tactical observation mode active. Recruitment protocols are managed by assigned Archons.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {showRejectForm && (
                        <div className="mt-12 w-full space-y-4 animate-in slide-in-from-top-4 duration-300">
                            <textarea 
                                placeholder="State reason for denial..." 
                                className="w-full bg-black/40 border border-zinc-800 rounded-2xl p-6 text-sm font-bold text-white outline-none focus:border-red-500 transition-all placeholder:text-zinc-700"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={3}
                            />
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => { onReject(reason); setShowRejectForm(false); }}
                                    disabled={!reason.trim()}
                                    className="flex-1 py-4 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
                                >
                                    Confirm Exile
                                </button>
                                <button 
                                    onClick={() => setShowRejectForm(false)}
                                    className="px-8 py-4 bg-zinc-800 text-zinc-400 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-zinc-700 transition-all"
                                >
                                    Abort
                                </button>
                            </div>
                        </div>
                    )}

                    {team.rejectReason && (
                        <div className="mt-12 bg-black/40 border border-zinc-800 p-10 rounded-[2.5rem] text-left w-full shadow-inner">
                            <p className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                <AlertCircle className="w-4 h-4 text-red-500" /> Exile Protocol Reasoning
                            </p>
                            <p className="text-zinc-300 text-sm leading-relaxed font-bold italic border-l-2 border-red-500/30 pl-6">
                                "{team.rejectReason}"
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function EmptyTab({ icon: Icon, message }: any) {
    return (
        <div className="py-32 text-center bg-zinc-900/30 border border-zinc-800 border-dashed rounded-[3rem]">
            <Icon className="w-16 h-16 text-zinc-800 mx-auto mb-6 transition-transform hover:scale-110 duration-700" />
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">{message}</p>
        </div>
    );
}
