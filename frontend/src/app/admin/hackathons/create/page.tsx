"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { NavBar } from "@/components/landing/NavBar";
import { useState } from "react";
import api from "@/lib/axios";
import { Plus, Trash2, Save, Info, Calendar, Users, ListChecks, ArrowLeft, Loader2, Sparkles, Wand2, Check, Shield, UserCheck, Clock, MessageSquare, Trophy, CreditCard } from "lucide-react";
import { toast } from 'react-hot-toast';
import { useRouter } from "next/navigation";
import Link from "next/link";
import MarkdownEditor from "@/components/MarkdownEditor";

interface Round {
    title: string;
    description: string;
    submissionStart: string;
    submissionEnd: string;
    evaluationStart: string;
    evaluationEnd: string;
    resultTime: string;
    isElimination: boolean;
    eliminationThreshold: number | null;
    eliminationCount: number;
    weightagePercentage: number;
    allowDocument: boolean;
    allowGithub: boolean;
    allowVideo: boolean;
    allowDescription: boolean;
    maxFileSizeMb: number;
    allowedFileTypes: string[];
    isPaymentRequired: boolean;
    paymentAmount: number | string;
    paymentDeadline: string;
    paymentDeadlineType: 'submissionStart' | 'teamFormation' | 'approvalPhase' | 'custom';
    paymentDeadlineDate: string;
    paymentType: 'ALL_TEAMS' | 'QUALIFIED_ONLY';
    refundAllowed: boolean;
}

