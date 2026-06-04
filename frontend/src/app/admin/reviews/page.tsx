"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Loader2 } from "lucide-react";
import { toast } from 'react-hot-toast';
import Link from "next/link";

export default function AdminReviewsPage() {
    const [activeTab, setActiveTab] = useState<'curriculum' | 'content'>('curriculum');

    return (
        <div className="w-full">
            <div className="container mx-auto px-6 py-24">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-pink-500 mb-2">Course Reviews</h1>
                    <p className="text-zinc-400">Review pending curriculum and content submissions.</p>
                </div>

                <div className="flex gap-4 mb-8 border-b border-zinc-800 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('curriculum')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'curriculum'
                            ? 'border-pink-500 text-pink-400'
                            : 'border-transparent text-zinc-400 hover:text-white'
                            }`}
                    >
                        Curriculum Reviews
                    </button>
                    <button
                        onClick={() => setActiveTab('content')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'content'
                            ? 'border-pink-500 text-pink-400'
                            : 'border-transparent text-zinc-400 hover:text-white'
                            }`}
                    >
                        Content Reviews
                    </button>
                </div>

                <div className="space-y-6">
                    <CourseReviewList phase={activeTab} />
                </div>
            </div>
        </div>
    );
}

function CourseReviewList({ phase }: { phase: 'curriculum' | 'content' }) {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCourses();
    }, [phase]);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const status = phase === 'curriculum' ? 'curriculum_under_review' : 'content_under_review';
            const { data } = await api.get('/courses/admin/all', { params: { status } });
            setCourses(data.data);
        } catch (error) {
            console.error("Failed to fetch courses", error);
            toast.error("Failed to load reviews");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-pink-500" /></div>;

    if (courses.length === 0) return (
        <div className="text-center py-24 bg-zinc-900/30 border border-zinc-800 rounded-3xl border-dashed">
            <h2 className="text-xl font-bold text-zinc-500 mb-2">All caught up!</h2>
            <p className="text-zinc-600">No {phase} reviews pending at the moment.</p>
        </div>
    );

    return (
        <div className="grid gap-6">
            <h2 className="text-xl font-bold px-1 text-zinc-300 capitalize">{phase} Reviews</h2>
            {courses.map((course) => (
                <div key={course.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row gap-6 hover:border-pink-500/30 transition-all group overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="w-full md:w-56 aspect-video bg-zinc-800 rounded-xl overflow-hidden flex-shrink-0 border border-white/5 relative z-10">
                        {course.thumbnailUrl ? (
                            <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-600 italic">No Thumbnail</div>
                        )}
                        <div className="absolute top-2 left-2">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border ${phase === 'curriculum'
                                ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'
                                : 'bg-blue-500/20 text-blue-500 border-blue-500/30'
                                }`}>
                                {phase === 'curriculum' ? 'Phase 1: Structure' : 'Phase 2: Content'}
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 relative z-10 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-pink-400 transition-colors line-clamp-1">{course.title}</h3>
                                    <p className="text-sm text-zinc-400 line-clamp-1">
                                        Applied by <span className="text-zinc-200 font-medium">{course.mentor?.name}</span> •
                                        Submitted {new Date(phase === 'curriculum' ? (course.submittedCurriculumAt || course.createdAt) : (course.submittedContentAt || course.createdAt)).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="px-2 py-1 rounded bg-zinc-800/50 border border-zinc-700 text-[10px] text-zinc-400 uppercase font-bold tracking-tighter">{course.level}</span>
                                    <span className="px-2 py-1 rounded bg-pink-500/10 border border-pink-500/20 text-[10px] text-pink-400 uppercase font-bold tracking-tighter">{course.category}</span>
                                </div>
                            </div>

                            <p className="text-sm text-zinc-500 line-clamp-2 mt-2">
                                {course.description}
                            </p>
                        </div>

                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800/50">
                            <div className="flex gap-4 text-xs font-semibold uppercase tracking-widest">
                                <div><span className="text-zinc-600 mr-2">Price:</span> <span className="text-white">{course.accessType === 'free' ? 'FREE' : `$${course.price}`}</span></div>
                                <div><span className="text-zinc-600 mr-2">Type:</span> <span className="text-white">{course.accessType}</span></div>
                            </div>

                            <Link
                                href={`/admin/courses/${course.id}`}
                                className="px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-pink-600/20 hover:shadow-pink-600/40 transform hover:-translate-y-1"
                            >
                                Review {phase === 'curriculum' ? 'Curriculum' : 'Content'}
                            </Link>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
