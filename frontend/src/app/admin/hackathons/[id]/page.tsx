"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from "@/context/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { NavBar } from "@/components/landing/NavBar";
import { 
    Users, Trophy, FileText, Settings, Shield, Clock, 
    ArrowLeft, CheckCircle2, XCircle, AlertCircle, 
    ExternalLink, Search, Filter, Mail, Award,
    LogOut, MoreHorizontal, Download, Eye, Edit3,
    Calendar, UserCheck, MessageSquare, Plus, Loader2
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/axios";
// Custom formatter to replace date-fns (fixing build error)
const formatDate = (date: any, formatStr: string = 'MMM dd, HH:mm') => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'TBD';
    
    if (formatStr === 'PPP') return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    if (formatStr === 'HH:mm:ss, PPP') return `${d.toLocaleTimeString()}, ${d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}`;
    
    return d.toLocaleString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', '');
};
import toast from "react-hot-toast";

type TabType = 'overview' | 'teams' | 'leaderboard' | 'mentors' | 'activity';

interface HackathonStats {
    totalParticipants: number;
    totalTeams: number;
    approvedTeams: number;
    rejectedTeams: number;
    eliminatedTeams: number;
    pendingTeams: number;
    activeTeams: number;
}

export default function AdminHackathonDetailPage() {
    return (
        <ProtectedRoute allowedRoles={['ADMIN', 'MENTOR']}>
            <AdminHackathonDetailContent />
        </ProtectedRoute>
    );
}