export default function CreateHackathonPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [activeSection, setActiveSection] = useState<'basic' | 'timeline' | 'participation' | 'pricing' | 'rounds'>('basic');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        bannerUrl: '',
        bannerFile: null as File | null,
        rules: '',
        evaluationCriteria: '',
        registrationStart: '',
        registrationEnd: '',
        mentorSelectionStart: '',
        mentorSelectionEnd: '',
        approvalStart: '',
        approvalEnd: '',
        maxTeamSize: 1,
        maxParticipants: 0,
        allowIndividual: true,
        allowTeam: true,
        isPaid: false,
        registrationFee: '',
        paymentDeadlineType: 'custom' as 'teamFormation' | 'approvalPhase' | 'custom',
        paymentDeadlineDate: '',
        currency: 'INR',
        refundPolicy: '',
    });

    const [rounds, setRounds] = useState<Round[]>([
        {
            title: 'Idea Phase',
            description: '',
            submissionStart: '',
            submissionEnd: '',
            evaluationStart: '',
            evaluationEnd: '',
            resultTime: '',
            isElimination: false,
            eliminationThreshold: 0,
            eliminationCount: 0,
            weightagePercentage: 20,
            allowDocument: true,
            allowGithub: false,
            allowVideo: false,
            allowDescription: true,
            maxFileSizeMb: 50,
            allowedFileTypes: ['ppt', 'pptx'],
            isPaymentRequired: false,
            paymentAmount: '',
            paymentDeadline: '',
            paymentDeadlineType: 'custom' as 'submissionStart' | 'teamFormation' | 'approvalPhase' | 'custom',
            paymentDeadlineDate: '',
            paymentType: 'ALL_TEAMS',
            refundAllowed: false
        }
    ]);

    const handleAddRound = () => {
        setRounds([...rounds, {
            title: '',
            description: '',
            submissionStart: '',
            submissionEnd: '',
            evaluationStart: '',
            evaluationEnd: '',
            resultTime: '',
            isElimination: false,
            eliminationThreshold: 0,
            eliminationCount: 0,
            weightagePercentage: 0,
            allowDocument: true,
            allowGithub: false,
            allowVideo: false,
            allowDescription: true,
            maxFileSizeMb: 50,
            allowedFileTypes: ['ppt', 'pptx'],
            isPaymentRequired: false,
            paymentAmount: '',
            paymentDeadline: '',
            paymentDeadlineType: 'custom' as 'submissionStart' | 'teamFormation' | 'approvalPhase' | 'custom',
            paymentDeadlineDate: '',
            paymentType: 'ALL_TEAMS',
            refundAllowed: false
        }]);
    };

    const handleRemoveRound = (index: number) => {
        if (rounds.length === 1) {
            toast.error("At least one round is required");
            return;
        }
        setRounds(rounds.filter((_, i) => i !== index));
    };

    const handleRoundChange = (index: number, field: keyof Round, value: any) => {
        const newRounds = [...rounds];
        newRounds[index] = { ...newRounds[index], [field]: value };
        setRounds(newRounds);
    };

    const handleSubmit = async () => {
        // Basic Validations
        if (!formData.title || !formData.description) {
            toast.error("Please fill in basic info");
            setActiveSection('basic');
            return;
        }

        // Timeline check
        if (!formData.registrationStart || !formData.registrationEnd) {
            toast.error("Please fill in registration window");
            setActiveSection('timeline');
            return;
        }

        // Rounds check
        const totalWeight = rounds.reduce((sum, r) => sum + Number(r.weightagePercentage), 0);
        if (totalWeight !== 100) {
            toast.error(`Total weightage must be 100% (Current: ${totalWeight}%)`);
            setActiveSection('rounds');
            return;
        }

        // Pricing Validation
        let computedGlobalDeadline = formData.paymentDeadlineDate;
        if (formData.isPaid) {
            if (!formData.registrationFee || Number(formData.registrationFee) <= 0) {
                toast.error("Please enter a valid Registration Fee");
                setActiveSection('pricing');
                return;
            }
            if (formData.paymentDeadlineType === 'teamFormation') computedGlobalDeadline = formData.mentorSelectionStart;
            else if (formData.paymentDeadlineType === 'approvalPhase') computedGlobalDeadline = formData.approvalStart;

            if (!computedGlobalDeadline) {
                toast.error("Please select a valid Payment Deadline for Registration");
                setActiveSection('pricing');
                return;
            }
        }

        // Round Payment Validation
        const formattedRounds = [];
        for (let i = 0; i < rounds.length; i++) {
            const r = rounds[i];
            let computedRoundDeadline = r.paymentDeadlineDate;

            if (r.isPaymentRequired) {
                if (!r.paymentAmount || Number(r.paymentAmount) <= 0) {
                    toast.error(`Please enter a valid Fee Amount for Round ${i + 1}`);
                    setActiveSection('rounds');
                    return;
                }
                if (r.paymentDeadlineType === 'submissionStart') computedRoundDeadline = r.submissionStart;

                if (!computedRoundDeadline) {
                    toast.error(`Please select a valid Payment Deadline for Round ${i + 1}`);
                    setActiveSection('rounds');
                    return;
                }
            }
            
            formattedRounds.push({ ...r, computedRoundDeadline });
        }

        setLoading(true);
        try {
            let bannerUrl = formData.bannerUrl;

            if (formData.bannerFile) {
                // 1. Get Signature
                const { data: signData } = await api.post('/hackathons/upload-banner', {
                    filename: formData.bannerFile.name,
                    contentType: formData.bannerFile.type
                });

                const { uploadUrl, signature, timestamp, apiKey, publicId } = signData;

                // 2. Upload to Cloudinary
                const uploadFormData = new FormData();
                uploadFormData.append('file', formData.bannerFile);
                uploadFormData.append('api_key', apiKey);
                uploadFormData.append('timestamp', timestamp.toString());
                uploadFormData.append('signature', signature);
                uploadFormData.append('public_id', publicId);

                const cloudinaryRes = await fetch(uploadUrl, {
                    method: 'POST',
                    body: uploadFormData,
                });

                const cloudinaryData = await cloudinaryRes.json();
                if (cloudinaryData.error) throw new Error(cloudinaryData.error.message);
                bannerUrl = cloudinaryData.secure_url;
            }

            const { bannerFile, ...restFormData } = formData;
            const payload = {
                ...restFormData,
                bannerUrl,
                registrationFee: formData.isPaid ? Number(formData.registrationFee) : null,
                paymentDeadline: formData.isPaid ? computedGlobalDeadline : null,
                maxParticipants: formData.maxParticipants || undefined,
                rounds: formattedRounds.map(r => ({
                    ...r,
                    weightagePercentage: Number(r.weightagePercentage),
                    eliminationThreshold: r.isElimination ? Number(r.eliminationThreshold) : null,
                    eliminationCount: Number(r.eliminationCount),
                    maxFileSizeMb: Number(r.maxFileSizeMb),
                    paymentAmount: r.isPaymentRequired ? Number(r.paymentAmount) : null,
                    paymentDeadline: r.isPaymentRequired ? r.computedRoundDeadline : null,
                    paymentType: r.isPaymentRequired ? r.paymentType : null
                }))
            };

            const { data } = await api.post('/hackathons', payload);
            toast.success("Hackathon created successfully!");
            router.push('/admin/hackathons');
        } catch (error: any) {
            console.error("Create failed", error);
            toast.error(error.response?.data?.message || error.message || "Failed to create hackathon");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ProtectedRoute allowedRoles={['ADMIN']}>
            <div className="min-h-screen bg-black text-white">
                <NavBar />
                <div className="container mx-auto px-6 py-24">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-12">
                        <div className="flex items-center gap-6">
                            <Link href="/admin/hackathons" className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-all">
                                <ArrowLeft className="w-6 h-6" />
                            </Link>
                            <div>
                                <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                                    Launch New Hackathon
                                    <Sparkles className="w-8 h-8 text-violet-500 animate-pulse" />
                                </h1>
                                <p className="text-zinc-500 mt-1">Define the future of innovation</p>
                            </div>
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex items-center gap-2 px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-violet-600/20 disabled:opacity-50 active:scale-95"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Wand2 className="w-6 h-6" />}
                            Initialize Hackathon
                        </button>
                    </div>

                    <div className="grid lg:grid-cols-4 gap-12">
                        {/* Sidebar Navigation */}
                        <aside className="space-y-2">
                            <button
                                onClick={() => setActiveSection('basic')}
                                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-left transition-all ${activeSection === 'basic' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' : 'bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 text-white'}`}
                            >
                                <Info className="w-5 h-5" />
                                <span className="font-bold">Basic Info</span>
                            </button>
                            <button
                                onClick={() => setActiveSection('timeline')}
                                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-left transition-all ${activeSection === 'timeline' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' : 'bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800'}`}
                            >
                                <Calendar className="w-5 h-5" />
                                <span className="font-bold">Timeline</span>
                            </button>
                            <button
                                onClick={() => setActiveSection('participation')}
                                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-left transition-all ${activeSection === 'participation' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' : 'bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800'}`}
                            >
                                <Users className="w-5 h-5" />
                                <span className="font-bold">Participation</span>
                            </button>
                            <button
                                onClick={() => setActiveSection('pricing')}
                                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-left transition-all ${activeSection === 'pricing' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' : 'bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800'}`}
                            >
                                <CreditCard className="w-5 h-5" />
                                <span className="font-bold">Pricing</span>
                            </button>
                            <button
                                onClick={() => setActiveSection('rounds')}
                                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-left transition-all ${activeSection === 'rounds' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' : 'bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800'}`}
                            >
                                <ListChecks className="w-5 h-5" />
                                <span className="font-bold">Round Builder</span>
                            </button>
                        </aside>

                        {/* Form Content */}
                        <div className="lg:col-span-3">
                            <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-10 backdrop-blur-sm">
                                {activeSection === 'basic' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                        <div className="grid gap-6">
                                            <label className="block">
                                                <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Hackathon Title</span>
                                                <input
                                                    type="text"
                                                    value={formData.title}
                                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                    placeholder="e.g., CodeDabba Genesis 2024"
                                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-violet-500 transition-all outline-none text-lg"
                                                />
                                            </label>

                                            <label className="block">
                                                <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Banner Image</span>
                                                <div className="relative group">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            if (e.target.files?.[0]) {
                                                                setFormData({ ...formData, bannerFile: e.target.files[0] });
                                                            }
                                                        }}
                                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-violet-500 transition-all outline-none file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-violet-600 file:text-white hover:file:bg-violet-700"
                                                    />
                                                </div>
                                                {formData.bannerFile && (
                                                    <p className="text-xs text-violet-400 mt-2 font-medium flex items-center gap-2">
                                                        <Check className="w-3 h-3" /> Selected: {formData.bannerFile.name}
                                                    </p>
                                                )}
                                            </label>
                                        </div>

                                        <div>
                                            <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Description</span>
                                            <MarkdownEditor
                                                value={formData.description}
                                                onChange={(val) => setFormData({ ...formData, description: val })}
                                                placeholder="What is this hackathon about?"
                                            />
                                        </div>

                                        <div>
                                            <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Rules & Regulations</span>
                                            <MarkdownEditor
                                                value={formData.rules}
                                                onChange={(val) => setFormData({ ...formData, rules: val })}
                                                placeholder="List the laws of your battlefield..."
                                            />
                                        </div>

                                        <div>
                                            <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Evaluation Criteria</span>
                                            <MarkdownEditor
                                                value={formData.evaluationCriteria}
                                                onChange={(val) => setFormData({ ...formData, evaluationCriteria: val })}
                                                placeholder="How will the warriors be judged?"
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeSection === 'timeline' && (
                                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
                                         <div className="grid md:grid-cols-2 gap-10">
                                            <div className="space-y-6">
                                                <h3 className="text-xl font-bold text-violet-400 flex items-center gap-2">
                                                    <Calendar className="w-5 h-5" />
                                                    Registration Phase
                                                </h3>
                                                <div className="grid gap-6">
                                                    <label className="block">
                                                        <span className="text-xs font-bold text-zinc-500 uppercase mb-2 block tracking-widest">Start Time</span>
                                                        <input
                                                            type="datetime-local"
                                                            value={formData.registrationStart}
                                                            onChange={(e) => setFormData({ ...formData, registrationStart: e.target.value })}
                                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-violet-500 outline-none"
                                                        />
                                                    </label>
                                                    <label className="block">
                                                        <span className="text-xs font-bold text-zinc-500 uppercase mb-2 block tracking-widest">Deadline</span>
                                                        <input
                                                            type="datetime-local"
                                                            value={formData.registrationEnd}
                                                            onChange={(e) => setFormData({ ...formData, registrationEnd: e.target.value })}
                                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-violet-500 outline-none"
                                                        />
                                                    </label>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <h3 className="text-xl font-bold text-indigo-400 flex items-center gap-2">
                                                    <UserCheck className="w-5 h-5" />
                                                    Mentor Selection Phase
                                                </h3>
                                                <div className="grid gap-6">
                                                    <label className="block">
                                                        <span className="text-xs font-bold text-zinc-500 uppercase mb-2 block tracking-widest">Start Time</span>
                                                        <input
                                                            type="datetime-local"
                                                            value={formData.mentorSelectionStart}
                                                            onChange={(e) => setFormData({ ...formData, mentorSelectionStart: e.target.value })}
                                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none"
                                                        />
                                                    </label>
                                                    <label className="block">
                                                        <span className="text-xs font-bold text-zinc-500 uppercase mb-2 block tracking-widest">End Time</span>
                                                        <input
                                                            type="datetime-local"
                                                            value={formData.mentorSelectionEnd}
                                                            onChange={(e) => setFormData({ ...formData, mentorSelectionEnd: e.target.value })}
                                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none"
                                                        />
                                                    </label>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <h3 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                                                    <Shield className="w-5 h-5" />
                                                    Squad Approval Phase
                                                </h3>
                                                <div className="grid gap-6">
                                                    <label className="block">
                                                        <span className="text-xs font-bold text-zinc-500 uppercase mb-2 block tracking-widest">Start Time</span>
                                                        <input
                                                            type="datetime-local"
                                                            value={formData.approvalStart}
                                                            onChange={(e) => setFormData({ ...formData, approvalStart: e.target.value })}
                                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-emerald-500 outline-none"
                                                        />
                                                    </label>
                                                    <label className="block">
                                                        <span className="text-xs font-bold text-zinc-500 uppercase mb-2 block tracking-widest">End Time</span>
                                                        <input
                                                            type="datetime-local"
                                                            value={formData.approvalEnd}
                                                            onChange={(e) => setFormData({ ...formData, approvalEnd: e.target.value })}
                                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-emerald-500 outline-none"
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeSection === 'participation' && (
                                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                                        <div className="grid md:grid-cols-2 gap-10">
                                            <label className="block">
                                                <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Maximum Team Size</span>
                                                <input
                                                    type="number"
                                                    value={formData.maxTeamSize}
                                                    onChange={(e) => setFormData({ ...formData, maxTeamSize: Number(e.target.value) })}
                                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-violet-500 outline-none"
                                                    min="1"
                                                />
                                            </label>
                                            <label className="block">
                                                <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Participant Cap (Optional)</span>
                                                <input
                                                    type="number"
                                                    value={formData.maxParticipants}
                                                    onChange={(e) => setFormData({ ...formData, maxParticipants: Number(e.target.value) })}
                                                    placeholder="Leave empty for no limit"
                                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-violet-500 outline-none"
                                                    min="0"
                                                />
                                            </label>
                                        </div>

                                        <div className="p-8 bg-zinc-950/50 rounded-[2rem] border border-zinc-800 space-y-6">
                                            <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Registration Modes</p>
                                            <div className="flex flex-wrap gap-8">
                                                <label className="flex items-center gap-4 cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.allowIndividual}
                                                        onChange={(e) => setFormData({ ...formData, allowIndividual: e.target.checked })}
                                                        className="w-6 h-6 rounded border-zinc-700 bg-zinc-900 text-violet-500 focus:ring-violet-500"
                                                    />
                                                    <span className="text-zinc-200 group-hover:text-white transition-colors font-medium">Allow Solo Players</span>
                                                </label>
                                                <label className="flex items-center gap-4 cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.allowTeam}
                                                        onChange={(e) => setFormData({ ...formData, allowTeam: e.target.checked })}
                                                        className="w-6 h-6 rounded border-zinc-700 bg-zinc-900 text-violet-500 focus:ring-violet-500"
                                                    />
                                                    <span className="text-zinc-200 group-hover:text-white transition-colors font-medium">Allow Teams</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeSection === 'pricing' && (
                                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                                        <div className="p-8 bg-zinc-950/50 rounded-[2rem] border border-zinc-800 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-xl font-bold text-white">Global Entrance Fee</h3>
                                                    <p className="text-zinc-500 text-sm mt-1">Require teams to pay a registration fee before accessing the Hackathon.</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="sr-only peer" checked={formData.isPaid} onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })} />
                                                    <div className="w-14 h-7 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-violet-600"></div>
                                                </label>
                                            </div>

                                            {formData.isPaid && (
                                                <div className="grid md:grid-cols-2 gap-8 pt-6 border-t border-zinc-800 animate-in fade-in">
                                                    <label className="block">
                                                        <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Registration Fee (₹)</span>
                                                        <input
                                                            type="number"
                                                            value={formData.registrationFee}
                                                            onChange={(e) => setFormData({ ...formData, registrationFee: e.target.value })}
                                                            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-violet-500 outline-none"
                                                            placeholder="e.g., 500"
                                                            min="0"
                                                        />
                                                    </label>
                                                    <label className="block">
                                                        <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Currency</span>
                                                        <input
                                                            type="text"
                                                            value={formData.currency}
                                                            disabled
                                                            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-6 py-4 text-zinc-500 outline-none cursor-not-allowed"
                                                        />
                                                    </label>
                                                    <label className="block md:col-span-2">
                                                        <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Payment Deadline</span>
                                                        <div className="flex flex-col gap-4 bg-zinc-950 p-6 rounded-2xl border border-zinc-800">
                                                            <label className="flex items-center gap-3 cursor-pointer">
                                                                <input type="radio" name="global-deadline" className="w-4 h-4 text-violet-500 bg-zinc-900 border-zinc-700 focus:ring-violet-500" 
                                                                    checked={formData.paymentDeadlineType === 'teamFormation'} 
                                                                    onChange={() => setFormData({ ...formData, paymentDeadlineType: 'teamFormation' })} 
                                                                />
                                                                <span className="text-zinc-300">Before Team Formation (Start of Mentor Selection)</span>
                                                            </label>
                                                            <label className="flex items-center gap-3 cursor-pointer">
                                                                <input type="radio" name="global-deadline" className="w-4 h-4 text-violet-500 bg-zinc-900 border-zinc-700 focus:ring-violet-500" 
                                                                    checked={formData.paymentDeadlineType === 'approvalPhase'} 
                                                                    onChange={() => setFormData({ ...formData, paymentDeadlineType: 'approvalPhase' })} 
                                                                />
                                                                <span className="text-zinc-300">Before Approval Phase (Start of Squad Approval)</span>
                                                            </label>
                                                            <label className="flex items-center gap-3 cursor-pointer">
                                                                <input type="radio" name="global-deadline" className="w-4 h-4 text-violet-500 bg-zinc-900 border-zinc-700 focus:ring-violet-500" 
                                                                    checked={formData.paymentDeadlineType === 'custom'} 
                                                                    onChange={() => setFormData({ ...formData, paymentDeadlineType: 'custom' })} 
                                                                />
                                                                <span className="text-zinc-300">Custom Date-Time</span>
                                                            </label>
                                                            
                                                            {formData.paymentDeadlineType === 'custom' && (
                                                                <div className="mt-2 pl-7 animate-in fade-in slide-in-from-top-1">
                                                                    <input
                                                                        type="datetime-local"
                                                                        value={formData.paymentDeadlineDate}
                                                                        onChange={(e) => setFormData({ ...formData, paymentDeadlineDate: e.target.value })}
                                                                        className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-violet-500 outline-none"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </label>
                                                    <label className="block md:col-span-2">
                                                        <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Refund Policy</span>
                                                        <textarea
                                                            value={formData.refundPolicy}
                                                            onChange={(e) => setFormData({ ...formData, refundPolicy: e.target.value })}
                                                            placeholder="State the terms and conditions..."
                                                            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-violet-500 outline-none min-h-[100px]"
                                                        />
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeSection === 'rounds' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Competition Rounds</p>
                                            <button
                                                onClick={handleAddRound}
                                                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition-all"
                                            >
                                                <Plus className="w-4 h-4" /> Add Round
                                            </button>
                                        </div>

                                        <div className="space-y-6">
                                            {rounds.map((round, idx) => (
                                                <div key={idx} className="relative group p-8 bg-zinc-950/50 border border-zinc-800 rounded-[2rem] hover:border-violet-500/30 transition-all">
                                                    <div className="absolute -left-4 top-8 w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center font-bold text-sm shadow-lg shadow-violet-600/20">
                                                        {idx + 1}
                                                    </div>

                                                    <div className="flex justify-between items-start mb-6 pl-2">
                                                        <div className="flex-1 mr-4">
                                                            <input
                                                                type="text"
                                                                value={round.title}
                                                                onChange={(e) => handleRoundChange(idx, 'title', e.target.value)}
                                                                placeholder="Round Title (e.g., Idea Pitch)"
                                                                className="w-full bg-transparent border-b border-zinc-800 py-2 text-xl font-bold text-white focus:border-violet-500 outline-none"
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveRound(idx)}
                                                            className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>

                                                    <div className="grid md:grid-cols-2 gap-8 pl-2">
                                                        <div className="space-y-6">
                                                            <div className="grid grid-cols-2 gap-4 p-4 bg-zinc-900/30 rounded-2xl border border-zinc-800">
                                                                <div className="col-span-2 flex items-center gap-2 text-[10px] font-black text-violet-400 uppercase tracking-widest mb-2">
                                                                    <Clock className="w-3.5 h-3.5" /> Phase 1: Submission Window
                                                                </div>
                                                                <label className="block">
                                                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Start</span>
                                                                    <input
                                                                        type="datetime-local"
                                                                        value={round.submissionStart}
                                                                        onChange={(e) => handleRoundChange(idx, 'submissionStart', e.target.value)}
                                                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none"
                                                                    />
                                                                </label>
                                                                <label className="block">
                                                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">End</span>
                                                                    <input
                                                                        type="datetime-local"
                                                                        value={round.submissionEnd}
                                                                        onChange={(e) => handleRoundChange(idx, 'submissionEnd', e.target.value)}
                                                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none"
                                                                    />
                                                                </label>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-4 p-4 bg-zinc-900/30 rounded-2xl border border-zinc-800">
                                                                <div className="col-span-2 flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">
                                                                    <MessageSquare className="w-3.5 h-3.5" /> Phase 2: Evaluation Window
                                                                </div>
                                                                <label className="block">
                                                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Start</span>
                                                                    <input
                                                                        type="datetime-local"
                                                                        value={round.evaluationStart}
                                                                        onChange={(e) => handleRoundChange(idx, 'evaluationStart', e.target.value)}
                                                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none"
                                                                    />
                                                                </label>
                                                                <label className="block">
                                                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">End</span>
                                                                    <input
                                                                        type="datetime-local"
                                                                        value={round.evaluationEnd}
                                                                        onChange={(e) => handleRoundChange(idx, 'evaluationEnd', e.target.value)}
                                                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none"
                                                                    />
                                                                </label>
                                                            </div>

                                                            <div className="p-4 bg-zinc-900/30 rounded-2xl border border-zinc-800">
                                                                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-4">
                                                                    <Trophy className="w-3.5 h-3.5" /> Phase 3: Results & Survival Time
                                                                </div>
                                                                <label className="block">
                                                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Result Declaration Time</span>
                                                                    <input
                                                                        type="datetime-local"
                                                                        value={round.resultTime}
                                                                        onChange={(e) => handleRoundChange(idx, 'resultTime', e.target.value)}
                                                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none"
                                                                    />
                                                                </label>
                                                            </div>

                                                            <div className="flex gap-6">
                                                                <label className="block flex-1">
                                                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Weightage (%)</span>
                                                                    <input
                                                                        type="number"
                                                                        value={round.weightagePercentage}
                                                                        onChange={(e) => handleRoundChange(idx, 'weightagePercentage', e.target.value)}
                                                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none"
                                                                    />
                                                                </label>
                                                                <div className="flex-1">
                                                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Rules</span>
                                                                    <div className="space-y-4">
                                                                        <label className="flex items-center gap-2 mt-3 cursor-pointer">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={round.isElimination}
                                                                                onChange={(e) => handleRoundChange(idx, 'isElimination', e.target.checked)}
                                                                                className="w-5 h-5 rounded border-zinc-700 bg-zinc-900 text-red-500 focus:ring-red-500"
                                                                            />
                                                                            <span className="text-sm text-zinc-400">Elimination Round</span>
                                                                        </label>
                                                                        {round.isElimination && (
                                                                            <label className="block animate-in fade-in slide-in-from-top-1">
                                                                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Min Score to Survive</span>
                                                                                <input
                                                                                    type="number"
                                                                                    value={round.eliminationThreshold || 0}
                                                                                    onChange={(e) => handleRoundChange(idx, 'eliminationThreshold', e.target.value)}
                                                                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-500/50"
                                                                                    placeholder="Score 0-100"
                                                                                />
                                                                            </label>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 space-y-4">
                                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Submission Requirements</p>
                                                            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                                                                <label className="flex items-center gap-2 cursor-pointer">
                                                                    <input type="checkbox" checked={round.allowDocument} onChange={(e) => handleRoundChange(idx, 'allowDocument', e.target.checked)} className="rounded border-zinc-700 bg-zinc-900" />
                                                                    <span className="text-xs text-zinc-400">PDF / PPT (Pitch Deck)</span>
                                                                </label>
                                                                <label className="flex items-center gap-2 cursor-pointer">
                                                                    <input type="checkbox" checked={round.allowGithub} onChange={(e) => handleRoundChange(idx, 'allowGithub', e.target.checked)} className="rounded border-zinc-700 bg-zinc-900" />
                                                                    <span className="text-xs text-zinc-400">GitHub Link</span>
                                                                </label>
                                                                <label className="flex items-center gap-2 cursor-pointer">
                                                                    <input type="checkbox" checked={round.allowVideo} onChange={(e) => handleRoundChange(idx, 'allowVideo', e.target.checked)} className="rounded border-zinc-700 bg-zinc-900" />
                                                                    <span className="text-xs text-zinc-400">Demo Video</span>
                                                                </label>
                                                                <label className="flex items-center gap-2 cursor-pointer">
                                                                    <input type="checkbox" checked={round.allowDescription} onChange={(e) => handleRoundChange(idx, 'allowDescription', e.target.checked)} className="rounded border-zinc-700 bg-zinc-900" />
                                                                    <span className="text-xs text-zinc-400">Description</span>
                                                                </label>
                                                            </div>
                                                        </div>

                                                        <div className="mt-8 pt-8 border-t border-zinc-800 md:col-span-2">
                                                            <div className="flex items-center justify-between mb-6">
                                                                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2"><CreditCard className="w-4 h-4"/> Payment Settings</p>
                                                                <label className="relative inline-flex items-center cursor-pointer">
                                                                    <span className="mr-3 text-xs font-bold text-zinc-400 uppercase">Require Payment for this Round</span>
                                                                    <input type="checkbox" className="sr-only peer" checked={round.isPaymentRequired} onChange={(e) => handleRoundChange(idx, 'isPaymentRequired', e.target.checked)} />
                                                                    <div className="w-9 h-5 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                                                                </label>
                                                            </div>
                                                            
                                                            {round.isPaymentRequired && (
                                                                <div className="grid md:grid-cols-2 gap-6 animate-in fade-in">
                                                                    <label className="block">
                                                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Fee Amount (₹)</span>
                                                                        <input
                                                                            type="number"
                                                                            value={round.paymentAmount}
                                                                            onChange={(e) => handleRoundChange(idx, 'paymentAmount', e.target.value)}
                                                                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500/50"
                                                                            placeholder="e.g. 200"
                                                                            min="0"
                                                                        />
                                                                    </label>
                                                                    <div className="block md:col-span-2">
                                                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Payment Deadline</span>
                                                                        <div className="flex flex-col gap-4 bg-zinc-950 p-6 rounded-xl border border-zinc-800">
                                                                            <label className="flex items-center gap-3 cursor-pointer">
                                                                                <input type="radio" name={`round-deadline-${idx}`} className="w-4 h-4 text-emerald-500 bg-zinc-900 border-zinc-700 focus:ring-emerald-500" 
                                                                                    checked={round.paymentDeadlineType === 'submissionStart'} 
                                                                                    onChange={() => handleRoundChange(idx, 'paymentDeadlineType', 'submissionStart')} 
                                                                                />
                                                                                <span className="text-zinc-300 text-sm">Before Submission Start</span>
                                                                            </label>
                                                                            <label className="flex items-center gap-3 cursor-pointer">
                                                                                <input type="radio" name={`round-deadline-${idx}`} className="w-4 h-4 text-emerald-500 bg-zinc-900 border-zinc-700 focus:ring-emerald-500" 
                                                                                    checked={round.paymentDeadlineType === 'custom'} 
                                                                                    onChange={() => handleRoundChange(idx, 'paymentDeadlineType', 'custom')} 
                                                                                />
                                                                                <span className="text-zinc-300 text-sm">Custom Date-Time</span>
                                                                            </label>
                                                                            
                                                                            {round.paymentDeadlineType === 'custom' && (
                                                                                <div className="mt-2 pl-7 animate-in fade-in slide-in-from-top-1">
                                                                                    <input
                                                                                        type="datetime-local"
                                                                                        value={round.paymentDeadlineDate}
                                                                                        onChange={(e) => handleRoundChange(idx, 'paymentDeadlineDate', e.target.value)}
                                                                                        className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-emerald-500/50"
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <div className="block md:col-span-2 grid md:grid-cols-2 gap-6">
                                                                        <div>
                                                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Who Pays?</span>
                                                                            <div className="flex gap-4">
                                                                                <label className="flex items-center gap-2 cursor-pointer">
                                                                                    <input type="radio" name={`payType-${idx}`} checked={round.paymentType === 'ALL_TEAMS'} onChange={() => handleRoundChange(idx, 'paymentType', 'ALL_TEAMS')} className="text-emerald-500 focus:ring-emerald-500 bg-zinc-900 border-zinc-700 w-4 h-4" />
                                                                                    <span className="text-sm text-zinc-400 font-medium">All Approved Teams</span>
                                                                                </label>
                                                                                <label className="flex items-center gap-2 cursor-pointer">
                                                                                    <input type="radio" name={`payType-${idx}`} checked={round.paymentType === 'QUALIFIED_ONLY'} onChange={() => handleRoundChange(idx, 'paymentType', 'QUALIFIED_ONLY')} className="text-emerald-500 focus:ring-emerald-500 bg-zinc-900 border-zinc-700 w-4 h-4" />
                                                                                    <span className="text-sm text-zinc-400 font-medium">Only Qualified Teams</span>
                                                                                </label>
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Refund Allowed</span>
                                                                            <div className="flex gap-4">
                                                                                <label className="flex items-center gap-2 cursor-pointer">
                                                                                    <input type="radio" name={`refundAllowed-${idx}`} checked={round.refundAllowed === true} onChange={() => handleRoundChange(idx, 'refundAllowed', true)} className="text-emerald-500 focus:ring-emerald-500 bg-zinc-900 border-zinc-700 w-4 h-4" />
                                                                                    <span className="text-sm text-zinc-400 font-medium">Yes</span>
                                                                                </label>
                                                                                <label className="flex items-center gap-2 cursor-pointer">
                                                                                    <input type="radio" name={`refundAllowed-${idx}`} checked={round.refundAllowed === false} onChange={() => handleRoundChange(idx, 'refundAllowed', false)} className="text-emerald-500 focus:ring-emerald-500 bg-zinc-900 border-zinc-700 w-4 h-4" />
                                                                                    <span className="text-sm text-zinc-400 font-medium">No</span>
                                                                                </label>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
