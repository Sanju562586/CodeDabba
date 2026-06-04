"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Loader2, Users, ShieldAlert, Shield, User as UserIcon, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface User {
    id: string;
    email: string;
    name: string;
    role: 'STUDENT' | 'MENTOR' | 'ADMIN';
    mobileNumber?: string;
    createdAt: string;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/users');
            setUsers(data);
        } catch (error) {
            console.error("Failed to fetch users", error);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        setUpdatingUserId(userId);
        try {
            await api.patch(`/users/${userId}/role`, { role: newRole });
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
            toast.success(`Role updated successfully`);
        } catch (error) {
            console.error("Failed to update role", error);
            toast.error("Failed to update user role");
        } finally {
            setUpdatingUserId(null);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("Are you absolutely sure you want to permanently delete this user? This action cannot be undone.")) return;
        try {
            await api.delete(`/users/admin/${userId}`);
            setUsers(users.filter(u => u.id !== userId));
            toast.success("User deleted successfully");
        } catch (error) {
            console.error("Failed to delete user", error);
            toast.error("Failed to delete user");
        }
    };

    return (
        <div className="w-full">
            <div className="container mx-auto px-6 py-24">
                <div className="mb-12">
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-pink-400">
                        User Management
                    </h1>
                    <p className="text-zinc-400 mt-2">View all registered users and manage their roles.</p>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center p-24">
                            <Loader2 className="w-12 h-12 animate-spin text-violet-500" />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-24">
                            <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">No users found</h3>
                            <p className="text-zinc-400">There are no registered users on the platform.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-zinc-400">
                                <thead className="bg-zinc-900 text-zinc-200 uppercase font-medium">
                                    <tr>
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Contact</th>
                                        <th className="px-6 py-4">Role</th>
                                        <th className="px-6 py-4">Joined Date</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-zinc-800/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold shrink-0">
                                                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-white">{user.name || 'Unknown'}</div>
                                                        <div className="text-xs text-zinc-500">{user.id.substring(0, 8)}...</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-zinc-300">{user.email}</div>
                                                <div className="text-xs text-zinc-500">{user.mobileNumber || 'No mobile'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {user.role === 'ADMIN' ? (
                                                        <ShieldAlert className="w-4 h-4 text-pink-500" />
                                                    ) : user.role === 'MENTOR' ? (
                                                        <Shield className="w-4 h-4 text-violet-500" />
                                                    ) : (
                                                        <UserIcon className="w-4 h-4 text-blue-400" />
                                                    )}
                                                    <span className={`font-medium ${
                                                        user.role === 'ADMIN' ? 'text-pink-400' :
                                                        user.role === 'MENTOR' ? 'text-violet-400' :
                                                        'text-blue-400'
                                                    }`}>
                                                        {user.role}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {updatingUserId === user.id ? (
                                                        <div className="px-3 py-2 flex items-center">
                                                            <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
                                                        </div>
                                                    ) : (
                                                        <select
                                                            value={user.role}
                                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-300 focus:outline-none focus:border-violet-500 cursor-pointer text-sm"
                                                        >
                                                            <option value="STUDENT">Student</option>
                                                            <option value="MENTOR">Mentor</option>
                                                            <option value="ADMIN">Admin</option>
                                                        </select>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors border border-red-500/20"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
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
