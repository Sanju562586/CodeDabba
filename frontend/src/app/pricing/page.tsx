import { NavBar } from "@/components/landing/NavBar";
import Link from "next/link";
import { CheckCircle2, XCircle, Zap, Crown, Building2, HelpCircle } from "lucide-react";

const plans = [
    {
        name: "Free",
        price: "$0",
        period: "",
        description: "Perfect for getting started on your coding journey.",
        icon: <Zap className="w-6 h-6 text-zinc-300" />,
        iconBg: "bg-zinc-700/50 border-zinc-600/30",
        cta: "Get Started Free",
        ctaHref: "/register",
        ctaStyle: "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700",
        popular: false,
        features: [
            { text: "Access to free courses", available: true },
            { text: "Basic coding challenges", available: true },
            { text: "Community forum access", available: true },
            { text: "Progress tracking", available: true },
            { text: "1-on-1 mentor sessions", available: false },
            { text: "Certificate of completion", available: false },
        ],
    },
    {
        name: "Pro",
        price: "$29",
        period: "/month",
        description: "For serious learners who want to accelerate their growth.",
        icon: <Crown className="w-6 h-6 text-violet-300" />,
        iconBg: "bg-violet-500/20 border-violet-500/30",
        cta: "Start Pro Trial",
        ctaHref: "/register",
        ctaStyle: "bg-violet-600 hover:bg-violet-500 text-white shadow-xl shadow-violet-500/25",
        popular: true,
        features: [
            { text: "Access to all courses", available: true },
            { text: "Advanced coding challenges", available: true },
            { text: "Priority community support", available: true },
            { text: "Progress tracking & analytics", available: true },
            { text: "1-on-1 mentor sessions", available: true },
            { text: "Certificate of completion", available: true },
        ],
    },
    {
        name: "Enterprise",
        price: "Custom",
        period: "",
        description: "For teams, bootcamps, and organizations.",
        icon: <Building2 className="w-6 h-6 text-amber-300" />,
        iconBg: "bg-amber-500/20 border-amber-500/30",
        cta: "Get in Touch",
        ctaHref: "/mentor-application",
        ctaStyle: "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700",
        popular: false,
        features: [
            { text: "Everything in Pro", available: true },
            { text: "Team management dashboard", available: true },
            { text: "Custom curriculum design", available: true },
            { text: "Dedicated account manager", available: true },
            { text: "Bulk seat licensing", available: true },
            { text: "API access & integrations", available: true },
        ],
    },
];

const faqs = [
    { q: "Can I change my plan anytime?", a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately on your next billing cycle." },
    { q: "Do you offer refunds?", a: "We offer a 30-day money-back guarantee for all paid plans. Contact our support team if you're not satisfied." },
    { q: "What payment methods do you accept?", a: "We accept all major credit cards (Visa, Mastercard, Amex), and UPI for Indian customers via Razorpay." },
    { q: "Do you offer student discounts?", a: "Yes! Students get 50% off Pro plans with a valid student ID. Reach out to our support team for verification." },
];

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            <NavBar />

            <main className="pt-28 pb-20">
                {/* Background */}
                <div className="fixed inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-700/10 rounded-full blur-[120px]" />
                </div>

                <div className="container mx-auto px-6 relative z-10">
                    {/* Header */}
                    <div className="text-center mb-20">
                        <span className="text-violet-400 font-medium tracking-wide uppercase text-xs">Simple & transparent</span>
                        <h1 className="text-5xl md:text-6xl font-bold mt-3 mb-5 bg-gradient-to-r from-violet-400 via-white to-white bg-clip-text text-transparent">
                            Choose Your Plan
                        </h1>
                        <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                            Start your coding journey with our flexible pricing. Upgrade or downgrade anytime with no lock-in.
                        </p>
                    </div>

                    {/* Pricing Cards */}
                    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-24">
                        {plans.map((plan) => (
                            <div
                                key={plan.name}
                                className={`relative rounded-2xl p-8 flex flex-col transition-all duration-300 ${
                                    plan.popular
                                        ? "bg-gradient-to-b from-violet-950/60 to-zinc-900/60 border-2 border-violet-500/50 shadow-2xl shadow-violet-500/15 scale-[1.02]"
                                        : "bg-zinc-900/40 border border-white/8 hover:border-white/15"
                                }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <span className="bg-violet-600 text-white px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg shadow-violet-500/30">
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                {/* Plan header */}
                                <div className="mb-8">
                                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-4 ${plan.iconBg}`}>
                                        {plan.icon}
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                                    <p className="text-sm text-zinc-500">{plan.description}</p>
                                </div>

                                {/* Price */}
                                <div className="mb-8">
                                    <div className="flex items-end gap-1">
                                        <span className="text-4xl font-bold text-white">{plan.price}</span>
                                        {plan.period && <span className="text-zinc-400 mb-1 text-sm">{plan.period}</span>}
                                    </div>
                                </div>

                                {/* Features */}
                                <ul className="space-y-3.5 mb-8 flex-1">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3">
                                            {feature.available ? (
                                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                            ) : (
                                                <XCircle className="w-4 h-4 text-zinc-700 shrink-0" />
                                            )}
                                            <span className={feature.available ? "text-zinc-300 text-sm" : "text-zinc-600 text-sm"}>
                                                {feature.text}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA */}
                                <Link
                                    href={plan.ctaHref}
                                    className={`w-full block text-center py-3.5 px-6 font-semibold rounded-xl transition-all text-sm ${plan.ctaStyle}`}
                                >
                                    {plan.cta}
                                </Link>
                            </div>
                        ))}
                    </div>

                    {/* FAQ Section */}
                    <div className="max-w-3xl mx-auto">
                        <div className="text-center mb-12">
                            <div className="inline-flex items-center gap-2 text-zinc-400 mb-3">
                                <HelpCircle className="w-5 h-5" />
                                <span className="font-semibold text-white">Frequently Asked Questions</span>
                            </div>
                            <p className="text-zinc-500 text-sm">Everything you need to know before getting started.</p>
                        </div>

                        <div className="space-y-1">
                            {faqs.map((faq, i) => (
                                <div key={i} className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
                                    <h3 className="text-base font-semibold text-white mb-2">{faq.q}</h3>
                                    <p className="text-zinc-400 text-sm leading-relaxed">{faq.a}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}