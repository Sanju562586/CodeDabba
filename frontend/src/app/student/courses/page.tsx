"use client";

import { useState, useEffect } from "react";
import { Loader2, BookOpen, PlayCircle, Sparkles, Compass } from "lucide-react";
import api from "@/lib/axios";
import Link from "next/link";
import { motion } from "framer-motion";

interface EnrolledCourse {
    id: string;
    title: string;
    description: string;
    thumbnailUrl?: string;
    progress?: {
        percentage: number;
        completedLessons: number;
        totalLessons: number;
    };
}

interface AvailableCourse {
    id: string;
    title: string;
    description: string;
    thumbnailUrl?: string;
    category: string;
    level: string;
    price: number;
    accessType: 'free' | 'paid';
    mentor: { name: string };
    isEnrolled?: boolean;
}

export default function StudentCoursesPage() {
    const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
    const [availableCourses, setAvailableCourses] = useState<AvailableCourse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [enrolledRes, allCoursesRes] = await Promise.all([
                    api.get('/courses/enrolled'),
                    api.get('/courses?limit=12') // Fetching a decent amount to show suggestions
                ]);
                setEnrolledCourses(enrolledRes.data);
                
                // Filter out already enrolled courses from suggestions
                const enrolledIds = new Set(enrolledRes.data.map((c: any) => c.id));
                const suggestions = allCoursesRes.data.data.filter((c: any) => !enrolledIds.has(c.id));
                setAvailableCourses(suggestions);

            } catch (error) {
                console.error("Failed to fetch courses data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="w-full relative min-h-screen">
            <div className="absolute top-0 right-0 w-1/2 h-96 bg-violet-600/10 rounded-full blur-[150px] mix-blend-screen pointer-events-none" />
            
            <div className="container mx-auto px-6 py-28 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-12"
                >
                    <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 flex items-center gap-4 mb-3 tracking-tight">
                        <BookOpen className="w-10 h-10 text-violet-500" />
                        My Learning
                    </h1>
                    <p className="text-zinc-400 text-lg">Continue where you left off and master new skills.</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    {loading ? (
                        <div className="flex justify-center py-24">
                            <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
                        </div>
                    ) : (
                        <>
                            {/* Enrolled Courses Section */}
                            <div className="mb-20">
                                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                    <PlayCircle className="w-6 h-6 text-violet-400" />
                                    In Progress
                                </h2>
                                
                                {enrolledCourses.length > 0 ? (
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {enrolledCourses.map((course, i) => (
                                            <motion.div
                                                key={course.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.06 }}
                                                className="bg-zinc-900/60 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden hover:border-violet-500/40 transition-all duration-300 group flex flex-col shadow-xl hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] relative"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-b from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                                
                                                <div className="aspect-video bg-zinc-800 relative overflow-hidden shrink-0 border-b border-white/5">
                                                    {course.thumbnailUrl ? (
                                                        <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-900/30 to-indigo-900/20">
                                                            <BookOpen className="w-12 h-12 text-violet-500/40" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                                                        <Link href={`/learn/${course.id}`} className="px-8 py-3 bg-white hover:bg-violet-50 text-black rounded-2xl font-bold transform translate-y-4 group-hover:translate-y-0 transition-all flex items-center gap-2 shadow-xl shadow-white/10">
                                                            <PlayCircle className="w-5 h-5" /> Resume Course
                                                        </Link>
                                                    </div>
                                                </div>
                                                
                                                <div className="p-6 flex-1 flex flex-col relative z-10">
                                                    <h3 className="text-lg font-bold mb-2 line-clamp-1 text-white group-hover:text-violet-400 transition-colors">{course.title}</h3>
                                                    <p className="text-sm text-zinc-500 line-clamp-2 mb-6 flex-1">{course.description}</p>
                                                    
                                                    <div className="space-y-3 mt-auto">
                                                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-zinc-500">
                                                            <span>Progress</span>
                                                            <span className="text-violet-400">{course.progress?.percentage || 0}%</span>
                                                        </div>
                                                        <div className="w-full bg-black/50 rounded-full h-2 overflow-hidden border border-white/5">
                                                            <div
                                                                className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-full rounded-full transition-all duration-1000 ease-out relative"
                                                                style={{ width: `${course.progress?.percentage || 0}%` }}
                                                            >
                                                                <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]" />
                                                            </div>
                                                        </div>
                                                        <div className="text-xs text-zinc-600 font-medium text-right">
                                                            {course.progress?.completedLessons || 0} / {course.progress?.totalLessons || 0} lessons completed
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-16 bg-zinc-900/30 border border-zinc-800 rounded-3xl border-dashed">
                                        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                                            <BookOpen className="w-8 h-8 text-violet-400/50" />
                                        </div>
                                        <h2 className="text-xl font-bold text-white mb-2">No courses yet</h2>
                                        <p className="text-zinc-500 max-w-sm mx-auto text-sm leading-relaxed">
                                            You haven&apos;t enrolled in any courses yet.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Discover More Section */}
                            {availableCourses.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                            <Compass className="w-6 h-6 text-fuchsia-400" />
                                            Discover New Courses
                                        </h2>
                                        <Link href="/courses" className="text-sm font-semibold text-fuchsia-400 hover:text-white transition-colors flex items-center gap-1">
                                            Browse All <Sparkles className="w-4 h-4" />
                                        </Link>
                                    </div>

                                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {availableCourses.map((course) => (
                                            <Link
                                                key={course.id}
                                                href={`/courses/${course.id}`}
                                                className="group bg-zinc-900/40 border border-white/5 rounded-2xl overflow-hidden hover:border-fuchsia-500/40 transition-all duration-300 flex flex-col shadow-lg hover:shadow-[0_0_20px_rgba(217,70,239,0.1)] relative"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-b from-fuchsia-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                                
                                                <div className="aspect-[4/3] bg-black relative overflow-hidden shrink-0 border-b border-white/5">
                                                    {course.thumbnailUrl ? (
                                                        <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-black">
                                                            <BookOpen className="w-8 h-8 text-zinc-700" />
                                                        </div>
                                                    )}
                                                    <div className="absolute top-3 left-3 flex gap-2">
                                                        <span className="px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-bold border border-white/10 text-white uppercase tracking-wider">
                                                            {course.category}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div className="p-5 flex-1 flex flex-col relative z-10">
                                                    <h3 className="text-base font-bold mb-2 line-clamp-2 text-white group-hover:text-fuchsia-400 transition-colors leading-snug">{course.title}</h3>
                                                    <p className="text-xs text-zinc-500 line-clamp-2 mb-4 flex-1">{course.description}</p>
                                                    
                                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md border ${
                                                            course.level === 'beginner' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' :
                                                            course.level === 'intermediate' ? 'border-amber-500/20 text-amber-400 bg-amber-500/5' :
                                                            'border-red-500/20 text-red-400 bg-red-500/5'
                                                        }`}>
                                                            {course.level}
                                                        </span>
                                                        <span className="text-sm font-black text-white">
                                                            {course.accessType === 'free' ? 'Free' : `$${course.price}`}
                                                        </span>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
