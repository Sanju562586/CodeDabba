"use client";

import { DashboardSidebar } from "@/components/DashboardSidebar";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function MentorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute allowedRoles={['MENTOR']}>
            <div className="pl-20 min-h-screen bg-black text-white">
                <DashboardSidebar />
                {children}
            </div>
        </ProtectedRoute>
    );
}
