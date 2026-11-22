"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/axios";
import { Sparkles, X, Send, Loader2, Bot, User, HelpCircle, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
}

interface AiChatDrawerProps {
  courseId?: string;
  chapterId?: string;
}

export default function AiChatDrawer({ courseId, chapterId }: AiChatDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "intro-msg",
      sender: "ai",
      text: "👋 Hi! I'm your CodeDabba Technical Assistant. Ask me any question about this lesson, concepts, or ask for hints on your tasks!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [quota, setQuota] = useState<{ usedToday: number; remainingQuota: number; dailyLimit: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchQuota();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const fetchQuota = async () => {
    try {
      const { data } = await api.get("/ai/quota");
      setQuota(data);
    } catch {
      // Ignored if user not authenticated yet
    }
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!messageText) setInput("");
    setLoading(true);

    try {
      const { data } = await api.post("/ai/chat", {
        message: textToSend.trim(),
        courseId,
        chapterId,
      });

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: data.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setQuota((prev) =>
        prev
          ? {
              ...prev,
              usedToday: prev.dailyLimit - data.remainingQuota,
              remainingQuota: data.remainingQuota,
            }
          : null
      );
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        "I'm temporarily having trouble connecting. Please try asking again in a moment.";
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: "ai",
          text: `⚠️ **Notice**: ${errorMsg}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "Explain this lesson in simple terms",
    "Give me a hint for the chapter task",
    "What are common pitfalls to avoid?",
  ];

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-full shadow-2xl shadow-violet-600/40 border border-violet-400/30 transition-all transform hover:scale-105 active:scale-95"
      >
        <Sparkles className="w-5 h-5 text-amber-300 animate-spin-slow" />
        <span className="text-sm">AI Assistant</span>
        {quota && (
          <span className="text-[11px] px-2 py-0.5 bg-black/30 rounded-full font-mono text-zinc-200">
            {quota.remainingQuota}/{quota.dailyLimit}
          </span>
        )}
      </button>

      {/* Slide-out Drawer */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-zinc-950/95 backdrop-blur-2xl border-l border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">CodeDabba AI Tutor</h3>
                <p className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse"></span>
                  Context-Aware Assistant
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {quota && (
                <div
                  title="Daily question quota remaining"
                  className="text-xs px-2.5 py-1 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-300 font-mono"
                >
                  {quota.remainingQuota} left today
                </div>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Daily Quota Notice if running low */}
          {quota && quota.remainingQuota <= 3 && (
            <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>You have {quota.remainingQuota} daily questions remaining.</span>
            </div>
          )}

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 text-sm ${m.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold ${
                    m.sender === "user"
                      ? "bg-violet-600 text-white"
                      : "bg-zinc-800 text-violet-400 border border-zinc-700"
                  }`}
                >
                  {m.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`rounded-2xl p-3.5 max-w-[85%] ${
                    m.sender === "user"
                      ? "bg-violet-600 text-white rounded-tr-none"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none"
                  }`}
                >
                  <div className="prose prose-invert prose-xs max-w-none break-words leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 text-sm">
                <div className="w-7 h-7 rounded-lg bg-zinc-800 text-violet-400 border border-zinc-700 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 rounded-tl-none flex items-center gap-2 text-zinc-400 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                  <span>Thinking with lesson context...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div className="px-4 py-2 border-t border-zinc-800/60 bg-zinc-900/30">
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(p)}
                  disabled={loading}
                  className="whitespace-nowrap px-2.5 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors flex items-center gap-1 shrink-0"
                >
                  <HelpCircle className="w-3 h-3 text-violet-400" />
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 border-t border-zinc-800 bg-zinc-900/60 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a technical or task question..."
              disabled={loading || (quota !== null && quota.remainingQuota <= 0)}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading || (quota !== null && quota.remainingQuota <= 0)}
              className="p-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-xl transition-colors shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