function AdminHackathonDetailContent() {
    const { id } = useParams();
    const router = useRouter();
    const { role, user } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [hackathon, setHackathon] = useState<any>(null);
    const [stats, setStats] = useState<HackathonStats | null>(null);
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setMounted(true);
        fetchOverview();
    }, [id]);

    const fetchOverview = async () => {
        try {
            const url = `/hackathons/${id}/admin-stats`;
            console.log(`[DEBUG] Fetching dashboard from: ${api.defaults.baseURL}${url}`);
            const res = await api.get(url);
            setHackathon(res.data);
            setStats(res.data.stats);
        } catch (error: any) {
            console.error(`[CRITICAL] Dashboard fetch failed with status ${error.response?.status}:`, error.message);
            toast.error("Failed to load dashboard - Operational failure logged.");
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return <div className="min-h-screen bg-black" />; // Prevent hydration mismatch
    
    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-black uppercase tracking-widest animate-pulse">Initializing Command Center...</div>;

    if (!hackathon) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6">
                <Shield className="w-16 h-16 text-pink-500 mb-6 animate-pulse" />
                <h1 className="text-4xl font-black uppercase tracking-widest mb-4">Command Failure</h1>
                <p className="text-zinc-500 font-black uppercase tracking-widest max-w-md text-center">
                    The requested data for ID <span className="text-zinc-300">{id}</span> was not detected. 
                    Authorization may have expired or the hackathon is non-existent.
                </p>
                <Link href="/admin/hackathons" className="mt-12 px-8 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400 font-black uppercase tracking-widest hover:text-white hover:bg-zinc-800 transition-all">
                    Relocate Hub
                </Link>
            </div>
        );
    }

    const TabButton = ({ id, label, icon: Icon }: { id: TabType, label: string, icon: any }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-6 py-4 font-black text-[10px] uppercase tracking-widest transition-all border-b-2 ${
                activeTab === id 
                ? "border-pink-500 text-pink-500 bg-pink-500/5 shadow-[inset_0_-10px_20px_-10px_rgba(236,72,153,0.1)]" 
                : "border-transparent text-zinc-500 hover:text-white"
            }`}
        >
            <Icon className="w-3.5 h-3.5" />
            {label}
        </button>
    );

    return (
        <div className="min-h-screen bg-black text-white selection:bg-pink-500 selection:text-white pb-24">
                <NavBar />
                
                <div className="pt-24 pb-12 px-6 container mx-auto">
                    {/* Header (Top Strip) */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 py-6 border-b border-zinc-800/50">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <h1 className="text-3xl font-bold tracking-tight text-white">{hackathon?.title}</h1>
                            <span className={`px-4 py-1 text-[10px] font-black rounded-full uppercase tracking-widest border transition-all shadow-lg ${
                                hackathon?.status === 'registration_open' ? "bg-orange-500/10 text-orange-400 border-orange-500/30 shadow-orange-500/5" :
                                (hackathon?.status === 'active' || hackathon?.status === 'round_active') ? "bg-green-500/10 text-green-400 border-green-500/30 shadow-green-500/5" :
                                hackathon?.status === 'completed' ? "bg-red-500/10 text-red-400 border-red-500/30 shadow-red-500/5" :
                                "bg-zinc-800/50 text-zinc-500 border-zinc-700/50"
                            }`}>
                                {hackathon?.status === 'registration_open' ? 'REGISTRATION' : 
                                 (hackathon?.status === 'active' || hackathon?.status === 'round_active') ? 'ACTIVE' : 
                                 hackathon?.status === 'completed' ? 'COMPLETED' : 
                                 hackathon?.status.replace('_', ' ').toUpperCase()}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5 text-zinc-600" />
                            <p className="text-zinc-600 text-[10px] font-medium tracking-widest uppercase">ID: <span className="text-zinc-500 font-mono lowercase">{id}</span></p>
                        </div>
                    </div>

                    {/* Dashboard Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
                        <SimpleStatCard label="Teams" value={stats?.totalTeams || 0} icon={Trophy} color="text-pink-500" />
                        <SimpleStatCard label="Participants" value={stats?.totalParticipants || 0} icon={Users} color="text-blue-500" />
                        <SimpleStatCard label="Pending" value={stats?.pendingTeams || 0} icon={Clock} color="text-orange-500" />
                        <SimpleStatCard label="Approved" value={stats?.approvedTeams || 0} icon={CheckCircle2} color="text-green-500" />
                        <SimpleStatCard label="Eliminated" value={stats?.eliminatedTeams || 0} icon={XCircle} color="text-red-500" />
                    </div>

                    {/* Hackathon Details Section (Read-only) */}
                    <div className="mb-12">
                        <div className="flex items-center gap-4 mb-8">
                            <h2 className="text-xl font-bold text-white">Hackathon Details</h2>
                            <div className="h-px flex-1 bg-zinc-800/50"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Basic Info Card */}
                            <DetailCard title="Basic Info" icon={FileText}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Title</label>
                                        <p className="text-sm font-medium text-zinc-300 mt-1">{hackathon.title}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Description</label>
                                        <p className="text-xs text-zinc-400 mt-1 line-clamp-3 leading-relaxed">{hackathon.description || "N/A"}</p>
                                    </div>
                                    {hackathon.theme && (
                                        <div>
                                            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Theme</label>
                                            <p className="text-sm font-medium text-zinc-300 mt-1">{hackathon.theme}</p>
                                        </div>
                                    )}
                                </div>
                            </DetailCard>

                            {/* Timeline Card */}
                            <DetailCard title="Timeline" icon={Calendar}>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                                        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Registration Start</span>
                                        <span className="text-xs text-zinc-300 font-bold">{formatDate(new Date(hackathon.registrationStart), 'PPP')}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                                        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Registration End</span>
                                        <span className="text-xs text-zinc-300 font-bold">{formatDate(new Date(hackathon.registrationEnd), 'PPP')}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                                        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Hackathon Start</span>
                                        <span className="text-xs text-zinc-300 font-bold">{formatDate(new Date(hackathon.startDate), 'PPP')}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Hackathon End</span>
                                        <span className="text-xs text-zinc-300 font-bold">{formatDate(new Date(hackathon.endDate), 'PPP')}</span>
                                    </div>
                                </div>
                            </DetailCard>

                            {/* Participation Rules Card */}
                            <DetailCard title="Participation Rules" icon={Users}>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                                        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Team Size</span>
                                        <span className="text-xs text-zinc-300 font-bold">{hackathon.maxTeamSize === 1 ? 'Solo Only' : `1 - ${hackathon.maxTeamSize} Members`}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                                        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Solo Allowed</span>
                                        <span className={`text-xs font-bold ${hackathon.allowIndividual ? 'text-green-500' : 'text-zinc-500'}`}>{hackathon.allowIndividual ? 'YES' : 'NO'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Teams Allowed</span>
                                        <span className={`text-xs font-bold ${hackathon.allowTeam ? 'text-green-500' : 'text-zinc-500'}`}>{hackathon.allowTeam ? 'YES' : 'NO'}</span>
                                    </div>
                                    {hackathon.maxParticipants && (
                                        <div className="flex justify-between items-center py-2 border-t border-zinc-800/50">
                                            <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Global Capacity</span>
                                            <span className="text-xs text-zinc-300 font-bold">{hackathon.maxParticipants} Individuals</span>
                                        </div>
                                    )}
                                </div>
                            </DetailCard>

                            {/* Rounds Info Card */}
                            <DetailCard title="Rounds Info" icon={Award}>
                                <div className="space-y-4">
                                    {hackathon.rounds.sort((a: any, b: any) => a.roundNumber - b.roundNumber).map((round: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center py-2 border-b border-zinc-800/50 last:border-0">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-zinc-300 uppercase tracking-tight">{round.title}</span>
                                                <span className="text-[10px] text-zinc-500 font-medium mt-0.5">{round.isElimination ? 'Elimination' : 'Submission'} Round</span>
                                            </div>
                                            <span className="text-xs font-black text-pink-500">{round.weightagePercentage}%</span>
                                        </div>
                                    ))}
                                </div>
                            </DetailCard>

                            {/* Submission Requirements Card */}
                            <DetailCard title="Submission Requirements" icon={Settings}>
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-2">
                                        <RequirementItem label="GitHub Repository" active={hackathon.rounds.some((r: any) => r.allowGithub)} />
                                        <RequirementItem label="Pitch Video" active={hackathon.rounds.some((r: any) => r.allowVideo)} />
                                        <RequirementItem label="Source (Zip) Upload" active={hackathon.rounds.some((r: any) => r.allowZip)} />
                                        <RequirementItem label="Detailed Description" active={hackathon.rounds.some((r: any) => r.allowDescription)} />
                                    </div>
                                </div>
                            </DetailCard>
                        </div>
                    </div>


                    {/* Navigation Tabs */}
                    <div className="flex border-b border-zinc-800 mb-12 overflow-x-auto scroller-hidden gap-2">
                        <TabButton id="overview" label="Hackathon" icon={AlertCircle} />
                        <TabButton id="teams" label="The Legions" icon={Users} />
                        <TabButton id="leaderboard" label="War Room" icon={Award} />
                        {role === 'ADMIN' && <TabButton id="mentors" label="Archons" icon={UserCheck} />}
                        <TabButton id="activity" label="Scroll of Truth (Activity)" icon={Clock} />
                    </div>

                    {/* Content Section */}
                    <div className="min-h-[400px]">
                        {activeTab === 'overview' && <OverviewTab hackathon={hackathon} stats={stats} onSync={fetchOverview} />}
                        {activeTab === 'teams' && <TeamsTab hackathonId={id as string} />}
                        {activeTab === 'leaderboard' && <LeaderboardTab hackathonId={id as string} rounds={hackathon.rounds} />}
                        {activeTab === 'mentors' && <MentorsTab hackathonId={id as string} onSync={fetchOverview} />}
                        {activeTab === 'activity' && <ActivityTab hackathonId={id as string} />}
                    </div>
                </div>
            </div>
    );
}

function SimpleStatCard({ label, value, icon: Icon, color }: any) {
    return (
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 transition-all hover:bg-zinc-900">
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg bg-zinc-950/50 border border-zinc-800 ${color}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{label}</span>
            </div>
            <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
        </div>
    );
}

function DetailCard({ title, icon: Icon, children }: any) {
    return (
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-6">
                <Icon className="w-4 h-4 text-zinc-500" />
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">{title}</h3>
            </div>
            <div className="flex-1">
                {children}
            </div>
        </div>
    );
}

function RequirementItem({ label, active }: { label: string, active: boolean }) {
    return (
        <div className="flex items-center gap-3 py-2">
            <div className={`p-1 rounded-md border ${active ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-zinc-800 border-zinc-700 text-zinc-600 grayscale'}`}>
                {active ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
            </div>
            <span className={`text-[11px] font-bold uppercase tracking-wider ${active ? 'text-zinc-300' : 'text-zinc-600'}`}>
                {label}
            </span>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color }: any) {
    return (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center group hover:border-zinc-700 transition-all hover:bg-zinc-900/60 shadow-lg">
            <div className={`p-2 rounded-lg bg-zinc-950 border border-zinc-800 mb-3 group-hover:scale-110 transition-transform ${color}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="text-3xl font-black tracking-tighter leading-none">{value}</div>
            <div className="text-[9px] uppercase font-black text-zinc-500 tracking-[0.2em] mt-3">{label}</div>
        </div>
    );
}

// --- SUB-COMPONENTS (TABS) ---

function OverviewTab({ hackathon, stats, onSync }: any) {
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* 1. Timeline Progress */}
            <TimelineProgress hackathon={hackathon} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 2. Mentor Selection */}
                <div className="lg:col-span-2">
                    <MentorSelection hackathon={hackathon} onSync={onSync} />
                </div>

                {/* 3. Automation Status */}
                <div>
                    <AutomationStatus />
                </div>
            </div>
        </div>
    );
}

function TimelineProgress({ hackathon }: { hackathon: any }) {
    const currentStatus = hackathon.status;
    const steps = [
        { 
            id: 'registration', 
            label: 'Registration', 
            statuses: ['registration_open', 'registration_closed'], 
            date: hackathon.registrationEnd,
            timeLabel: hackathon.registrationEnd ? `Until ${new Date(hackathon.registrationEnd).toLocaleDateString()} ${new Date(hackathon.registrationEnd).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 'TBD'
        },
        { 
            id: 'mentor_selection', 
            label: 'Mentor Selection', 
            statuses: ['mentor_selection'],
            date: hackathon.mentorSelectionEnd,
            timeLabel: hackathon.mentorSelectionEnd ? `Ends ${new Date(hackathon.mentorSelectionEnd).toLocaleDateString()}` : 'Post-Registration'
        },
        { 
            id: 'approval', 
            label: 'Squad Approval', 
            statuses: ['approval_in_progress'],
            date: hackathon.approvalEnd,
            timeLabel: hackathon.approvalEnd ? `Verify by ${new Date(hackathon.approvalEnd).toLocaleDateString()}` : 'Deployment'
        },
        { 
            id: 'rounds', 
            label: 'Combat Rounds', 
            statuses: ['ready_for_round_1', 'round_active', 'round_evaluation', 'round_results'],
            timeLabel: 'Submission → Eval → Result'
        },
        { 
            id: 'completed', 
            label: 'Mission Ends', 
            statuses: ['completed'],
            timeLabel: 'Final Ranks Declared'
        }
    ];

    const getStatusIndex = (status: string) => {
        if (status === 'draft') return -1;
        const index = steps.findIndex(s => s.statuses.includes(status));
        if (index !== -1) return index;
        // Fallbacks
        if (status.startsWith('round_')) return steps.findIndex(s => s.id === 'rounds');
        return -1;
    };

    const currentIndex = getStatusIndex(currentStatus);

    return (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden relative group">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-12 flex items-center gap-3">
                <Clock className="w-4 h-4 text-indigo-500" />
                Operational Lifecycle
            </h3>

            <div className="flex justify-between items-start relative z-10">
                {steps.map((step, idx) => {
                    const isCompleted = idx < currentIndex;
                    const isCurrent = idx === currentIndex;
                    const isUpcoming = idx > currentIndex;

                    return (
                        <div key={step.id} className="flex flex-col items-center flex-1 relative">
                            {/* Connector Line */}
                            {idx !== steps.length - 1 && (
                                <div className="absolute left-1/2 top-4 w-full h-[1px] bg-zinc-800">
                                    <div 
                                        className={`h-full transition-all duration-1000 ${isCompleted ? 'w-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]' : 'w-0'}`}
                                    />
                                </div>
                            )}

                            {/* Circle */}
                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500 z-10 ${
                                isCompleted ? 'bg-indigo-500 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' :
                                isCurrent ? 'bg-zinc-900 border-indigo-500 text-indigo-500 animate-pulse' :
                                'bg-zinc-950 border-zinc-800 text-zinc-700'
                            }`}>
                                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-[10px] font-black">{idx + 1}</span>}
                            </div>

                            {/* Label */}
                            <div className="mt-4 text-center">
                                <p className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
                                    isCurrent ? 'text-white' : isCompleted ? 'text-indigo-400/60' : 'text-zinc-600'
                                }`}>
                                    {step.label}
                                </p>
                                {step.date && (
                                    <p className={`text-[8px] font-bold mt-1 uppercase tracking-tighter transition-all ${
                                        isCurrent ? 'text-indigo-400' : isCompleted ? 'text-zinc-500/40' : 'text-zinc-500/20'
                                    }`}>
                                        {new Date(step.date).toLocaleDateString()} @ {new Date(step.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                )}
                                {!step.date && (
                                    <p className={`text-[8px] font-bold mt-1 uppercase tracking-tighter transition-all ${
                                        isCurrent ? 'text-indigo-400' : isCompleted ? 'text-zinc-500/40' : 'text-zinc-500/20'
                                    }`}>
                                        {step.timeLabel}
                                    </p>
                                )}
                            </div>

                            {isCurrent && (
                                <div className="absolute -top-12 px-3 py-1 bg-indigo-500 text-white text-[9px] font-black rounded-lg uppercase tracking-widest whitespace-nowrap animate-bounce shadow-lg shadow-indigo-500/20">
                                    Active Phase
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function MentorSelection({ hackathon, onSync }: { hackathon: any, onSync: () => void }) {
    const [availablePool, setAvailablePool] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const selectedCouncil = hackathon.mentors || [];
    const selectedIds = selectedCouncil.map((m: any) => m.mentorId);

    useEffect(() => {
        fetchAvailableMentors();
    }, [hackathon.id, hackathon.mentors]);

    const fetchAvailableMentors = async () => {
        try {
            const res = await api.get('/users/mentors');
            setAvailablePool(res.data.filter((m: any) => !selectedIds.includes(m.id)));
        } catch (error) {
            console.error("Failed to sync archon reserves", error);
        } finally {
            setLoading(false);
        }
    };

    const canSelectMentors = ['draft', 'registration_open', 'mentor_selection'].includes(hackathon.status);

    const handleSyncMentors = async (mentorIds: string[]) => {
        setIsSubmitting(true);
        try {
            await api.post(`/hackathons/${hackathon.id}/mentors`, {
                mentorIds,
                type: 'specific'
            });
            toast.success("Archon Council records synchronized");
            if (onSync) await onSync();
            setShowModal(false);
        } catch (error) {
            toast.error("Synchronization failure");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2rem] p-8 h-[400px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-zinc-800 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Synchronizing Archon Archive...</p>
            </div>
        </div>
    );

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 shadow-xl flex flex-col h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.02]">
                <UserCheck className="w-48 h-48" />
            </div>

            <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <UserCheck className="w-6 h-6 text-indigo-500" />
                    Mentor Selection
                </h3>
                {!canSelectMentors && (
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-3 py-1 bg-zinc-800 rounded-lg border border-zinc-700">
                        Read Only Profile
                    </span>
                )}
            </div>

            <div className="grid grid-cols-2 gap-8 flex-1">
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-500"></div>
                        Available Pool
                    </h4>
                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                        {availablePool.map(m => (
                            <div key={m.id} className="p-4 bg-zinc-950/50 border border-zinc-800/50 rounded-xl flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-[10px] font-black text-zinc-400 border border-zinc-800">
                                    {m.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-[11px] font-black text-zinc-300 uppercase leading-none">{m.name}</p>
                                    <p className="text-[9px] text-zinc-500 mt-1">{m.email}</p>
                                </div>
                            </div>
                        ))}
                        {availablePool.length === 0 && <p className="text-[10px] text-zinc-600 italic">No available mentors in reserve.</p>}
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                        Selected Council
                    </h4>
                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                        {selectedCouncil.map((m: any) => (
                            <div key={m.id} className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-[10px] font-black text-indigo-400 border border-indigo-500/30">
                                    {m.mentor?.name?.charAt(0) || 'A'}
                                </div>
                                <div>
                                    <p className="text-[11px] font-black text-indigo-300 uppercase leading-none">{m.mentor?.name}</p>
                                    <p className="text-[9px] text-indigo-500/60 mt-1">{m.mentor?.email}</p>
                                </div>
                            </div>
                        ))}
                        {selectedCouncil.length === 0 && <p className="text-[10px] text-zinc-600 italic">No archons deployed for this mission.</p>}
                    </div>
                </div>
            </div>

            {canSelectMentors && (
                <div className="mt-8 pt-6 border-t border-zinc-800">
                    <button 
                        onClick={() => setShowModal(true)}
                        className="w-full py-4 bg-white text-black hover:bg-indigo-500 hover:text-white transition-all rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-white/5"
                    >
                        Select Mentors
                    </button>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="p-8 border-b border-zinc-800 flex justify-between items-center">
                            <h3 className="font-black text-xl uppercase tracking-tighter">Council Selection</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-zinc-900 rounded-lg">
                                <XCircle className="w-6 h-6 text-zinc-500" />
                            </button>
                        </div>
                        <div className="p-8">
                            <MentorSelectionModal 
                                available={[...availablePool, ...selectedCouncil.map((m: any) => m.mentor)]} 
                                initialSelected={selectedIds}
                                onSave={handleSyncMentors}
                                isSubmitting={isSubmitting}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function MentorSelectionModal({ available, initialSelected, onSave, isSubmitting }: any) {
    const [selectedIds, setSelectedIds] = useState<string[]>(initialSelected);

    return (
        <div className="space-y-6">
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {available.map((m: any) => (
                    <label key={m.id} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedIds.includes(m.id) ? "bg-indigo-500/10 border-indigo-500/40" : "bg-zinc-900 border-zinc-800"
                    }`}>
                        <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={selectedIds.includes(m.id)}
                            onChange={() => {
                                if (selectedIds.includes(m.id)) {
                                    setSelectedIds(prev => prev.filter(id => id !== m.id));
                                } else {
                                    setSelectedIds(prev => [...prev, m.id]);
                                }
                            }}
                        />
                        <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center font-black">
                            {m.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                            <p className="text-[11px] font-black text-white uppercase">{m.name}</p>
                            <p className="text-[9px] text-zinc-500">{m.email}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedIds.includes(m.id) ? "border-indigo-500 bg-indigo-500 text-black" : "border-zinc-700"
                        }`}>
                            {selectedIds.includes(m.id) && <CheckCircle2 className="w-3 h-3" />}
                        </div>
                    </label>
                ))}
            </div>
            <button 
                onClick={() => onSave(selectedIds)}
                disabled={isSubmitting}
                className="w-full py-4 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-indigo-500 disabled:opacity-50"
            >
                {isSubmitting ? 'Updating Council...' : `Finalize Selection (${selectedIds.length})`}
            </button>
        </div>
    );
}

function AutomationStatus() {
    return (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2rem] p-8 shadow-xl h-full relative overflow-hidden group">
            <div className="absolute -bottom-12 -right-12 p-8 opacity-[0.05] group-hover:scale-110 transition-transform duration-1000">
                <Settings className="w-48 h-48 rotate-12" />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                <Settings className="w-6 h-6 text-pink-500 animate-spin-slow" />
                Automation Status
            </h3>

            <div className="space-y-6">
                <AutomationRow label="Registration" status="Auto-Open/Close" />
                <AutomationRow label="Mentor Selection" status="Auto-Initiate" />
                <AutomationRow label="Squad Approval" status="Auto-Assign Mentors" />
                <AutomationRow label="Combat Rounds" status="Auto-Progression" />
            </div>

            <div className="mt-10 p-4 bg-pink-500/5 border border-pink-500/10 rounded-xl">
                <p className="text-[9px] font-bold text-pink-500 uppercase tracking-widest text-center">
                    Engine actively monitoring protocol execution.
                </p>
            </div>
        </div>
    );
}

function AutomationRow({ label, status }: { label: string, status: string }) {
    return (
        <div className="flex items-center justify-between py-4 border-b border-zinc-800 last:border-0 hover:bg-white/[0.02] transition-all px-2 rounded-lg">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</span>
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-green-500 uppercase tracking-tight">{status}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
            </div>
        </div>
    );
}


function TeamsTab({ hackathonId }: { hackathonId: string }) {
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const { role, user } = useAuth();
    const router = useRouter();

    useEffect(() => { fetchTeams(); }, []);

    const fetchTeams = async () => {
        try {
            const res = await api.get(`/hackathons/${hackathonId}/admin-detailed-teams`);
            setTeams(res.data);
        } catch (error: any) {
            toast.error("Failed to intercept legion data");
        } finally {
            setLoading(false);
        }
    };

    const filteredTeams = teams.filter(t => {
        // If MENTOR, only show assigned teams (unless they have global clearance which we'll assume for now if they are seen in the list)
        if (role === 'MENTOR') {
            const isAssigned = t.mentors?.some((m: any) => m.id === user?.id);
            if (!isAssigned) return false;
        }

        const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || 
                             t.lead?.name?.toLowerCase().includes(search.toLowerCase());
        
        let statusMatch = true;
        if (filter === 'pending') statusMatch = t.status === 'pending_approval';
        else if (filter === 'approved') statusMatch = t.status === 'approved';
        else if (filter === 'eliminated') statusMatch = ['rejected', 'eliminated'].includes(t.status);
        
        return matchesSearch && statusMatch;
    });

    if (loading) return (
        <div className="p-32 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-pink-500 mx-auto mb-6" />
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Decoding Legion Registers...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* 1. Search + Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input 
                        placeholder="Search Team..." 
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-6 text-xs font-bold uppercase tracking-widest focus:border-pink-500 transition-all outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <select 
                        className="bg-zinc-900 border border-zinc-800 rounded-xl px-8 py-4 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer focus:border-pink-500 transition-all"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="all">All States</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="eliminated">Eliminated</option>
                    </select>
                </div>
            </div>

            {/* 2. Teams Table */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                {filteredTeams.length === 0 ? (
                    <div className="p-32 text-center">
                        <Users className="w-16 h-16 text-zinc-800 mx-auto mb-6 opacity-20" />
                        <h4 className="text-xl font-bold text-zinc-600 uppercase tracking-tighter">No teams found</h4>
                        <p className="text-[9px] font-black text-zinc-700 mt-2 uppercase tracking-widest">The archives are empty for current parameters.</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-800/30 text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] border-b border-zinc-800">
                                <th className="px-10 py-6">Team Name</th>
                                <th className="px-8 py-6">Members</th>
                                <th className="px-8 py-6">Mentors</th>
                                <th className="px-8 py-6">Status</th>
                                <th className="px-10 py-6 text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {filteredTeams.map((team) => (
                                <tr 
                                    key={team.id} 
                                    onClick={() => router.push(`/admin/hackathons/${hackathonId}/teams/${team.id}`)}
                                    className="hover:bg-pink-500/[0.02] transition-colors group cursor-pointer"
                                >
                                    <td className="px-10 py-8">
                                        <div className="font-black text-lg text-white group-hover:text-pink-400 transition-colors uppercase tracking-tight leading-none">{team.name}</div>
                                        <div className="text-[9px] text-zinc-600 font-mono mt-2 lowercase">ID: {team.id.substring(0, 8)}</div>
                                    </td>
                                    <td className="px-8 py-8">
                                        <div className="flex flex-col gap-1.5">
                                            {team.members.map((m: any, idx: number) => (
                                                <div key={idx} className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-black uppercase tracking-tight ${m.studentId === team.leadId ? 'text-pink-500' : 'text-zinc-400'}`}>
                                                        {m.student?.name}
                                                    </span>
                                                    {m.studentId === team.leadId && (
                                                        <span className="text-[7px] font-black bg-pink-500/10 text-pink-500 border border-pink-500/20 px-1.5 py-0.5 rounded uppercase tracking-[0.2em]">Lead</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-8 py-8">
                                        {team.mentors?.length > 0 ? (
                                            <div className="flex flex-col gap-2">
                                                {team.mentors.map((mentor: any, mIdx: number) => (
                                                    <div key={mIdx} className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                                        <span className="text-[10px] font-black uppercase text-zinc-400 tracking-tight">{mentor.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-[10px] font-bold text-zinc-700 italic uppercase tracking-widest">Not Assigned</span>
                                        )}
                                    </td>
                                    <td className="px-8 py-8">
                                        <span className={`px-4 py-1.5 text-[9px] font-black rounded-lg uppercase tracking-[0.2em] border transition-all flex items-center gap-2 w-fit ${
                                            team.status === 'approved' ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-lg shadow-green-500/5' :
                                            team.status === 'pending_approval' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-lg shadow-orange-400/5' :
                                            'bg-red-500/10 text-red-500 border-red-500/20 shadow-lg shadow-red-500/5'
                                        }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${
                                                team.status === 'approved' ? 'bg-green-500' :
                                                team.status === 'pending_approval' ? 'bg-orange-500' :
                                                'bg-red-500'
                                            }`}></div>
                                            {team.status === 'pending_approval' ? 'Pending' :
                                             team.status === 'approved' ? 'Approved' : 'Eliminated'}
                                        </span>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <button className="p-3 bg-zinc-800 hover:bg-pink-600 text-zinc-400 hover:text-white rounded-xl transition-all shadow-lg group-hover:scale-110 active:scale-95">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

function SubmissionsTab({ hackathonId, rounds }: any) { 
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTeam, setSelectedTeam] = useState<any>(null);

    useEffect(() => {
        fetchSubmissions();
    }, [hackathonId]);

    const fetchSubmissions = async () => {
        try {
            const res = await api.get(`/hackathons/${hackathonId}/admin-detailed-teams`);
            setSubmissions(res.data);
            setLoading(false);
        } catch (error: any) {
            toast.error("Failed to intercept data stream");
            setLoading(false);
        }
    };

    if (loading) return <div className="p-24 text-center text-zinc-500 italic uppercase font-black tracking-widest animate-pulse">Intercepting data packets...</div>;

    const finalSubmissions = submissions.filter((t: any) => t.latestSubmission);

    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-center bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-2xl gap-6">
                <div>
                    <h3 className="text-xl font-black uppercase tracking-widest mb-2 flex items-center gap-3">
                        <Shield className="w-5 h-5 text-pink-500" />
                        Submission Intelligence
                    </h3>
                    <p className="text-[10px] font-black text-zinc-500 lowercase">Captured <span className="text-white">{finalSubmissions.length}</span> payloads from <span className="text-pink-500">{submissions.length}</span> registered legions</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <button className="flex-1 md:flex-none px-6 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:border-zinc-700 transition-all">Export Archive</button>
                    <select className="flex-1 md:flex-none px-6 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] outline-none cursor-pointer focus:border-pink-500 transition-all">
                        <option>Round: Overall (Final)</option>
                        {rounds?.map((r: any) => (
                            <option key={r.id}>Round {r.roundNumber}: {r.title}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {finalSubmissions.map((team) => (
                    <div key={team.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 group hover:border-pink-500/50 transition-all shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                            <FileText className="w-32 h-32 rotate-12" />
                        </div>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h4 className="font-black text-xl group-hover:text-pink-400 transition-colors uppercase tracking-widest">{team.name}</h4>
                                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mt-1">Round Transmission: <span className="text-zinc-300">{team.latestSubmission.round.title}</span></p>
                            </div>
                            <span className="text-[10px] font-black bg-zinc-800 border border-zinc-700 text-zinc-400 px-3 py-1 rounded-lg leading-none shadow-lg">RECORD</span>
                        </div>

                        <div className="flex flex-col gap-4 mb-8">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                <Clock className="w-3.5 h-3.5 text-pink-500" />
                                Intercepted: {formatDate(new Date(team.latestSubmission.submittedAt), 'MMM dd, HH:mm:ss')}
                            </div>
                            <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-2xl p-4 text-[11px] font-medium leading-relaxed text-zinc-400 italic">
                                &ldquo;{team.latestSubmission.description || "Manifesto missing."}&rdquo;
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {team.latestSubmission.githubLink && (
                                <a href={team.latestSubmission.githubLink} target="_blank" className="flex items-center justify-center gap-2 bg-zinc-950 border border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-900 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                    <Shield className="w-3.5 h-3.5 text-blue-500" />
                                    The Code
                                </a>
                            )}
                            {team.latestSubmission.videoUrl && (
                                <a href={team.latestSubmission.videoUrl} target="_blank" className="flex items-center justify-center gap-2 bg-zinc-950 border border-zinc-800 hover:border-pink-500/50 hover:bg-zinc-900 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                    <Eye className="w-3.5 h-3.5 text-pink-500" />
                                    Exhibit A
                                </a>
                            )}
                        </div>

                        <button 
                            onClick={() => setSelectedTeam(team)}
                            className="w-full flex items-center justify-center gap-2 bg-white text-black hover:bg-pink-500 hover:text-white transition-all py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-white/5 active:scale-95"
                        >
                            Open Intelligence File
                            <ExternalLink className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>

            {submissions.length === 0 && (
                <div className="p-32 text-center text-zinc-700 border border-zinc-900 border-dashed rounded-[3rem] bg-zinc-900/10">
                    <FileText className="w-16 h-16 mx-auto mb-6 opacity-5" />
                    <h4 className="font-black text-2xl text-zinc-600 uppercase tracking-tighter">No encrypted packets found</h4>
                    <p className="text-[10px] font-black text-zinc-800 mt-2 uppercase tracking-[0.3em]">The legions are dark... for now.</p>
                </div>
            )}

            {selectedTeam && (
                <SubmissionModal 
                    submission={selectedTeam.latestSubmission} 
                    onClose={() => setSelectedTeam(null)} 
                />
            )}
        </div>
    );
}

function SubmissionModal({ submission, onClose }: any) {
    const [details, setDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/hackathons/submissions/${submission.id}/details`).then(res => {
            setDetails(res.data);
            setLoading(false);
        });
    }, [submission.id]);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-300">
            <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(236,72,153,0.1)] scale-in-center animate-in zoom-in-95 duration-500">
                <div className="p-8 border-b border-zinc-800 flex justify-between items-center bg-zinc-800/10">
                    <div>
                        <h3 className="font-black text-3xl uppercase tracking-tighter text-white">Advanced Intelligence Profile</h3>
                        <p className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.3em] mt-2">Legion: <span className="text-pink-500">{details?.team?.name}</span> • Transmission: <span className="text-zinc-300">{details?.round?.title}</span></p>
                    </div>
                    <button onClick={onClose} className="p-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl border border-zinc-700 transition-all hover:scale-110 active:scale-90 group shadow-lg">
                        <XCircle className="w-6 h-6 text-zinc-500 group-hover:text-white transition-colors" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                    {loading ? (
                        <div className="text-center py-32 text-zinc-500 italic uppercase font-black tracking-widest animate-pulse">Running deeper diagnostics...</div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                            <div className="space-y-12">
                                <section>
                                    <h4 className="text-[10px] font-black uppercase text-pink-500 tracking-[0.4em] mb-6 flex items-center gap-3">
                                        <FileText className="w-4 h-4" />
                                        Data Core
                                    </h4>
                                    <div className="bg-black/50 rounded-[2rem] p-8 border border-zinc-800/50 shadow-inner">
                                        <p className="text-sm text-zinc-300 italic mb-8 leading-relaxed font-medium">&ldquo;{details.description}&rdquo;</p>
                                        <div className="space-y-4">
                                            <a href={details.githubLink} target="_blank" className="flex items-center justify-between p-5 bg-zinc-900 rounded-2xl border border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-800 transition-all group shadow-lg">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 group-hover:scale-110 transition-transform"><Shield className="w-5 h-5 text-blue-500" /></div>
                                                    <span className="text-[11px] font-black uppercase tracking-widest">Source Archives</span>
                                                </div>
                                                <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                            </a>
                                            {details.videoUrl && (
                                                <a href={details.videoUrl} target="_blank" className="flex items-center justify-between p-5 bg-zinc-900 rounded-2xl border border-zinc-800 hover:border-pink-500/50 hover:bg-zinc-800 transition-all group shadow-lg">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 group-hover:scale-110 transition-transform"><Eye className="w-5 h-5 text-pink-500" /></div>
                                                        <span className="text-[11px] font-black uppercase tracking-widest">Visual Surveillance</span>
                                                    </div>
                                                    <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h4 className="text-[10px] font-black uppercase text-pink-500 tracking-[0.4em] mb-6 flex items-center gap-3">
                                        <Clock className="w-4 h-4" />
                                        Temporal Echoes (History)
                                    </h4>
                                    <div className="space-y-4">
                                        {details.history.map((h: any) => (
                                            <div key={h.id} className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${h.id === submission.id ? "bg-pink-500/5 border-pink-500/30 shadow-[0_0_20px_rgba(236,72,153,0.05)]" : "bg-zinc-950/50 border-zinc-800 opacity-40 grayscale hover:grayscale-0 hover:opacity-100"}`}>
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-lg ${h.id === submission.id ? "bg-pink-500 text-white shadow-lg shadow-pink-500/20" : "bg-zinc-800 text-zinc-500 font-bold"}`}>RCD</div>
                                                    <div>
                                                        <div className="text-[11px] font-black text-white uppercase tracking-tight">Transmission Detected</div>
                                                        <div className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mt-1">{formatDate(new Date(h.submittedAt), 'MMM dd, HH:mm:ss')}</div>
                                                    </div>
                                                </div>
                                                {h.id === submission.id && <span className="text-[9px] font-black uppercase text-pink-500 tracking-widest animate-pulse">Live Protocol</span>}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>

                            <div className="space-y-12">
                                <section>
                                    <h4 className="text-[10px] font-black uppercase text-pink-500 tracking-[0.4em] mb-6 flex items-center gap-3">
                                        <Award className="w-4 h-4" />
                                        Archon Evaluations
                                    </h4>
                                    <div className="space-y-6">
                                        {details.evaluations.map((ev: any) => (
                                            <div key={ev.id} className="bg-zinc-900/50 rounded-[2rem] p-8 border border-zinc-800/80 shadow-xl group hover:border-indigo-500/20 transition-all">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-indigo-500/20 border border-white/20">
                                                            {ev.mentor?.name?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-black uppercase text-white tracking-tight">{ev.mentor?.name}</div>
                                                            <div className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em] mt-1">Operational Archon</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <div className="text-4xl font-black text-indigo-400 tracking-tighter group-hover:scale-110 transition-transform">{ev.score}<span className="text-[10px] text-zinc-700 ml-1 uppercase">/100</span></div>
                                                    </div>
                                                </div>
                                                <div className="bg-black/40 p-6 rounded-2xl text-[11px] text-zinc-400 italic leading-relaxed border border-zinc-800/50 shadow-inner group-hover:text-zinc-300 transition-colors">
                                                    &ldquo;{ev.remarks || "The Archon remained silent."}&rdquo;
                                                </div>
                                            </div>
                                        ))}
                                        {details.evaluations.length === 0 && (
                                            <div className="p-16 text-center text-zinc-700 bg-zinc-950/50 border border-zinc-800 border-dashed rounded-[2rem]">
                                                <MessageSquare className="w-10 h-10 mx-auto mb-4 opacity-5" />
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Awaiting Archon Verdict</p>
                                            </div>
                                        )}
                                    </div>
                                </section>
                                
                                <div className="p-8 bg-gradient-to-br from-pink-600 to-rose-700 rounded-[2.5rem] shadow-2xl shadow-pink-600/20 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                                        <Trophy className="w-48 h-48" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="text-[10px] font-black uppercase text-white/50 tracking-[0.4em] mb-2">Aggregate Battle Score</div>
                                        <div className="text-7xl font-black text-white tracking-tighter leading-none mb-4">{details.score || 0}</div>
                                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
                                            <div className="h-full bg-white shadow-[0_0_10px_white]" style={{ width: `${details.score}%` }}></div>
                                        </div>
                                        <p className="text-[10px] text-white/40 font-black uppercase leading-relaxed tracking-widest">Calculated average across all deployed sensor archons.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function LeaderboardTab({ hackathonId, rounds }: any) { 
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        api.get(`/hackathons/${hackathonId}/leaderboard`).then(res => {
            setLeaderboard(res.data.entries || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [hackathonId]);

    if (loading) return (
        <div className="p-24 text-center">
            <div className="w-12 h-12 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest animate-pulse">Syncing Standings...</p>
        </div>
    );

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="p-8 border-b border-zinc-800 bg-zinc-950/20 flex justify-between items-center">
                <div>
                    <h3 className="font-black text-xl uppercase tracking-widest flex items-center gap-3">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        Operational Leaderboard
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Live ranking of all active legions</p>
                </div>
            </div>

            <div className="overflow-x-auto scroller-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-zinc-800/50 bg-zinc-950/40 text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">
                            <th className="px-8 py-6 w-24">Rank</th>
                            <th className="px-8 py-6">Team Name</th>
                            <th className="px-8 py-6 text-center">Total Score</th>
                            <th className="px-8 py-6">Status</th>
                            <th className="px-8 py-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                        {leaderboard.map((entry, idx) => (
                            <tr key={entry.teamId} className="group hover:bg-zinc-800/30 transition-all duration-300 cursor-default">
                                <td className="px-8 py-6">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border ${
                                        idx === 0 ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.1)]" :
                                        idx === 1 ? "bg-zinc-300/10 border-zinc-300/30 text-zinc-300" :
                                        idx === 2 ? "bg-amber-700/10 border-amber-700/30 text-amber-600" :
                                        "bg-zinc-950 border-zinc-800 text-zinc-500 font-bold"
                                    }`}>
                                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : (idx + 1)}
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="font-black text-sm uppercase tracking-tight text-white group-hover:text-pink-400 transition-colors">
                                        {entry.teamName}
                                    </div>
                                    <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1">
                                        Legion Hash: {entry.teamId.slice(0, 8)}...
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <div className="text-xl font-black text-pink-500 tracking-tighter">
                                        {(entry.cumulativeScore || 0).toFixed(1)}
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                        entry.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                                        entry.status === 'eliminated' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                        'bg-zinc-800 text-zinc-500 border-zinc-700'
                                    }`}>
                                        {entry.status}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <button 
                                        onClick={() => router.push(`/admin/hackathons/${hackathonId}/teams/${entry.teamId}`)}
                                        className="px-4 py-2 bg-zinc-950 border border-zinc-800 hover:border-pink-500/50 hover:bg-zinc-900 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all shadow-lg"
                                    >
                                        View Detail
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {leaderboard.length === 0 && (
                    <div className="p-24 text-center">
                        <Trophy className="w-12 h-12 mx-auto mb-4 opacity-5" />
                        <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Awaiting Initial Standings...</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function MentorsTab({ hackathonId, onSync }: { hackathonId: string, onSync?: () => void }) {
    const [mentors, setMentors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [availableMentors, setAvailableMentors] = useState<any[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedMentorIds, setSelectedMentorIds] = useState<string[]>([]);
    const [assignmentType, setAssignmentType] = useState<string>("SPECIFIC");

    useEffect(() => { fetchMentors(); }, [hackathonId]);

    const fetchMentors = async () => {
        setLoading(true);
        try {
            const [assignedRes, availableRes] = await Promise.all([
                api.get(`/hackathons/${hackathonId}/admin-stats`).then(res => res.data.mentors),
                api.get(`/hackathons/${hackathonId}/mentors/available`).then(res => res.data)
            ]);
            
            setMentors(assignedRes);
            setAvailableMentors(availableRes);
            setSelectedMentorIds(assignedRes.map((m: any) => m.mentorId));
        } catch (error) {
            toast.error("Archive fetch failure");
        } finally {
            setLoading(false);
        }
    };

    const handleAddMentors = async () => {
        try {
            await api.post(`/hackathons/${hackathonId}/mentors`, {
                mentorIds: selectedMentorIds,
                type: assignmentType
            });
            toast.success("Archon Council deployed");
            setShowAddModal(false);
            fetchMentors();
            if (onSync) onSync();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Deployment failed");
        }
    };

    const handleRemoveMentor = async (mentorId: string) => {
        if (!window.confirm("Recall this Archon from the mission?")) return;
        try {
            await api.delete(`/hackathons/${hackathonId}/mentors/${mentorId}`);
            toast.success("Archon recalled to base");
            fetchMentors();
        } catch (error: any) {
            toast.error("Recall failed");
        }
    };

    if (loading) return <div className="p-24 text-center text-zinc-500 italic uppercase font-black tracking-widest animate-pulse">Synchronizing Archon frequencies...</div>;

    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-center bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-800 shadow-2xl gap-8">
                <div>
                    <h3 className="text-2xl font-black uppercase tracking-widest mb-2 flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20"><UserCheck className="w-6 h-6 text-indigo-400" /></div>
                        Archon Council
                    </h3>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Deployment Tier: <span className="text-indigo-400">Tactical Oversight</span></p>
                </div>
                <button 
                    onClick={() => setShowAddModal(true)}
                    className="w-full md:w-auto px-8 py-4 bg-white text-black hover:bg-indigo-500 hover:text-white transition-all rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-white/5 active:scale-95 flex items-center justify-center gap-3"
                >
                    <Plus className="w-5 h-5" />
                    Enlist New Archon
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {mentors.map((m: any) => (
                    <div key={m.id} className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 group hover:border-indigo-500/40 transition-all shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                            <Shield className="w-32 h-32 -rotate-12" />
                        </div>
                        
                        <div className="flex items-center gap-6 mb-8">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-2xl font-black text-white shadow-lg border border-white/10 group-hover:scale-110 transition-transform">
                                {m.mentor?.name?.charAt(0) || 'A'}
                            </div>
                            <div>
                                <h4 className="font-black text-xl uppercase tracking-tighter text-white">{m.mentor?.name}</h4>
                                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">{m.mentor?.email}</p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between items-center py-3 border-b border-zinc-800/50">
                                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Protocol Tier</span>
                                <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-lg border ${
                                    m.assignmentType === 'GLOBAL' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                                }`}>
                                    {m.assignmentType}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-3">
                                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Enlisted On</span>
                                <span className="text-[9px] font-black text-zinc-300 uppercase">{formatDate(new Date(m.createdAt), 'MMM dd, PPP')}</span>
                            </div>
                        </div>

                        <button 
                            onClick={() => handleRemoveMentor(m.mentorId)}
                            className="w-full py-4 bg-zinc-950 border border-zinc-800 hover:border-red-500/50 hover:bg-red-500/5 text-zinc-500 hover:text-red-500 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 group/btn"
                        >
                            <LogOut className="w-3.5 h-3.5 group-hover/btn:-translate-x-1 transition-transform" />
                            Recall Archon
                        </button>
                    </div>
                ))}

                {mentors.length === 0 && (
                    <div className="lg:col-span-3 py-32 text-center bg-zinc-950/20 border border-zinc-900 border-dashed rounded-[3rem]">
                        <UserCheck className="w-16 h-16 mx-auto mb-6 opacity-5" />
                        <h4 className="text-zinc-600 font-black text-2xl uppercase tracking-tighter">No Active Archon Presence</h4>
                        <p className="text-[10px] text-zinc-800 mt-2 uppercase tracking-[0.3em]">Deploy specialists to oversee the legions.</p>
                    </div>
                )}
            </div>

            {/* Add Mentor Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-[0_0_100px_rgba(99,102,241,0.1)]">
                        <div className="p-8 border-b border-zinc-800 flex justify-between items-center">
                            <h3 className="font-black text-2xl uppercase tracking-tighter">Enlist Specialists</h3>
                            <button onClick={() => setShowAddModal(false)} className="p-3 hover:bg-zinc-800 rounded-xl transition-all">
                                <XCircle className="w-6 h-6 text-zinc-500" />
                            </button>
                        </div>
                        <div className="p-8 space-y-8">
                            <div>
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 block">Deployment Protocol</label>
                                <select 
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-[11px] font-black uppercase tracking-widest outline-none focus:border-indigo-500 transition-all cursor-pointer"
                                    value={assignmentType}
                                    onChange={(e) => setAssignmentType(e.target.value)}
                                >
                                    <option value="SPECIFIC">Tactical (Specific Squads)</option>
                                    <option value="GLOBAL">Strategic (Global Oversight)</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 block">Available Archons</label>
                                <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                    {availableMentors.map((m: any) => (
                                        <label key={m.id} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                                            selectedMentorIds.includes(m.id) ? "bg-indigo-500/10 border-indigo-500/40" : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                                        }`}>
                                            <input 
                                                type="checkbox" 
                                                className="hidden" 
                                                checked={selectedMentorIds.includes(m.id)}
                                                onChange={() => {
                                                    if (selectedMentorIds.includes(m.id)) {
                                                        setSelectedMentorIds(prev => prev.filter(id => id !== m.id));
                                                    } else {
                                                        setSelectedMentorIds(prev => [...prev, m.id]);
                                                    }
                                                }}
                                            />
                                            <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center font-black text-xs border border-zinc-800">
                                                {m.name.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-[11px] font-black text-white uppercase tracking-tight">{m.name}</div>
                                                <div className="text-[9px] text-zinc-500 lowercase">{m.email}</div>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                                selectedMentorIds.includes(m.id) ? "border-indigo-500 bg-indigo-500" : "border-zinc-800"
                                            }`}>
                                                {selectedMentorIds.includes(m.id) && <CheckCircle2 className="w-3 h-3 text-black" />}
                                            </div>
                                        </label>
                                    ))}
                                    {availableMentors.length === 0 && (
                                        <div className="text-center py-12 text-[10px] font-black text-zinc-600 uppercase tracking-widest">No available specialists in reserve.</div>
                                    )}
                                </div>
                            </div>

                            <button 
                                onClick={handleAddMentors}
                                disabled={selectedMentorIds.length === 0}
                                className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:bg-zinc-800 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.98]"
                            >
                                Execute Deployment ({selectedMentorIds.length})
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ActivityTab({ hackathonId }: { hackathonId: string }) {
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        api.get(`/hackathons/${hackathonId}/admin-activities`)
            .then(res => {
                setActivities(res.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [hackathonId]);

    if (loading) return (
        <div className="p-24 text-center">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest animate-pulse">Reading Scroll of Truth...</p>
        </div>
    );

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                <div>
                    <h3 className="text-xl font-black uppercase tracking-[0.2em] flex items-center gap-4 text-zinc-200">
                        <Clock className="w-5 h-5 text-indigo-500" />
                        The Scroll of Truth
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Immutable chronological registry of all actions</p>
                </div>
                <div className="flex gap-4">
                    <button className="px-5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-400">All Logs</button>
                    <button className="px-5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-700">Filter: Protocol</button>
                </div>
            </div>

            <div className="space-y-6 relative max-w-4xl">
                {activities.map((a, idx) => (
                    <div key={a.id} className="flex gap-6 relative group border-b border-zinc-800/30 pb-6 last:border-0 last:pb-0">
                        <div className="text-[11px] font-mono text-zinc-600 w-24 pt-1 tabular-nums">
                            [{formatDate(new Date(a.createdAt), 'hh:mm a')}]
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                <div className={`w-1.5 h-1.5 rounded-full ${
                                    a.activityType === 'team_approval' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' :
                                    a.activityType === 'elimination' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]' :
                                    a.activityType === 'submission' ? 'bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.4)]' :
                                    a.activityType === 'registration' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]' :
                                    a.activityType === 'score_update' ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)]' :
                                    'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]'
                                }`}></div>
                                <span className="text-[13px] font-bold text-zinc-300 group-hover:text-white transition-colors">
                                    {a.description}
                                </span>
                            </div>
                            {a.performedBy && (
                                <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mt-1 ml-4.5 flex items-center gap-2">
                                    <Shield className="w-3 h-3" />
                                    {a.performedBy.name}
                                </div>
                            )}
                        </div>
                        <div className="text-[9px] font-black text-zinc-700 uppercase pt-1">
                            {formatDate(new Date(a.createdAt), 'MMM dd')}
                        </div>
                    </div>
                ))}

                {activities.length === 0 && (
                    <div className="py-24 text-center">
                        <div className="w-px h-12 bg-zinc-800 mx-auto mb-6"></div>
                        <p className="text-[10px] font-black uppercase text-zinc-700 tracking-widest italic">The scroll is currently blank.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
