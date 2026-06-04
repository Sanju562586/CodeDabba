"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Trash2, UserMinus } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";


interface Student {
    userId: string;
    name: string;
    email: string;
    enrolledAt: string;
    status: string;
}

interface CourseDetails {
    course: {
        id: string;
        title: string;
        status: string;
        // other fields
    };
    mentor: {
        id: string;
        name: string;
        email: string;
    };
    students: Student[];
}

function AdminCourseDetailsContent() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.id as string;

    const [details, setDetails] = useState<CourseDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDetails();
    }, [courseId]);

    const fetchDetails = async () => {
        try {
            const { data } = await api.get(`/courses/admin/${courseId}/details`);
            setDetails(data);
        } catch (error) {
            toast.error("Failed to fetch course details");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCourse = async () => {
        if (!confirm("Are you absolutely sure you want to permanently delete this course? This action cannot be undone.")) return;
        try {
            await api.delete(`/courses/admin/${courseId}`);
            toast.success("Course deleted successfully");
            router.push('/admin/courses');
        } catch (error) {
            toast.error("Failed to delete course");
        }
    };

    const handleUnenrollStudent = async (userId: string) => {
        if (!confirm("Are you sure you want to remove this student from the course?")) return;
        try {
            await api.delete(`/courses/admin/${courseId}/enrollments/${userId}`);
            toast.success("Student unenrolled");
            fetchDetails();
        } catch (error) {
            toast.error("Failed to unenroll student");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-black">
                <Loader2 className="w-12 h-12 animate-spin text-violet-500" />
            </div>
        );
    }

    if (!details) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-black text-white">
                <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
                <Link href="/admin/courses" className="text-violet-400 hover:text-violet-300 flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Back to Courses
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-24 text-white">
            <Link href="/admin/courses" className="text-zinc-400 hover:text-white flex items-center gap-2 mb-8 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Courses
            </Link>

            <div className="flex justify-between items-start mb-12">
                <div>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-pink-400">
                        {details.course.title}
                    </h1>
                    <p className="text-zinc-400 mt-2">God Mode View: Manage Course, Mentor, and Students</p>
                </div>
                <button
                    onClick={handleDeleteCourse}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors border border-red-500/20"
                >
                    <Trash2 className="w-4 h-4" />
                    Delete Course
                </button>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Mentor Details</h2>
                    {details.mentor ? (
                        <div className="space-y-2 text-zinc-300">
                            <p><strong className="text-zinc-500">Name:</strong> {details.mentor.name}</p>
                            <p><strong className="text-zinc-500">Email:</strong> {details.mentor.email}</p>
                        </div>
                    ) : (
                        <p className="text-zinc-500 italic">No mentor assigned</p>
                    )}
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Course Statistics</h2>
                    <div className="space-y-2 text-zinc-300">
                        <p><strong className="text-zinc-500">Status:</strong> {details.course.status.replace(/_/g, ' ')}</p>
                        <p><strong className="text-zinc-500">Total Enrolled:</strong> {details.students.length}</p>
                    </div>
                </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-zinc-800">
                    <h2 className="text-xl font-bold text-white">Enrolled Students</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-900 text-zinc-400 text-sm border-b border-zinc-800">
                            <tr>
                                <th className="px-6 py-4 font-medium">Name</th>
                                <th className="px-6 py-4 font-medium">Email</th>
                                <th className="px-6 py-4 font-medium">Enrolled At</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50 text-sm">
                            {details.students.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-zinc-500 italic">
                                        No students enrolled yet.
                                    </td>
                                </tr>
                            ) : (
                                details.students.map((student) => (
                                    <tr key={student.userId} className="hover:bg-zinc-800/20 transition-colors">
                                        <td className="px-6 py-4 text-zinc-300">{student.name}</td>
                                        <td className="px-6 py-4 text-zinc-400">{student.email}</td>
                                        <td className="px-6 py-4 text-zinc-500">
                                            {new Date(student.enrolledAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleUnenrollStudent(student.userId)}
                                                className="text-red-400 hover:text-red-300 transition-colors inline-flex items-center gap-1"
                                                title="Force Unenroll"
                                            >
                                                <UserMinus className="w-4 h-4" />
                                                <span className="sr-only">Remove</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default function AdminCourseDetailsPage() {
    return <AdminCourseDetailsContent />;
}
