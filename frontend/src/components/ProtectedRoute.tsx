"use client";

import { useAuth } from "@/context/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, isLoading, role } = useAuth();
    const router = useRouter();
    const [isRedirecting, setIsRedirecting] = useState(false);

    useEffect(() => {
        if (isLoading) return;

        if (!user) {
            setIsRedirecting(true);
            router.push("/login");
            return;
        }

        if (allowedRoles && !allowedRoles.includes(role || "")) {
            setIsRedirecting(true);
            // Redirect to the appropriate dashboard for the user's actual role
            if (role === 'ADMIN') router.push("/admin/dashboard");
            else if (role === 'MENTOR') router.push("/mentor/dashboard");
            else router.push("/student/dashboard");
        }
    }, [user, isLoading, role, router, allowedRoles]);

    // Show spinner while auth is being determined
    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-black">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
                    <p className="text-sm font-medium text-zinc-500 animate-pulse">Verifying access...</p>
                </div>
            </div>
        );
    }

    // Show spinner while redirecting (role mismatch or unauthenticated)
    if (isRedirecting || !user || (allowedRoles && !allowedRoles.includes(role || ""))) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-black">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
                    <p className="text-sm font-medium text-zinc-500 animate-pulse">Redirecting...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
