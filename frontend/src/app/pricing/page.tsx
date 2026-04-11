import { NavBar } from "@/components/landing/NavBar";
import Link from "next/link";

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            <NavBar />

            <main className="pt-24 pb-16">
                <div className="container mx-auto px-6">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-violet-400 to-purple-600 bg-clip-text text-transparent">
                            Choose Your Plan
                        </h1>
                        <p className="text-xl text-zinc-300 max-w-2xl mx-auto">
                            Start your coding journey with our flexible pricing. Upgrade or downgrade anytime.
                        </p>
                    </div>

                    {/* Pricing Cards */}
                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {/* Free Plan */}
                        <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-violet-500/50 transition-all">
                            <div className="text-center mb-8">
                                <h3 className="text-2xl font-bold mb-2">Free</h3>
                                <div className="text-4xl font-bold mb-2">$0</div>
                                <p className="text-zinc-400">Perfect for getting started</p>
                            </div>

                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>Access to free courses</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>Basic coding challenges</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>Community forum access</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-zinc-600 rounded-full"></div>
                                    <span className="text-zinc-500">Mentor support</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-zinc-600 rounded-full"></div>
                                    <span className="text-zinc-500">Certificate of completion</span>
                                </li>
                            </ul>

                            <Link
                                href="/register"
                                className="w-full block text-center py-3 px-6 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
                            >
                                Get Started Free
                            </Link>
                        </div>

                        {/* Pro Plan */}
                        <div className="bg-gradient-to-br from-violet-600/20 to-purple-600/20 backdrop-blur-sm border-2 border-violet-500/50 rounded-2xl p-8 relative hover:border-violet-400 transition-all">
                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                <span className="bg-violet-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                                    Most Popular
                                </span>
                            </div>

                            <div className="text-center mb-8">
                                <h3 className="text-2xl font-bold mb-2">Pro</h3>
                                <div className="text-4xl font-bold mb-2">$29<span className="text-lg text-zinc-400">/month</span></div>
                                <p className="text-zinc-400">For serious learners</p>
                            </div>

                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>Access to all courses</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>Advanced coding challenges</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>1-on-1 mentor sessions</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>Certificate of completion</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>Priority support</span>
                                </li>
                            </ul>

                            <Link
                                href="/register"
                                className="w-full block text-center py-3 px-6 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl transition-colors"
                            >
                                Start Pro Trial
                            </Link>
                        </div>

                        {/* Enterprise Plan */}
                        <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-violet-500/50 transition-all">
                            <div className="text-center mb-8">
                                <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                                <div className="text-4xl font-bold mb-2">Custom</div>
                                <p className="text-zinc-400">For teams and organizations</p>
                            </div>

                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>Everything in Pro</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>Team management dashboard</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>Custom curriculum</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>Dedicated account manager</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>API access</span>
                                </li>
                            </ul>

                            <Link
                                href="/contact"
                                className="w-full block text-center py-3 px-6 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
                            >
                                Contact Sales
                            </Link>
                        </div>
                    </div>

                    {/* FAQ Section */}
                    <div className="mt-24 max-w-4xl mx-auto">
                        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>

                        <div className="space-y-8">
                            <div className="border-b border-white/10 pb-8">
                                <h3 className="text-xl font-semibold mb-4">Can I change my plan anytime?</h3>
                                <p className="text-zinc-300">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
                            </div>

                            <div className="border-b border-white/10 pb-8">
                                <h3 className="text-xl font-semibold mb-4">Do you offer refunds?</h3>
                                <p className="text-zinc-300">We offer a 30-day money-back guarantee for all paid plans. Contact support if you need a refund.</p>
                            </div>

                            <div className="border-b border-white/10 pb-8">
                                <h3 className="text-xl font-semibold mb-4">What payment methods do you accept?</h3>
                                <p className="text-zinc-300">We accept all major credit cards, PayPal, and bank transfers for enterprise customers.</p>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold mb-4">Do you offer student discounts?</h3>
                                <p className="text-zinc-300">Yes! Students get 50% off Pro plans with valid student ID. Contact support for verification.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}