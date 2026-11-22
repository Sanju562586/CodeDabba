"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Video, Calendar, Clock, ExternalLink, Plus, Loader2, X, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";

interface DoubtSession {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  meetingUrl: string;
  scheduledAt: string;
  durationMinutes: number;
  status: "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED";
  mentor?: {
    id: string;
    name: string;
    email: string;
  };
}

interface DoubtSessionsModalProps {
  courseId: string;
  isOpen: boolean;
  onClose: () => void;
  canSchedule?: boolean;
}

export default function DoubtSessionsModal({
  courseId,
  isOpen,
  onClose,
  canSchedule = false,
}: DoubtSessionsModalProps) {
  const [sessions, setSessions] = useState<DoubtSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [meetingUrl, setMeetingUrl] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchSessions();
    }
  }, [isOpen, courseId]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/doubt-sessions/course/${courseId}`);
      setSessions(data);
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !scheduledAt) {
      toast.error("Please fill in title and scheduled date/time");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/doubt-sessions", {
        courseId,
        title: title.trim(),
        description: description.trim() || undefined,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes: Number(durationMinutes),
        meetingUrl: meetingUrl.trim() || undefined,
      });

      toast.success("Doubt session scheduled successfully!");
      setTitle("");
      setDescription("");
      setScheduledAt("");
      setMeetingUrl("");
      setShowCreateForm(false);
      fetchSessions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to schedule session");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <Video className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Live Mentorship & Doubt Sessions</h3>
              <p className="text-xs text-zinc-400">Interactive live problem-solving with mentors</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canSchedule && !showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" /> Schedule Session
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {showCreateForm ? (
            <form onSubmit={handleCreateSession} className="space-y-4 bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <h4 className="text-sm font-bold text-white">Schedule New Mentorship Session</h4>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Session Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Live Q&A: Backend API Design & Debugging"
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Topics to be covered or instructions for students..."
                  rows={2}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    required
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    min={15}
                    max={180}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    required
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Meeting Link (Google Meet, Zoom, etc.)
                </label>
                <input
                  type="url"
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  placeholder="Leave empty to auto-generate a secure free Jitsi Meet room"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  💡 Zero infrastructure cost: If omitted, CodeDabba generates a secure, free browser meeting room instantly.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Schedule Session
                </button>
              </div>
            </form>
          ) : null}

          {loading ? (
            <div className="py-12 flex items-center justify-center text-zinc-400">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mr-2" />
              <span>Loading mentorship sessions...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-zinc-800 rounded-2xl p-6">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center mx-auto mb-3 text-zinc-500">
                <Calendar className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-white mb-1">No Live Sessions Scheduled Yet</h4>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Your mentor will announce live doubt resolution sessions here. Check back soon!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => {
                const sessionDate = new Date(s.scheduledAt);
                const isUpcoming = sessionDate.getTime() > Date.now();

                return (
                  <div
                    key={s.id}
                    className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-zinc-700 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            s.status === "LIVE"
                              ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse"
                              : s.status === "SCHEDULED"
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {s.status}
                        </span>
                        <h4 className="text-sm font-bold text-white">{s.title}</h4>
                      </div>

                      {s.description && (
                        <p className="text-xs text-zinc-400 line-clamp-1">{s.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 pt-1">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                          {sessionDate.toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" />
                          {sessionDate.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })} ({s.durationMinutes} mins)
                        </span>
                        {s.mentor && (
                          <span className="text-zinc-500">Mentor: {s.mentor.name}</span>
                        )}
                      </div>
                    </div>

                    <a
                      href={s.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shrink-0 shadow-lg shadow-indigo-600/20"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join Live Meeting</span>
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
