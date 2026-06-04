"use client";

import { useEffect, useState, Suspense } from "react";
import api from "@/lib/axios";
import Link from "next/link";
import { Loader2, BookOpen } from "lucide-react";

interface Course {
    id: string;
    title: string;
    description: string;
    thumbnailUrl?: string;
    mentor: { name: string };
    category: string;
    level: string;
    status: string;
    createdAt: string;
    accessType: 'free' | 'paid';
    price: number;
}

function AdminCoursesContent() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/courses/admin/all');
            setCourses(data.data);
        } catch (error) {
            console.error("Failed to fetch courses", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <div className="container mx-auto px-6 py-24">
                <div className="mb-12">
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-pink-400">
                        All Courses
                    </h1>
                    <p className="text-zinc-400 mt-2">View and manage all courses on the platform.</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-24">
                        <Loader2 className="w-12 h-12 animate-spin text-violet-500" />
                    </div>
                ) : courses.length === 0 ? (
                    <div className="text-center py-24 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                        <BookOpen className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No courses found</h3>
                        <p className="text-zinc-400">There are currently no courses on the platform.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {courses.map((course) => (
                            <Link
                                key={course.id}
                                href={`/admin/courses/${course.id}`}
                                className="group bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden hover:border-violet-500/50 transition-all hover:shadow-2xl hover:shadow-violet-500/10 flex flex-col"
                            >
                                <div className="aspect-video bg-zinc-800 relative overflow-hidden">
                                    {course.thumbnailUrl ? (
                                        <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-violet-900/40 via-indigo-900/30 to-black flex items-center justify-center">
                                            <BookOpen className="w-10 h-10 text-violet-500/40" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4">
                                        <span className={`px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-semibold border ${
                                            course.status === 'published' ? 'border-green-500/50 text-green-400' :
                                            course.status.includes('review') ? 'border-yellow-500/50 text-yellow-400' :
                                            'border-zinc-500/50 text-zinc-400'
                                        }`}>
                                            {course.status.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-6 flex-1 flex flex-col">
                                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-violet-400 transition-colors line-clamp-2">
                                        {course.title}
                                    </h3>
                                    <p className="text-zinc-400 text-sm line-clamp-2 mb-4 flex-1">
                                        {course.description}
                                    </p>
                                    <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-400">
                                                {course.mentor?.name?.charAt(0) || 'M'}
                                            </div>
                                            <span className="text-sm text-zinc-400">{course.mentor?.name || 'Unknown'}</span>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded border capitalize ${
                                            course.level === 'beginner' ? 'border-green-500/20 text-green-400' :
                                            course.level === 'intermediate' ? 'border-yellow-500/20 text-yellow-400' :
                                            'border-red-500/20 text-red-400'
                                        }`}>
                                            {course.level}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AdminCoursesPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center h-screen bg-black">
                <Loader2 className="w-12 h-12 animate-spin text-violet-500" />
            </div>
        }>
            <AdminCoursesContent />
        </Suspense>
    );
}
