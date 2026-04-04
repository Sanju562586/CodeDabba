"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthProvider";
import { NavBar } from "@/components/landing/NavBar";
import { useState, useEffect } from "react";
import { Loader2, BookOpen, PlayCircle, Trophy, Users as UsersIcon, ArrowRight, Calendar, Award } from "lucide-react";
import api from "@/lib/axios";
import Link from "next/link";
import { toast } from "react-hot-toast";

interface EnrolledCourse {
    id: string;
    title: string;
    description: string;
    thumbnailUrl?: string;
    progress?: {
        percentage: number;
        completedLessons: number;
        totalLessons: number;
    };
}

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

export default function StudentDashboard() {
    const { user, logout } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
    const [myHackathons, setMyHackathons] = useState<HackathonRegistration[]>([]);
    const [certificates, setCertificates] = useState<any[]>([]);
    const [invitationCount, setInvitationCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [hackathonsLoading, setHackathonsLoading] = useState(true);

    useEffect(() => {
        fetchEnrolledCourses();
        fetchMyHackathons();
        fetchInvitationCount();
        fetchCertificates();
    }, []);

    const fetchEnrolledCourses = async () => {
        try {
            const { data } = await api.get('/courses/enrolled');
            setEnrolledCourses(data);
        } catch (error) {
            console.error("Failed to fetch enrolled courses", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyHackathons = async () => {
        try {
            const { data } = await api.get('/hackathons/mine/registrations');
            setMyHackathons(data);
        } catch (error) {
            console.error("Failed to fetch hackathons", error);
        } finally {
            setHackathonsLoading(false);
        }
    };

    const fetchInvitationCount = async () => {
        try {
            const { data } = await api.get('/hackathons/mine/invitations');
            setInvitationCount(data.length);
        } catch (error) {
            console.error("Failed to fetch invitations", error);
        }
    };

    const fetchCertificates = async () => {
        try {
            const { data } = await api.get('/certificates/my');
            setCertificates(data);
        } catch (error) {
            console.error("Failed to fetch certificates", error);
        }
    };

    const handleGenerateCertificate = async (hackathonId: string) => {
        const loadingToast = toast.loading("Generating your Tactical Achievement Record...");
        try {
            await api.post(`/certificates/${hackathonId}`);
            toast.success("Certificate Decoded! Secure it in the Achievment Registry.", { id: loadingToast });
            fetchCertificates();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Tactical Failure during generation.", { id: loadingToast });
        }
    };

    const handleLogout = async () => {
        setIsLoggingOut(true);
        await logout();
        setIsLoggingOut(false);
    };

    const [activeTab, setActiveTab] = useState<'missions' | 'archive' | 'learning'>('missions');

    return (
        <ProtectedRoute allowedRoles={['STUDENT']}>
            <div className="min-h-screen bg-black text-white selection:bg-fuchsia-500/30">
                <NavBar />
                <div className="container mx-auto px-6 py-24">
                    <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-black italic uppercase italic tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500 mb-2">Tactical Dashboard</h1>
                            <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.3em]">Operative ID: {user?.id?.substring(0, 8)} // Welcome, {user?.name}</p>
                        </div>
                        
                        <div className="flex bg-zinc-950 border border-white/5 p-1 rounded-2xl">
                            <button 
                                onClick={() => setActiveTab('missions')}
                                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'missions' ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/20' : 'text-zinc-500 hover:text-white'}`}
                            >
                                Missions
                            </button>
                            <button 
                                onClick={() => setActiveTab('learning')}
                                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'learning' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' : 'text-zinc-500 hover:text-white'}`}
                            >
                                Learning
                            </button>
                            <button 
                                onClick={() => setActiveTab('archive')}
                                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'archive' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-zinc-500 hover:text-white'}`}
                            >
                                Archive
                            </button>
                        </div>
                    </div>

                    {invitationCount > 0 && activeTab === 'missions' && (
                        <div className="mb-12 animate-in slide-in-from-top-4 duration-500">
                            <Link href="/hackathons/invitations" className="group block p-1 bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-[2rem] hover:scale-[1.01] transition-all overflow-hidden shadow-2xl shadow-fuchsia-600/20">
                                <div className="bg-zinc-950 rounded-[1.9rem] p-8 flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-fuchsia-600/10 rounded-2xl flex items-center justify-center border border-fuchsia-600/20">
                                            <Trophy className="w-8 h-8 text-fuchsia-500 animate-bounce" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black italic uppercase italic tracking-tight">Active Recruitment Alert</h2>
                                            <p className="text-zinc-400 font-medium">You have <span className="text-fuchsia-400 font-bold">{invitationCount}</span> pending squad invitations. Deploy to battle now.</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-8 h-8 text-fuchsia-500 group-hover:translate-x-2 transition-transform" />
                                </div>
                            </Link>
                        </div>
                    )}

                    {/* Learning Tab */}
                    {activeTab === 'learning' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {loading ? (
                                <div className="flex justify-center py-24">
                                    <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                                </div>
                            ) : enrolledCourses.length > 0 ? (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {enrolledCourses.map((course) => (
                                        <div key={course.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-violet-500/50 transition-all group flex flex-col">
                                            <div className="aspect-video bg-zinc-800 relative">
                                                {course.thumbnailUrl ? (
                                                    <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                                        <BookOpen className="w-12 h-12 opacity-20" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Link href={`/learn/${course.id}`} className="px-6 py-2 bg-white text-black rounded-full font-bold transform translate-y-4 group-hover:translate-y-0 transition-all flex items-center gap-2">
                                                        <PlayCircle className="w-5 h-5" /> Continue
                                                    </Link>
                                                </div>
                                            </div>
                                            <div className="p-6 flex-1 flex flex-col">
                                                <h3 className="text-xl font-bold mb-2 line-clamp-1 text-zinc-100">{course.title}</h3>
                                                <p className="text-sm text-zinc-400 line-clamp-2 mb-4 flex-1">{course.description}</p>
                                                <div className="space-y-2 mt-auto">
                                                    <div className="flex justify-between text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                                        <span>Progress</span>
                                                        <span>{course.progress?.percentage || 0}%</span>
                                                    </div>
                                                    <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800">
                                                        <div
                                                            className="bg-gradient-to-r from-violet-600 to-pink-600 h-full rounded-full transition-all duration-1000 ease-out"
                                                            style={{ width: `${course.progress?.percentage || 0}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-32 bg-zinc-950/50 border border-zinc-900 rounded-[3rem] border-dashed">
                                    <BookOpen className="w-16 h-16 text-zinc-800 mx-auto mb-6" />
                                    <h2 className="text-2xl font-bold text-white mb-2 italic uppercase">Intelligence Depleted</h2>
                                    <p className="text-zinc-600 mb-8 max-w-md mx-auto font-medium font-mono text-xs uppercase tracking-widest">No active learning protocols detected in your neural network.</p>
                                    <Link href="/courses" className="px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-black italic uppercase transition-all shadow-xl shadow-violet-600/20">
                                        Decrypt Courses
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Archive Tab (Certificates) */}
                    {activeTab === 'archive' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {certificates.length > 0 ? (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {certificates.map((cert) => (
                                        <div key={cert.id} className="bg-zinc-950/50 border border-zinc-800 rounded-3xl p-8 hover:border-amber-500/30 transition-all group relative overflow-hidden backdrop-blur-xl">
                                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                <Award className="w-32 h-32 text-amber-500 -mr-16 -mt-16 rotate-12" />
                                            </div>
                                            <div className="flex items-start justify-between mb-8">
                                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                                    <Award className="w-7 h-7 text-amber-500" />
                                                </div>
                                                <span className="text-[9px] font-mono text-zinc-600 tracking-tighter">{cert.certificateId}</span>
                                            </div>
                                            <h3 className="text-xl font-black italic uppercase italic tracking-tight text-zinc-200 group-hover:text-amber-400 transition-colors mb-2">{cert.hackathon?.title}</h3>
                                            <div className="flex items-center gap-2 mb-8">
                                                <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${cert.type === 'winner' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-zinc-800 text-zinc-500 border-white/5'}`}>
                                                    {cert.type === 'winner' ? `🏆 ${cert.position}` : 'Protocol Completion'}
                                                </div>
                                                <span className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest">{new Date(cert.createdAt).getFullYear()}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <a 
                                                    href={cert.fileUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="flex-1 px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300 hover:bg-zinc-800 transition-all text-center"
                                                >
                                                    Download
                                                </a>
                                                <Link 
                                                    href={`/verify/certificate/${cert.certificateId}`} 
                                                    className="px-6 py-3 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 hover:text-white hover:bg-white/5 transition-all"
                                                >
                                                    Verify
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-32 bg-zinc-950/50 border border-zinc-900 rounded-[3rem] border-dashed">
                                    <Award className="w-16 h-16 text-zinc-800 mx-auto mb-6 opacity-40" />
                                    <h2 className="text-2xl font-bold text-zinc-500 mb-2 italic uppercase">Registry Empty</h2>
                                    <p className="text-zinc-700 mb-8 max-w-sm mx-auto font-medium font-mono text-xs uppercase tracking-widest leading-loose">No achievement records have been decoded. Complete active missions to claim certificates.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Missions Tab (Hackathons) */}
                    {activeTab === 'missions' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {hackathonsLoading ? (
                                <div className="flex justify-center py-24">
                                    <Loader2 className="w-8 h-8 animate-spin text-fuchsia-500" />
                                </div>
                            ) : myHackathons.length > 0 ? (
                                <div className="grid md:grid-cols-2 gap-8">
                                    {myHackathons.map((reg) => (
                                        <div key={reg.id} className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] overflow-hidden hover:border-fuchsia-500/50 transition-all group p-10 backdrop-blur-xl">
                                            <div className="flex flex-col lg:flex-row gap-10">
                                                <div className="w-full lg:w-48 h-48 rounded-3xl overflow-hidden bg-zinc-800 flex-shrink-0 shadow-2xl border border-white/5">
                                                    {reg.hackathon.bannerUrl ? (
                                                        <img src={reg.hackathon.bannerUrl} alt={reg.hackathon.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-zinc-700">
                                                            <Trophy className="w-16 h-16" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                                        <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-none group-hover:text-fuchsia-400 transition-colors">
                                                            {reg.hackathon.title}
                                                        </h3>
                                                        <span className={`self-start px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${reg.hackathon.status === 'registration_open' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                                            {reg.hackathon.status === 'registration_open' ? 'Enlisting Open' : reg.hackathon.status === 'completed' ? 'Mission Secured' : 'Operational'}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap gap-6 mt-8">
                                                        <div className="flex items-center gap-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                                            <Calendar className="w-5 h-5 text-violet-500" />
                                                            {new Date(reg.hackathon.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                                            <UsersIcon className="w-5 h-5 text-fuchsia-500" />
                                                            {reg.registrationType === 'individual' ? 'Solo Operative' : `Squad: ${reg.teamName}`}
                                                        </div>
                                                    </div>

                                                    {reg.registrationType === 'team' && reg.teamMembers && (
                                                        <div className="mt-8 pt-8 border-t border-white/5">
                                                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-4">Tactical Unit</p>
                                                            <div className="flex flex-wrap gap-3">
                                                                {reg.teamMembers.map(m => (
                                                                    <div key={m.id} title={m.email} className={`px-4 py-2 rounded-xl text-[10px] font-bold border ${m.isTeamLead ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20' : 'bg-zinc-800/50 text-zinc-400 border-white/5'}`}>
                                                                        {m.name} {m.isTeamLead && '👑'}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                     <div className="mt-10 flex flex-wrap items-center gap-6">
                                                         <Link href={`/hackathons/${reg.hackathon.id}/team`} className="group/btn inline-flex items-center gap-3 text-xs font-black italic uppercase text-white hover:text-fuchsia-400 transition-colors">
                                                             Command Center <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform" />
                                                         </Link>
                                                         
                                                         {reg.hackathon.status === 'completed' && !certificates.some(c => c.hackathonId === reg.hackathon.id) && (
                                                             <button 
                                                                onClick={() => handleGenerateCertificate(reg.hackathon.id)}
                                                                className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-amber-500/20 transform hover:-translate-y-1"
                                                             >
                                                                Claim Archive Record
                                                             </button>
                                                         )}
                                                     </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-32 bg-zinc-950/50 border border-zinc-900 rounded-[3rem] border-dashed">
                                    <Trophy className="w-16 h-16 text-zinc-800 mx-auto mb-6 opacity-20" />
                                    <h3 className="text-2xl font-bold text-zinc-600 mb-2 italic uppercase tracking-tighter">No Active Deployments</h3>
                                    <p className="text-zinc-700 mb-10 max-w-sm mx-auto font-medium font-mono text-[10px] uppercase tracking-[0.2em] leading-relaxed">You have not enlisted in any tactical theater. The arena demands your presence.</p>
                                    <Link href="/hackathons" className="px-10 py-4 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-[1.5rem] font-black italic uppercase transition-all shadow-2xl shadow-fuchsia-600/30">
                                        Browse Missions
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}
