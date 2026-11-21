"use client";

import { DashboardSidebar } from "@/components/DashboardSidebar";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute allowedRoles={['STUDENT']}>
            <div className="md:pl-20 pt-16 md:pt-0 min-h-screen bg-black text-white">
                <DashboardSidebar />
                {children}
            </div>
        </ProtectedRoute>
    );
}
