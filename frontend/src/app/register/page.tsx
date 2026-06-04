"use client";

import { useState, FormEvent, Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import { Input } from "@/components/ui/input";
import { AuthLayout } from "@/components/AuthLayout";
import { useAuth } from "@/context/AuthProvider";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useGoogleLogin } from '@react-oauth/google';
import { toast } from 'react-hot-toast';
import { FullScreenLoader } from "@/components/ui/full-screen-loader";

function getRoleDashboard(role: string): string {
    if (role === 'ADMIN') return '/admin/dashboard';
    if (role === 'MENTOR') return '/mentor/dashboard';
    return '/student/dashboard';
}

function RegisterForm() {
    const { user, isLoading: authLoading, login } = useAuth();
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const router = useRouter();

    // Redirect already-authenticated users
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
                if (!res.data.user.password) {
                    router.push("/set-password");
                } else {
                    router.push(getRoleDashboard(userRole));
                }
            } catch (error) {
                toast.error("Google Register Failed");
            }
        },
        onError: () => toast.error('Google login failed. Please try again.'),
    });

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        mobileNumber: "",
        location: "",
        password: "",
        confirmPassword: "",
        role: "STUDENT",
    });
    const [loading, setLoading] = useState(false);
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);

    const handleSendOtp = async () => {
        if (!formData.email) {
            toast.error("Please enter an email address first.");
            return;
        }
        setLoading(true);
        try {
            await api.post('/otp/send', { email: formData.email, type: 'REGISTRATION' });
            setOtpSent(true);
            toast.success("OTP sent to your email!");
        } catch (error: any) {
            toast.error("Failed to send OTP: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp) return;
        setLoading(true);
        try {
            const res = await api.post('/otp/verify', { email: formData.email, otp, type: 'REGISTRATION' });
            if (res.data.valid) {
                setOtpVerified(true);
                toast.success("Email verified successfully!");
            } else {
                toast.error("Invalid OTP. Please try again.");
            }
        } catch (error: any) {
            toast.error("Verification failed: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    // Prevent flashing of register form while checking auth
    if (authLoading) {
        return <FullScreenLoader message="Checking session..." />;
    }

    // Don't render register form for already-authenticated users
    if (user) {
        return <FullScreenLoader message="Redirecting to your dashboard..." />;
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!otpVerified) {
            toast.error("Please verify your email with OTP first!");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match!");
            return;
        }

        if (!/^[0-9]{10}$/.test(formData.mobileNumber)) {
            toast.error("Mobile number must be exactly 10 digits!");
            return;
        }

        if (formData.password.length < 8) {
            toast.error("Password must be at least 8 characters!");
            return;
        }

        setLoading(true);

        try {
            const { confirmPassword, ...dataToSend } = formData;
            await api.post('/auth/register', dataToSend);
            toast.success("Welcome! Registration successful. Please login to continue.");
            router.push(`/login`);
        } catch (e: any) {
            let message = "Registration failed";
            if (e.response?.data?.message) {
                if (Array.isArray(e.response.data.message)) {
                    message = e.response.data.message.join(', ');
                } else {
                    message = e.response.data.message;
                }
            }
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout title="Join CodeDabba" subtitle="Create your account" robotFocusedField={focusedField}>
            <div className="w-full">

                <div className="text-center lg:text-left">
                    <h2 className="text-2xl font-bold tracking-tight text-white">
                        Create an account
                    </h2>
                    <p className="mt-2 text-sm text-zinc-400">
                        Already have an account?{" "}
                        <Link
                            href="/login"
                            className="font-medium text-violet-400 hover:text-violet-300 transition-colors"
                        >
                            Login
                        </Link>
                    </p>
                </div>

                <form className="mt-8 space-y-5" onSubmit={handleRegister}>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-4">
                            <Input
                                id="name"
                                name="name"
                                placeholder="Full Name"
                                type="text"
                                value={formData.name}
                                onChange={handleChange}
                                onFocus={() => setFocusedField("name")}
                                onBlur={() => setFocusedField(null)}
                                required
                                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-violet-500/50"
                            />
                            <Input
                                id="email"
                                name="email"
                                placeholder="Email Address"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                onFocus={() => setFocusedField("email")}
                                onBlur={() => setFocusedField(null)}
                                required
                                disabled={otpVerified}
                                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-violet-500/50 disabled:opacity-60"
                            />

                            {!otpVerified && (
                                <div className="flex gap-2">
                                    {!otpSent ? (
                                        <button
                                            type="button"
                                            onClick={handleSendOtp}
                                            disabled={loading || !formData.email}
                                            className="px-4 py-2 bg-violet-600 text-white rounded-md text-sm hover:bg-violet-700 disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                                            Send OTP
                                        </button>
                                    ) : (
                                        <>
                                            <Input
                                                placeholder="Enter OTP"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value)}
                                                maxLength={6}
                                                className="bg-zinc-800 border-zinc-700 text-white w-32"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleVerifyOtp}
                                                disabled={loading || !otp}
                                                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                                            >
                                                {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                                                Verify
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setOtpSent(false); setOtp(""); }}
                                                className="px-3 py-2 bg-zinc-800 text-zinc-400 rounded-md text-sm hover:bg-zinc-700"
                                            >
                                                Resend
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}

                            {otpVerified && (
                                <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                                    <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                                        <span className="text-[10px]">✓</span>
                                    </div>
                                    Email Verified
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    id="mobileNumber"
                                    name="mobileNumber"
                                    placeholder="Mobile Number"
                                    type="tel"
                                    value={formData.mobileNumber}
                                    onChange={handleChange}
                                    onFocus={() => setFocusedField("mobileNumber")}
                                    onBlur={() => setFocusedField(null)}
                                    required
                                    maxLength={10}
                                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-violet-500/50"
                                />
                                <Input
                                    id="location"
                                    name="location"
                                    placeholder="Location"
                                    type="text"
                                    value={formData.location}
                                    onChange={handleChange}
                                    onFocus={() => setFocusedField("location")}
                                    onBlur={() => setFocusedField(null)}
                                    required
                                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-violet-500/50"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative">
                                    <Input
                                        id="password"
                                        name="password"
                                        placeholder="Password (min 8 chars)"
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={handleChange}
                                        onFocus={() => setFocusedField("password")}
                                        onBlur={() => setFocusedField(null)}
                                        required
                                        minLength={8}
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
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        placeholder="Confirm Password"
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        onFocus={() => setFocusedField("confirmPassword")}
                                        onBlur={() => setFocusedField(null)}
                                        required
                                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-violet-500/50 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff size={20} />
                                        ) : (
                                            <Eye size={20} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-2">
                        <input
                            id="terms"
                            name="terms"
                            type="checkbox"
                            className="mt-0.5 h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-violet-600 focus:ring-violet-600"
                            required
                        />
                        <label
                            htmlFor="terms"
                            className="block text-sm text-zinc-400"
                        >
                            I agree to the <span className="text-zinc-300">Terms of Service</span> and <span className="text-zinc-300">Privacy Policy</span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full justify-center rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Creating Account...
                            </>
                        ) : "Create Account"}
                    </button>
                </form>

                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-zinc-800" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-zinc-950 px-2 text-zinc-500">
                            Or register with
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
                    Already have an account?{" "}
                    <Link href="/login" className="font-medium text-violet-400 hover:text-violet-300 transition-colors">
                        Log in
                    </Link>
                </div>
            </div>
        </AuthLayout>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<FullScreenLoader message="Loading..." />}>
            <RegisterForm />
        </Suspense>
    );
}