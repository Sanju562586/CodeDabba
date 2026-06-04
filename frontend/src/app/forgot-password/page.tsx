"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import { AuthLayout } from "@/components/AuthLayout";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { toast } from 'react-hot-toast';
import { FullScreenLoader } from "@/components/ui/full-screen-loader";

function ForgotPasswordForm() {
    const [step, setStep] = useState<1 | 2>(1);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const router = useRouter();

    const handleSendOtp = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await api.post('/auth/forgot-password', { email });
            toast.success("If an account exists, an OTP has been sent to your email.");
            setStep(2);
        } catch (e: unknown) {
            console.error(e);
            const errorMsg = (e as any).response?.data?.message;
            setError(errorMsg || "Failed to send OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            await api.post('/auth/reset-password', { email, otp, newPassword });
            toast.success("Password reset successfully. Please login.", { duration: 4000 });
            router.push("/login");
        } catch (e: unknown) {
            console.error(e);
            const errorMsg = (e as any).response?.data?.message;
            setError(errorMsg || "Failed to reset password. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Reset Password"
            subtitle={step === 1 ? "Enter your email to receive a verification code." : "Enter the verification code and your new password."}
            robotFocusedField={focusedField}
        >
            {loading && <FullScreenLoader message="Processing..." />}

            {error && (
                <div className="mt-6 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            {step === 1 ? (
                <form className="mt-6 space-y-6" onSubmit={handleSendOtp}>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                id="email"
                                placeholder="Email Address"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onFocus={() => setFocusedField("email")}
                                onBlur={() => setFocusedField(null)}
                                required
                                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-violet-500/50"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full justify-center rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? "Sending..." : "Send Verification Code"}
                    </button>
                </form>
            ) : (
                <form className="mt-6 space-y-6" onSubmit={handleResetPassword}>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                id="otp"
                                placeholder="6-digit Verification Code"
                                type="text"
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                onFocus={() => setFocusedField("otp")}
                                onBlur={() => setFocusedField(null)}
                                required
                                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-violet-500/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="relative">
                                <Input
                                    id="newPassword"
                                    placeholder="New Password"
                                    type={showPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    onFocus={() => setFocusedField("newPassword")}
                                    onBlur={() => setFocusedField(null)}
                                    required
                                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-violet-500/50 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    placeholder="Confirm New Password"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    onFocus={() => setFocusedField("confirmPassword")}
                                    onBlur={() => setFocusedField(null)}
                                    required
                                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-violet-500/50 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full justify-center rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? "Resetting..." : "Reset Password"}
                    </button>
                    
                    <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="w-full text-center text-sm font-medium text-zinc-400 hover:text-white transition-colors mt-2"
                    >
                        Back to email
                    </button>
                </form>
            )}

            <div className="mt-8 text-center text-sm text-zinc-400">
                Remember your password?{" "}
                <Link href="/login" className="font-medium text-violet-400 hover:text-violet-300 transition-colors">
                    Sign in here →
                </Link>
            </div>
        </AuthLayout>
    );
}

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={<FullScreenLoader message="Loading..." />}>
            <ForgotPasswordForm />
        </Suspense>
    );
}
