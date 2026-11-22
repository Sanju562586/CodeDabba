"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import {
  ArrowLeft,
  Clock,
  Award,
  CheckCircle,
  AlertTriangle,
  Lock,
  Loader2,
  ChevronRight,
  ShieldCheck,
  Send,
  Download,
} from "lucide-react";
import { toast } from "react-hot-toast";
import Link from "next/link";

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  question: string;
  options: Option[];
  points: number;
  orderIndex: number;
}

interface ExamInfo {
  id: string;
  title: string;
  description: string;
  timeLimitMinutes: number;
  passingScorePercent: number;
  totalQuestions: number;
}

interface Eligibility {
  eligible: boolean;
  completedChapters: number;
  totalChapters: number;
  message?: string;
}

interface Attempt {
  id: string;
  status: "IN_PROGRESS" | "SUBMITTED" | "TIMED_OUT";
  startedAt: string;
  submittedAt?: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  grade?: string;
}

export default function FinalExamPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<ExamInfo | null>(null);
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [certificate, setCertificate] = useState<any>(null);

  // Active Exam State
  const [inExam, setInExam] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(30 * 60);

  useEffect(() => {
    fetchExamStatus();
  }, [courseId]);

  // Timer Countdown Effect
  useEffect(() => {
    if (!inExam || timeLeftSeconds <= 0) return;

    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [inExam, timeLeftSeconds]);

  const fetchExamStatus = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/courses/${courseId}/exam`);
      setExam(data.exam);
      setEligibility(data.eligibility);
      setAttempt(data.attempt);
      setCertificate(data.certificate);

      // If attempt is currently IN_PROGRESS, resume it!
      if (data.attempt?.status === "IN_PROGRESS") {
        handleResumeExam(data.attempt);
      }
    } catch (err: any) {
      console.error("Failed to load exam info", err);
      toast.error(err.response?.data?.message || "Failed to load exam details");
    } finally {
      setLoading(false);
    }
  };

  const handleResumeExam = async (existingAttempt: Attempt) => {
    try {
      const { data } = await api.post(`/courses/${courseId}/exam/start`);
      setQuestions(data.questions || []);
      setSelectedAnswers(data.existingAnswers || {});

      const startedMs = new Date(existingAttempt.startedAt).getTime();
      const limitMs = (data.timeLimitMinutes || 30) * 60 * 1000;
      const elapsedMs = Date.now() - startedMs;
      const remainingSecs = Math.max(0, Math.floor((limitMs - elapsedMs) / 1000));

      setTimeLeftSeconds(remainingSecs);
      setInExam(true);
    } catch (err) {
      console.error("Failed to resume exam", err);
    }
  };

  const handleStartExam = async () => {
    try {
      setLoading(true);
      const { data } = await api.post(`/courses/${courseId}/exam/start`);
      setQuestions(data.questions || []);
      setSelectedAnswers(data.existingAnswers || {});
      setTimeLeftSeconds((data.timeLimitMinutes || 30) * 60);
      setInExam(true);
      toast.success("Final Exam started! Best of luck.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not start exam");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleAutoSubmit = () => {
    toast.error("Time is up! Submitting your exam automatically...", { duration: 5000 });
    handleSubmitExam();
  };

  const handleSubmitExam = async () => {
    setSubmitting(true);
    try {
      const { data } = await api.post(`/courses/${courseId}/exam/submit`, {
        answers: selectedAnswers,
      });

      setInExam(false);
      setAttempt({
        id: "submitted",
        status: "SUBMITTED",
        startedAt: new Date().toISOString(),
        score: data.score,
        totalQuestions: data.totalQuestions,
        percentage: data.percentage,
        passed: data.passed,
        grade: data.grade,
      });

      if (data.certificate) {
        setCertificate(data.certificate);
      }

      if (data.passed) {
        toast.success(`🎉 Congratulations! You passed with ${data.grade.replace("_", " ")}!`);
      } else {
        toast.error(`Exam completed. You scored ${data.percentage}%. Passing score is ${data.passingScorePercent}%.`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit exam");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  // View 1: Active Exam Mode
  if (inExam && questions.length > 0) {
    const currentQ = questions[currentQuestionIndex];
    const answeredCount = Object.keys(selectedAnswers).length;

    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        {/* Exam Header */}
        <header className="h-16 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="text-xs px-2.5 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg font-bold uppercase tracking-wider animate-pulse">
              Final Examination
            </span>
            <span className="text-sm font-semibold text-zinc-300 hidden sm:inline">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
          </div>

          {/* Real-time Countdown Timer */}
          <div className={`flex items-center gap-2 px-4 py-1.5 rounded-xl font-mono text-sm font-bold border ${
            timeLeftSeconds < 300
              ? "bg-red-500/10 border-red-500/30 text-red-400 animate-pulse"
              : "bg-zinc-900 border-zinc-700 text-amber-400"
          }`}>
            <Clock className="w-4 h-4" />
            <span>{formatTimer(timeLeftSeconds)}</span>
          </div>

          <button
            onClick={handleSubmitExam}
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Finish & Submit</span>
          </button>
        </header>

        {/* Question Navigator Bar */}
        <div className="bg-zinc-900/50 border-b border-zinc-800 px-6 py-3 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {questions.map((q, idx) => {
            const isAnswered = !!selectedAnswers[q.id];
            const isCurrent = idx === currentQuestionIndex;

            return (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all shrink-0 ${
                  isCurrent
                    ? "bg-violet-600 text-white ring-2 ring-violet-400"
                    : isAnswered
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
          <div className="ml-auto text-xs text-zinc-400 font-mono whitespace-nowrap pl-4">
            {answeredCount}/{questions.length} answered
          </div>
        </div>

        {/* Main Question Body */}
        <main className="flex-1 max-w-3xl w-full mx-auto p-6 md:p-10 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center justify-between text-xs text-zinc-500 uppercase font-mono tracking-wider">
              <span>Question {currentQuestionIndex + 1}</span>
              <span>1 Mark</span>
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-white leading-relaxed">
              {currentQ.question}
            </h2>

            <div className="space-y-3 pt-4">
              {currentQ.options.map((opt) => {
                const isSelected = selectedAnswers[currentQ.id] === opt.id;

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(currentQ.id, opt.id)}
                    className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all ${
                      isSelected
                        ? "bg-violet-600/10 border-violet-500 text-white shadow-lg shadow-violet-600/10"
                        : "bg-zinc-900/40 border-zinc-800 text-zinc-300 hover:bg-zinc-800/50 hover:border-zinc-700"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border mt-0.5 flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? "border-violet-500 bg-violet-600 text-white"
                          : "border-zinc-600 bg-transparent"
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <span className="text-sm font-medium leading-relaxed">{opt.text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Footer */}
          <div className="pt-10 flex items-center justify-between border-t border-zinc-800/80 mt-10">
            <button
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-zinc-300 text-xs font-semibold rounded-xl transition-colors"
            >
              Previous
            </button>

            {currentQuestionIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <span>Next Question</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmitExam}
                disabled={submitting}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Submit Final Exam</span>
              </button>
            )}
          </div>
        </main>
      </div>
    );
  }

  // View 2: Post-Submission Results View
  if (attempt && attempt.status === "SUBMITTED") {
    const isPassed = attempt.passed;
    const gradeTitle = attempt.grade?.replace("_", " ") || (isPassed ? "PASS" : "FAIL");

    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-8 md:p-10 text-center space-y-8 shadow-2xl animate-in zoom-in-95">
          <div className="w-24 h-24 mx-auto rounded-3xl flex items-center justify-center shadow-xl border-2">
            {isPassed ? (
              <div className="w-full h-full rounded-3xl bg-green-500/10 border-green-500/30 flex items-center justify-center">
                <Award className="w-12 h-12 text-green-400" />
              </div>
            ) : (
              <div className="w-full h-full rounded-3xl bg-red-500/10 border-red-500/30 flex items-center justify-center">
                <AlertTriangle className="w-12 h-12 text-red-400" />
              </div>
            )}
          </div>

          <div>
            <h1 className="text-3xl font-black mb-2">
              {isPassed ? "Final Examination Passed!" : "Final Examination Completed"}
            </h1>
            <p className="text-zinc-400 text-sm max-w-md mx-auto">
              {isPassed
                ? "You have demonstrated mastery and unlocked your official verified course completion certificate."
                : "You did not achieve the required 60% passing mark to qualify for an official certificate."}
            </p>
          </div>

          {/* Score & Grade Card */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
            <div>
              <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Score</p>
              <p className="text-2xl font-black text-white mt-1">
                {attempt.score}/{attempt.totalQuestions}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Percentage</p>
              <p className="text-2xl font-black text-violet-400 mt-1">{attempt.percentage}%</p>
            </div>
            <div>
              <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Grade</p>
              <p
                className={`text-lg font-black mt-1 ${
                  attempt.grade === "DISTINCTION"
                    ? "text-amber-400"
                    : attempt.grade === "FIRST_CLASS"
                    ? "text-violet-400"
                    : isPassed
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {gradeTitle}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => router.push(`/learn/${courseId}`)}
              className="w-full sm:w-auto px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl transition-colors"
            >
              Back to Course
            </button>

            {isPassed && certificate && (
              <a
                href={`${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "").replace(/\/api\/v1$/, "")}/api/v1/certificates/${certificate.certificateId}/download`}
                download
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Download Certificate
              </a>
            )}

            {isPassed && (
              <Link
                href={`/learn/${courseId}/completion`}
                className="w-full sm:w-auto px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Award className="w-4 h-4" /> View Graduation
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // View 3: Pre-Exam / Instructions View
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Top Bar */}
      <header className="h-16 border-b border-zinc-800 px-6 flex items-center justify-between">
        <button
          onClick={() => router.push(`/learn/${courseId}`)}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Learning
        </button>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto p-6 md:p-12 flex flex-col justify-center">
        <div className="space-y-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-600/20 border border-violet-500/30 rounded-full text-violet-400 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" /> Official Graduation Gate
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">{exam?.title}</h1>
            <p className="text-zinc-400 text-sm leading-relaxed">{exam?.description}</p>
          </div>

          {/* Exam Rules & Conditions Card */}
          <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Exam Specifications</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/80">
                <span className="text-xs text-zinc-500 block">Duration</span>
                <span className="font-bold text-white">{exam?.timeLimitMinutes || 30} Minutes</span>
              </div>
              <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/80">
                <span className="text-xs text-zinc-500 block">Passing Benchmark</span>
                <span className="font-bold text-white">{exam?.passingScorePercent || 60}% Required</span>
              </div>
              <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/80">
                <span className="text-xs text-zinc-500 block">Number of Questions</span>
                <span className="font-bold text-white">{exam?.totalQuestions || 10} Questions</span>
              </div>
              <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/80">
                <span className="text-xs text-zinc-500 block">Attempts Permitted</span>
                <span className="font-bold text-amber-400">Strictly 1 Attempt</span>
              </div>
            </div>

            <div className="pt-2 text-xs text-zinc-400 space-y-2">
              <p className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                Score ≥ 85%: <strong className="text-amber-400">Graduation with Distinction</strong>
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                Score ≥ 70%: <strong className="text-violet-400">First Class Honors</strong>
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                Score ≥ 60%: <strong className="text-green-400">Certified Pass</strong>
              </p>
            </div>
          </div>

          {/* Eligibility Check Status */}
          {eligibility && !eligibility.eligible ? (
            <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3.5 text-amber-300 text-sm">
              <Lock className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold">Exam Currently Locked</h4>
                <p className="text-xs mt-1 text-amber-300/80">
                  {eligibility.message ||
                    `You have completed ${eligibility.completedChapters} of ${eligibility.totalChapters} chapters. Complete all chapter tasks to unlock this final exam.`}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-center gap-3 text-xs text-zinc-400">
              <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
              <span>You have completed all prerequisite curriculum chapters. You are qualified to take this exam.</span>
            </div>
          )}

          {/* Action Trigger */}
          <button
            onClick={handleStartExam}
            disabled={!eligibility?.eligible}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all shadow-xl shadow-violet-600/30 flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Begin Certification Exam (30 Mins)</span>
          </button>
        </div>
      </main>
    </div>
  );
}
