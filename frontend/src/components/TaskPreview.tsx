import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CheckCircle2, Code, Info, Play, Send, HelpCircle, Loader2, XCircle, RotateCcw } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

export interface TaskOption {
    id?: string;
    optionText: string;
    isCorrect?: boolean;
}

export interface TestCase {
    id?: string;
    input: string;
    expectedOutput: string;
    isHidden?: boolean;
}

export interface Task {
    id: string;
    title: string;
    type: 'MCQ' | 'CODING';
    problemStatement: string;
    points: number;
    isRequired?: boolean;
    options?: TaskOption[];
    testCases?: TestCase[];
    starterCode?: string;
    language?: string;
    isPassed?: boolean;
    latestSubmission?: any;
}

interface TaskPreviewProps {
    task: Task;
    chapterId?: string;
    showResults?: boolean;
    interactive?: boolean;
    onTaskPassed?: (taskId: string) => void;
}

export default function TaskPreview({
    task,
    chapterId,
    showResults = false,
    interactive = false,
    onTaskPassed,
}: TaskPreviewProps) {
    const [selectedOption, setSelectedOption] = useState<string | null>(
        task.latestSubmission?.selectedOptionId || null
    );
    const [code, setCode] = useState(
        task.latestSubmission?.code || task.starterCode || ''
    );
    const [activeTab, setActiveTab] = useState<'problem' | 'solution'>('problem');
    const [submitting, setSubmitting] = useState(false);
    const [submissionResult, setSubmissionResult] = useState<any>(
        task.latestSubmission || null
    );
    const [isPassed, setIsPassed] = useState<boolean>(task.isPassed || task.latestSubmission?.status === 'PASSED');

    const isMCQ = task.type === 'MCQ';
    const isCoding = task.type === 'CODING';

    const handleSubmit = async () => {
        if (!interactive || !chapterId) {
            toast('Preview mode: connect to course to record submissions', { icon: 'ℹ️' });
            return;
        }

        if (isMCQ && !selectedOption) {
            toast.error('Please choose an option first');
            return;
        }

        if (isCoding && !code.trim()) {
            toast.error('Please write some code first');
            return;
        }

        setSubmitting(true);
        try {
            const payload = isMCQ
                ? { selectedOptionId: selectedOption }
                : { code };

            const { data } = await api.post(
                `/chapters/${chapterId}/tasks/${task.id}/submit`,
                payload
            );

            setSubmissionResult(data);

            if (data.status === 'PASSED') {
                setIsPassed(true);
                toast.success(data.feedback || `Task completed! +${data.pointsAwarded || task.points} pts`);
                if (onTaskPassed) {
                    onTaskPassed(task.id);
                }
            } else {
                toast.error(data.feedback || 'Task evaluation failed. Try again.');
            }
        } catch (error: any) {
            console.error('Submission failed', error);
            toast.error(error.response?.data?.message || 'Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleResetStarterCode = () => {
        setCode(task.starterCode || '');
        toast('Starter code reset', { icon: '🔄' });
    };

    return (
        <div className={`border rounded-2xl overflow-hidden shadow-xl flex flex-col transition-all ${isPassed ? 'bg-zinc-900/40 border-emerald-500/40' : 'bg-zinc-900/50 border-zinc-800'}`}>
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isPassed ? 'bg-emerald-500/10 text-emerald-400' : isCoding ? 'bg-blue-500/10 text-blue-400' : 'bg-pink-500/10 text-pink-400'}`}>
                        {isPassed ? <CheckCircle2 className="w-5 h-5" /> : isCoding ? <Code className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-sm md:text-base">{task.title}</h4>
                            {isPassed && (
                                <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase rounded-full tracking-wider">
                                    Passed
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-0.5">
                            <span>{task.type}</span>
                            <span>•</span>
                            <span className="text-violet-400">{task.points} Points</span>
                            {task.language && (
                                <>
                                    <span>•</span>
                                    <span className="text-zinc-400">{task.language}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {isCoding && (
                    <div className="flex bg-black/50 p-1 rounded-lg border border-zinc-800">
                        <button
                            onClick={() => setActiveTab('problem')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'problem' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            Editor
                        </button>
                        <button
                            onClick={() => setActiveTab('solution')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'solution' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            Test Cases
                        </button>
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="p-6">
                {(activeTab === 'problem' || isMCQ) && (
                    <div className="space-y-6">
                        {/* Problem Statement */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                <Info className="w-3.5 h-3.5" />
                                Instructions
                            </div>
                            <div className="prose prose-invert prose-sm max-w-none text-zinc-300 bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/60 min-h-[60px]">
                                {task.problemStatement ? (
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{task.problemStatement}</ReactMarkdown>
                                ) : (
                                    <p className="text-zinc-500 italic">No instructions provided for this task.</p>
                                )}
                            </div>
                        </div>

                        {/* Interactive Area */}
                        {isMCQ && (
                            <div className="space-y-3">
                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Select the correct option:</p>
                                <div className="grid grid-cols-1 gap-3">
                                    {task.options?.map((option, idx) => {
                                        const optId = option.id || idx.toString();
                                        const isSelected = selectedOption === optId;
                                        return (
                                            <button
                                                key={optId}
                                                type="button"
                                                onClick={() => setSelectedOption(optId)}
                                                className={`
                                                    w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group
                                                    ${isSelected
                                                        ? 'bg-violet-500/10 border-violet-500/60 text-violet-200 ring-1 ring-violet-500/30'
                                                        : 'bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900'
                                                    }
                                                    ${showResults && option.isCorrect ? 'border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/20' : ''}
                                                `}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`
                                                        w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all shrink-0
                                                        ${isSelected
                                                            ? 'border-violet-500 bg-violet-500 text-white'
                                                            : 'border-zinc-700 bg-zinc-900 text-zinc-500 group-hover:border-zinc-600'
                                                        }
                                                        ${showResults && option.isCorrect ? 'border-emerald-500 bg-emerald-500 text-white' : ''}
                                                    `}>
                                                        {String.fromCharCode(65 + idx)}
                                                    </div>
                                                    <span className="text-sm font-medium">{option.optionText}</span>
                                                </div>
                                                {showResults && option.isCorrect && (
                                                    <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold uppercase">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        Correct Answer
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {isCoding && activeTab === 'problem' && (
                            <div className="space-y-3">
                                <div className="bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden">
                                    <div className="px-4 py-2 bg-zinc-900/90 border-b border-zinc-800 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                            <span className="text-xs font-mono text-zinc-400 font-semibold">{task.language || 'Python'} 3</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleResetStarterCode}
                                            className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors"
                                        >
                                            <RotateCcw className="w-3 h-3" /> Reset
                                        </button>
                                    </div>
                                    <textarea
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        className="w-full h-56 p-4 bg-transparent text-zinc-200 font-mono text-sm outline-none resize-y leading-relaxed focus:ring-1 focus:ring-violet-500/50"
                                        placeholder="# Write your solution here..."
                                        spellCheck={false}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Submission Result Feedback Banner */}
                        {submissionResult && (
                            <div className={`p-4 rounded-xl border flex items-start gap-3 animate-in fade-in ${submissionResult.status === 'PASSED' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
                                {submissionResult.status === 'PASSED' ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                )}
                                <div className="text-sm">
                                    <p className="font-semibold">{submissionResult.feedback}</p>
                                    {submissionResult.output && (
                                        <pre className="mt-2 text-xs font-mono bg-black/50 p-2.5 rounded border border-white/5 whitespace-pre-wrap">
                                            {submissionResult.output}
                                        </pre>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {isCoding && activeTab === 'solution' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Info className="w-3.5 h-3.5" />
                            Test Cases ({task.testCases?.length || 0})
                        </p>
                        <div className="space-y-3">
                            {task.testCases?.map((tc, idx) => (
                                <div key={tc.id || idx} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
                                    <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                                        <span>Test Case #{idx + 1}</span>
                                        {tc.isHidden && <span className="text-amber-500/90 font-mono">Hidden in Production</span>}
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Standard Input (stdin)</label>
                                            <div className="bg-black p-2.5 rounded border border-zinc-800/80 font-mono text-xs text-zinc-300 min-h-[36px] break-all">
                                                {tc.input || '(Empty)'}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Expected Output</label>
                                            <div className="bg-black p-2.5 rounded border border-zinc-800/80 font-mono text-xs text-emerald-400 min-h-[36px] break-all">
                                                {tc.expectedOutput || '(Empty)'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                    {isPassed ? (
                        <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                            <CheckCircle2 className="w-4 h-4" /> Passed (+{task.points} pts)
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5 text-zinc-500">
                            <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></span>
                            Awaiting Submission
                        </span>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg ${
                            isPassed
                                ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                                : 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-900/20'
                        } disabled:opacity-50`}
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                {isCoding ? 'Executing Code...' : 'Evaluating...'}
                            </>
                        ) : (
                            <>
                                {isCoding ? <Play className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                                {isPassed ? 'Re-run Solution' : isCoding ? 'Run & Submit Code' : 'Submit Answer'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
