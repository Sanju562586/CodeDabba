"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, ExternalLink, Loader2 } from "lucide-react";
import api from "@/lib/axios";

interface NotificationItem {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    link?: string;
    createdAt: string;
}

export function NotificationsDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = sessionStorage.getItem("access_token");
            if (!token) return;

            const { data } = await api.get("/notifications?limit=15");
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
        } catch (err) {
            // Ignore if unauthenticated
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (err) {
            console.error(err);
        }
    };

    const handleMarkAllAsRead = async () => {
        setLoading(true);
        try {
            await api.patch("/notifications/read-all");
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-xl transition-all"
                title="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink-500 rounded-full animate-pulse" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-sm">Notifications</h4>
                            {unreadCount > 0 && (
                                <span className="px-2 py-0.5 bg-pink-500/20 text-pink-400 border border-pink-500/30 text-[10px] font-bold rounded-full">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>

                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={handleMarkAllAsRead}
                                disabled={loading}
                                className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
                            >
                                <Check className="w-3.5 h-3.5" /> Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-zinc-800/60">
                        {notifications.length === 0 ? (
                            <div className="py-8 text-center text-xs text-zinc-500 italic">
                                No notifications yet
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                                    className={`p-4 transition-colors cursor-pointer ${
                                        n.isRead
                                            ? "bg-transparent hover:bg-zinc-900/30 text-zinc-400"
                                            : "bg-violet-950/20 hover:bg-violet-950/30 text-zinc-200 border-l-2 border-violet-500"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="font-semibold text-xs text-white">{n.title}</p>
                                        <span className="text-[10px] text-zinc-500 shrink-0">
                                            {new Date(n.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                                        {n.message}
                                    </p>
                                    {n.link && (
                                        <a
                                            href={n.link}
                                            className="mt-2 inline-flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 font-medium"
                                        >
                                            View Details <ExternalLink className="w-3 h-3" />
                                        </a>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
