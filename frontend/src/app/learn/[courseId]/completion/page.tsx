"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Loader2, Award, ArrowRight, CheckCircle, Download, ShieldCheck, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import Link from "next/link";

export default function CourseCompletionPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [loading, setLoading] = useState(true);
  const [examPassed, setExamPassed] = useState(false);
  const [examAttempt, setExamAttempt] = useState<any>(null);
  const [certificate, setCertificate] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchCompletionStatus();
  }, [courseId]);

  const fetchCompletionStatus = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/courses/${courseId}/exam`);
      if (data.attempt && data.attempt.status === "SUBMITTED") {
        setExamAttempt(data.attempt);
        setExamPassed(data.attempt.passed);
      }
      if (data.certificate) {
        setCertificate(data.certificate);
      }
    } catch (error) {
      console.warn("Could not fetch exam details", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFallback = async () => {
    setGenerating(true);
    const loadingToast = toast.loading("Generating your completion certificate...");
    try {
      const { data } = await api.post(`/certificates/course/${courseId}`);
      setCertificate(data);
      toast.success("Certificate successfully generated!", { id: loadingToast });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to generate certificate", {
        id: loadingToast,
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  const gradeName =
    examAttempt?.grade?.replace("_", " ") || certificate?.grade?.replace("_", " ") || "PASS";

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center space-y-10">
        <div className="space-y-4">
          <div className="w-28 h-28 mx-auto rounded-3xl bg-violet-600/20 border-2 border-violet-500/50 flex items-center justify-center shadow-2xl shadow-violet-500/20">
            <Award className="w-14 h-14 text-violet-400" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter mb-2">
              Course Completed
            </h1>
            <p className="text-zinc-400 text-sm md:text-base">
              You have successfully completed all the mandatory modules for this course.
            </p>
          </div>
        </div>

        {/* Case 1: Final Exam Passed & Certificate Available */}
        {examPassed || certificate ? (
          <div className="p-8 bg-zinc-900/90 border border-zinc-800 rounded-3xl space-y-6 animate-in slide-in-from-bottom-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mx-auto text-green-400">
              <CheckCircle className="w-6 h-6" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Graduation Grade: {gradeName}</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">Official Credential Issued</h2>
              {certificate && (
                <p className="text-zinc-500 font-mono text-xs tracking-widest">
                  VERIFICATION ID: {certificate.certificateId}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => router.push("/student/dashboard")}
                className="px-6 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition-all w-full sm:w-auto"
              >
                View Dashboard
              </button>
              {certificate && (
                <a
                  href={`${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000")
                    .replace(/\/+$/, "")
                    .replace(/\/api\/v1$/, "")}/api/v1/certificates/${certificate.certificateId}/download`}
                  download
                  className="px-7 py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 w-full sm:w-auto shadow-lg shadow-amber-500/20"
                >
                  <Download className="w-4 h-4" /> Download Certificate
                </a>
              )}
            </div>
          </div>
        ) : (
          /* Case 2: Modules Finished but Final Exam Not Taken Yet */
          <div className="p-8 bg-zinc-900/90 border border-zinc-800 rounded-3xl space-y-6 animate-in slide-in-from-bottom-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center mx-auto text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Final Step: Certification Exam</h2>
              <p className="text-zinc-400 text-sm max-w-md mx-auto leading-relaxed">
                To guarantee academic credibility, take the timed final evaluation (strictly 1 attempt). Scoring 60% or higher generates your verified certificate with accredited honors.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href={`/learn/${courseId}/exam`}
                className="px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-violet-600/30 flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <span>Take Final Exam</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={handleGenerateFallback}
                disabled={generating}
                className="px-6 py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl transition-all w-full sm:w-auto"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Skip Exam (Basic Pass)"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
