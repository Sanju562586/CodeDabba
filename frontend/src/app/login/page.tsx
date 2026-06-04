"use client";

import { useAuth } from "@/context/AuthProvider";
import { useState, FormEvent, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import { useGoogleLogin } from '@react-oauth/google';
import { AuthLayout } from "@/components/AuthLayout";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { toast } from 'react-hot-toast';
import { FullScreenLoader } from "@/components/ui/full-screen-loader";

function getRoleDashboard(role: string): string {
    if (role === 'ADMIN') return '/admin/dashboard';
    if (role === 'MENTOR') return '/mentor/dashboard';
    return '/student/dashboard';
}

function LoginForm() {
    const { login, user, isLoading: authLoading } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const router = useRouter();

    // Redirect already-authenticated users to their dashboard
    useEffect(() => {
        if (!authLoading && user) {
            router.replace(getRoleDashboard(user.role));
        }
    }, [user, authLoading, router]);

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const res = await api.post('/auth/google', { token: tokenResponse.access_token });
                login(res.data);
                const userRole = res.data.user.role;
                const userName = res.data.user.name || "User";
                toast.success(`Welcome back, ${userName}!`, { duration: 3000 });
                router.push(getRoleDashboard(userRole));
            } catch (error) {
                console.error(error);
                setError("Google Login Failed. Please try again.");
            }
        },
        onError: () => setError('Google Login Failed.'),
    });

    // Prevent flashing of login form while checking auth
    if (authLoading) {
        return <FullScreenLoader message="Checking session..." />;
    }

    // Don't render login form for already-authenticated users
    if (user) {
        return <FullScreenLoader message="Redirecting to your dashboard..." />;
    }

    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await api.post('/auth/login', { email, password });
            login(response.data);
            const userName = response.data.user.name || "User";
            toast.success(`Welcome back, ${userName}!`, { duration: 3000 });

            // Role-aware redirect
            const userRole = response.data.user.role;
            router.push(getRoleDashboard(userRole));
        } catch (e: unknown) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const errorMsg = (e as any).response?.data?.message;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const status = (e as any).response?.status;
            if (status === 500) {
                setError("Server error occurred. Please try again later.");
            } else if (!status) {
                setError("Network error. Please check your connection or try again later.");
            } else {
                setError(errorMsg || "Incorrect email or password. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Welcome Back"
            subtitle="Sign in to continue your journey with CodeDabba."
            robotFocusedField={focusedField}
        >
            {loading && <FullScreenLoader message="Signing in..." />}

            {error && (
                <div className="mt-6 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            <form className="mt-6 space-y-6" onSubmit={handleLogin}>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Input
                            id="email"
                            placeholder="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onFocus={() => setFocusedField("email")}
                            onBlur={() => setFocusedField(null)}
                            required
                            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-violet-500/50"
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="relative">
                            <Input
                                id="password"
                                placeholder="Password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setFocusedField("password")}
                                onBlur={() => setFocusedField(null)}
                                required
                                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-violet-500/50 pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? (
                                    <EyeOff size={20} />
                                ) : (
                                    <Eye size={20} />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="text-sm text-zinc-500">
                        By signing in, you agree to our{" "}
                        <span className="text-zinc-400">Terms of Service</span>
                    </div>

                    <div className="text-sm">
                        <Link
                            href="/forgot-password"
                            className="font-medium text-violet-400 hover:text-violet-300 transition-colors"
                        >
                            Forgot password?
                        </Link>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full justify-center rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Signing in...
                        </span>
                    ) : "Sign In"}
                </button>
            </form>

            <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-zinc-950 px-2 text-zinc-500">
                        Or login with
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button
                    className="relative flex items-center justify-center px-4 w-full rounded-lg h-10 font-medium bg-zinc-800/50 border border-zinc-700/50 text-zinc-500 cursor-not-allowed transition-colors"
                    type="button"
                    disabled
                    title="GitHub login coming soon"
                >
                    GitHub
                    <span className="ml-2 text-xs text-zinc-600">(Soon)</span>
                </button>
                <button
                    className="relative flex items-center justify-center px-4 w-full rounded-lg h-10 font-medium bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white transition-colors"
                    type="button"
                    onClick={() => googleLogin()}
                >
                    Google
                </button>
            </div>

            <div className="mt-8 text-center text-sm text-zinc-400">
                New to CodeDabba?{" "}
                <Link href="/register" className="font-medium text-violet-400 hover:text-violet-300 transition-colors">
                    Create a free account →
                </Link>
            </div>
        </AuthLayout>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<FullScreenLoader message="Loading..." />}>
            <LoginForm />
        </Suspense>
    );
}