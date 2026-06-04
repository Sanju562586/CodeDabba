"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
    LayoutDashboard, 
    BookOpen, 
    Trophy, 
    LogOut, 
    Code2,
    Users,
    ChevronRight,
    ClipboardList
} from "lucide-react";
import { useAuth } from "@/context/AuthProvider";
import { useState, useEffect } from "react";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";

export function DashboardSidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        document.body.classList.add('dashboard-active');
        return () => document.body.classList.remove('dashboard-active');
    }, []);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        await logout();
        setIsLoggingOut(false);
    };

    // Determine base path for the role
    const currentPath = pathname || "";
    let basePath = "/student";
    if (currentPath.startsWith("/admin")) basePath = "/admin";
    else if (currentPath.startsWith("/mentor")) basePath = "/mentor";

    const navItems = [
        { href: `${basePath}/dashboard`, icon: LayoutDashboard, label: "Dashboard" },
        { href: `${basePath}/courses`, icon: BookOpen, label: "Courses" },
        { href: `${basePath}/hackathons`, icon: Trophy, label: "Hackathons" },
        // Admin specific
        ...(basePath === "/admin" ? [
            { href: `/admin/users`, icon: Users, label: "Users" },
            { href: `/admin/applications`, icon: Code2, label: "Applications" },
            { href: `/admin/reviews`, icon: ClipboardList, label: "Reviews" },
        ] : []),
    ];

    const userInitial = user?.name?.charAt(0)?.toUpperCase() || "?";
    const roleLabel = basePath === "/admin" ? "Admin" : basePath === "/mentor" ? "Mentor" : "Student";

    return (
        <>
            {isLoggingOut && <FullScreenLoader message="Signing out..." />}
            <aside
                className="fixed top-0 left-0 bottom-0 z-50 flex flex-col bg-black/60 backdrop-blur-2xl border-r border-white/5 shadow-[4px_0_24px_rgba(0,0,0,0.3)] transition-all duration-300 overflow-hidden"
                style={{ width: isExpanded ? '16rem' : '5rem' }}
                onMouseEnter={() => setIsExpanded(true)}
                onMouseLeave={() => setIsExpanded(false)}
            >
                {/* Logo */}
                <div className="flex items-center h-20 px-5 shrink-0 border-b border-white/5">
                    <div className="p-2 rounded-lg bg-violet-600/10 border border-violet-500/20 shrink-0">
                        <Code2 className="w-5 h-5 text-violet-400" />
                    </div>
                    <div className="ml-3 overflow-hidden whitespace-nowrap" style={{ opacity: isExpanded ? 1 : 0, transition: 'opacity 0.2s' }}>
                        <span className="font-bold text-white text-base">CodeDabba</span>
                        <span className="block text-xs text-zinc-500">{roleLabel} Portal</span>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex-1 flex flex-col gap-1 px-3 py-6 overflow-y-auto overflow-x-hidden">
                    {navItems.map((item) => {
                        const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                title={!isExpanded ? item.label : undefined}
                                className={`flex items-center h-12 px-3 rounded-xl transition-all duration-300 shrink-0 group/item relative overflow-hidden ${
                                    isActive
                                    ? "text-white bg-white/5 border border-white/10 shadow-[inset_0_0_20px_rgba(139,92,246,0.15)]"
                                    : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5 border border-transparent"
                                }`}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-500 to-fuchsia-500 rounded-r-full" />
                                )}
                                <Icon className={`w-5 h-5 shrink-0 transition-transform duration-300 ${isActive ? 'text-fuchsia-400' : 'group-hover/item:scale-110'}`} />
                                <span
                                    className="ml-3 font-medium whitespace-nowrap text-sm overflow-hidden"
                                    style={{ opacity: isExpanded ? 1 : 0, transition: 'opacity 0.15s', maxWidth: isExpanded ? '160px' : '0' }}
                                >
                                    {item.label}
                                </span>
                                {isActive && isExpanded && (
                                    <ChevronRight className="w-4 h-4 ml-auto text-fuchsia-400" />
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* User section + logout */}
                <div className="p-3 shrink-0 border-t border-white/5 space-y-1">
                    {/* User avatar row */}
                    <div className="flex items-center px-3 h-12 gap-3 overflow-hidden cursor-pointer group">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform">
                            {userInitial}
                        </div>
                        <div
                            className="overflow-hidden whitespace-nowrap"
                            style={{ opacity: isExpanded ? 1 : 0, transition: 'opacity 0.15s' }}
                        >
                            <p className="text-xs font-semibold text-white truncate max-w-[120px]">{user?.name}</p>
                            <p className="text-xs text-zinc-500 truncate max-w-[120px]">{user?.email}</p>
                        </div>
                    </div>

                    {/* Logout button */}
                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        title={!isExpanded ? "Sign Out" : undefined}
                        className="flex items-center w-full h-11 px-3 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/8 border border-transparent transition-all"
                    >
                        <LogOut className="w-5 h-5 shrink-0" />
                        <span
                            className="ml-3 font-medium whitespace-nowrap text-sm"
                            style={{ opacity: isExpanded ? 1 : 0, transition: 'opacity 0.15s' }}
                        >
                            Sign Out
                        </span>
                    </button>
                </div>
            </aside>
        </>
    );
}
