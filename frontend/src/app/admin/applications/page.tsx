"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from 'react-hot-toast';

interface MentorApplication {
    id: string;
    name: string;
    email: string;
    mobileNumber: string;
    linkedinProfile: string;
    portfolioUrl?: string;
    resumeFileId?: string;
    expertise: string;
    bio: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
}

export default function MentorApplicationsPage() {
    const [applications, setApplications] = useState<MentorApplication[]>([]);
    const [loadingApps, setLoadingApps] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        setLoadingApps(true);
        try {
            const { data } = await api.get('/mentor-applications');
            setApplications(data);
        } catch (error) {
            console.error("Failed to fetch applications", error);
            toast.error("Failed to load applications");
        } finally {
            setLoadingApps(false);
        }
    };

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        setActionLoading(id);
        try {
            await api.post(`/mentor-applications/${id}/${action}`);
            setApplications(apps => apps.map(app =>
                app.id === id ? { ...app, status: action === 'approve' ? 'APPROVED' : 'REJECTED' } : app
            ));
            toast.success(`Application ${action}d successfully`);
        } catch (error) {
            console.error(`Failed to ${action} application`, error);
            toast.error(`Failed to ${action} application`);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="w-full">
            <div className="container mx-auto px-6 py-24">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-pink-500 mb-2">Mentor Applications</h1>
                    <p className="text-zinc-400">Review and manage incoming mentor applications.</p>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                    {loadingApps ? (
                        <div className="p-12 flex justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                        </div>
                    ) : applications.length === 0 ? (
                        <div className="p-12 text-center text-zinc-500">
                            No mentor applications found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-zinc-400">
                                <thead className="bg-zinc-900 text-zinc-200 uppercase font-medium">
                                    <tr>
                                        <th className="px-6 py-4">Name</th>
                                        <th className="px-6 py-4">Contact</th>
                                        <th className="px-6 py-4">Expertise</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800">
                                    {applications.map((app) => (
                                        <tr key={app.id} className="hover:bg-zinc-800/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-white">
                                                {app.name}
                                                <div className="text-xs text-zinc-500">
                                                    Applied: {new Date(app.createdAt).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>{app.email}</div>
                                                <div>{app.mobileNumber}</div>
                                                <div className="flex gap-2 text-xs mt-1">
                                                    <a href={app.linkedinProfile} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">LinkedIn</a>
                                                    {app.portfolioUrl && (
                                                        <a href={app.portfolioUrl} target="_blank" rel="noreferrer" className="text-purple-400 hover:underline">Portfolio</a>
                                                    )}
                                                    {app.resumeFileId && (
                                                        <a href={`${api.defaults.baseURL}/files/${app.resumeFileId}`} target="_blank" rel="noreferrer" className="text-green-400 hover:underline">Resume</a>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 max-w-xs truncate" title={app.expertise}>
                                                {app.expertise}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${app.status === 'APPROVED' ? 'bg-green-500/10 text-green-400' :
                                                    app.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :
                                                        'bg-yellow-500/10 text-yellow-400'
                                                    }`}>
                                                    {app.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                {app.status === 'PENDING' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleAction(app.id, 'approve')}
                                                            disabled={!!actionLoading}
                                                            className="p-2 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors disabled:opacity-50"
                                                            title="Approve"
                                                        >
                                                            {actionLoading === app.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(app.id, 'reject')}
                                                            disabled={!!actionLoading}
                                                            className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                                            title="Reject"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
