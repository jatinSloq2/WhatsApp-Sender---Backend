import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ArrowRight,
    BarChart2,
    CheckCircle2,
    Clock,
    CreditCard,
    Loader2,
    MessageSquare,
    Send,
    Shield,
    Sparkles,
    TrendingUp,
    Users,
    Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCredits } from "../context/CreditContext";
import { usePlans } from "../context/PlanContext";

const features = [
    {
        icon: Send,
        title: "Bulk Messaging",
        desc: "Send WhatsApp campaigns to thousands of contacts with high delivery rates.",
    },
    {
        icon: MessageSquare,
        title: "AI Chatbots",
        desc: "Automate customer conversations with intelligent AI-powered responses.",
    },
    {
        icon: Zap,
        title: "Pay As You Go",
        desc: "Flexible credit system - only pay for what you use, no hidden fees.",
    },
    {
        icon: BarChart2,
        title: "Real-Time Analytics",
        desc: "Track delivery, opens, and engagement metrics with live dashboards.",
    },
    {
        icon: Shield,
        title: "Enterprise Security",
        desc: "OTP authentication, encrypted data, and 99.9% uptime guarantee.",
    },
    {
        icon: TrendingUp,
        title: "Auto-Scaling",
        desc: "Infrastructure built to handle millions of messages seamlessly.",
    },
];

const useCases = [
    "Marketing campaigns & promotions",
    "Order & payment notifications",
    "Customer support automation",
    "OTP & transactional alerts",
    "Internal team communications",
    "Event reminders & updates",
];

const stats = [
    { value: "10M+", label: "Messages Sent" },
    { value: "5,000+", label: "Active Users" },
    { value: "99.9%", label: "Uptime" },
    { value: "4.9/5", label: "User Rating" },
];

const testimonials = [
    {
        name: "Rahul Sharma",
        role: "Marketing Head, TechCorp",
        text: "WhatsBot transformed our campaign delivery. We reached 50,000 customers in minutes with 98% delivery rate.",
        rating: 5,
    },
    {
        name: "Priya Patel",
        role: "E-commerce Owner",
        text: "The credit system is perfect for our business. We only pay for what we use, saving thousands monthly.",
        rating: 5,
    },
    {
        name: "Amit Kumar",
        role: "Startup Founder",
        text: "Started with the free plan, scaled to Pro seamlessly. The AI chatbot handles 80% of our support queries now.",
        rating: 5,
    },
];

export default function Home() {
    const { user } = useAuth();
    const { getCreditPacks } = useCredits();
    const { getPlans } = usePlans();

    const [creditPacks, setCreditPacks] = useState([]);
    const [plans, setPlans] = useState([]);
    const [billingCycle, setBillingCycle] = useState("MONTHLY");
    const [loading, setLoading] = useState(true);
    const [pricingHighlights, setPricingHighlights] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const packsData = await getCreditPacks();
                setCreditPacks(packsData || []);

                if (packsData && packsData.length > 0) {
                    const sortedPacks = [...packsData].sort((a, b) => a.credits - b.credits);
                    const smallestPack = sortedPacks[0];
                    const bestValuePack = sortedPacks.find(p => p.id === "pack_1000") || sortedPacks[sortedPacks.length - 1];

                    const highlights = [
                        {
                            title: "Per Message",
                            price: `₹${(smallestPack.price / smallestPack.credits).toFixed(2)} - ₹${(bestValuePack.price / bestValuePack.credits).toFixed(2)}`,
                            desc: "Credit cost varies by pack size",
                            icon: Zap,
                        },
                        {
                            title: "Starter Pack",
                            price: `₹${smallestPack.totalAmount.toLocaleString('en-IN')}`,
                            desc: `${smallestPack.credits} credits`,
                            icon: Sparkles,
                        },
                        {
                            title: "Best Value",
                            price: `₹${bestValuePack.totalAmount.toLocaleString('en-IN')}`,
                            desc: `${bestValuePack.credits.toLocaleString('en-IN')} credits`,
                            icon: TrendingUp,
                        },
                    ];
                    setPricingHighlights(highlights);
                }

                const plansData = await getPlans();
                setPlans(plansData || []);
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [getCreditPacks, getPlans]);

    const filteredPlans = plans
        .filter(plan => plan.billingCycle === billingCycle)
        .sort((a, b) => a.price - b.price);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(price);
    };

    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="min-h-screen bg-white">
            {/* HERO SECTION */}
            <section className="relative overflow-hidden bg-gradient-to-b from-green-50 to-white">
                <div className="max-w-7xl mx-auto px-6 pt-20 pb-24 text-center">
                    <Badge className="inline-flex items-center gap-2 bg-white text-[#25D366] border border-[#25D366]/20 px-4 py-2 font-semibold text-sm mb-8 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                        WhatsApp Business Messaging Platform
                    </Badge>

                    <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 tracking-tight leading-tight mb-6">
                        Scale Your WhatsApp
                        <br />
                        <span className="text-[#25D366]">Messaging & Automation</span>
                    </h1>

                    <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-12">
                        Send bulk campaigns, automate conversations with AI chatbots, and manage customer messaging from one powerful platform.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
                        <Link to="/signup">
                            <Button className="bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold px-8 py-6 text-lg shadow-lg shadow-green-200 h-auto">
                                Start Free <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </Link>
                        <Link to="/login">
                            <Button className="bg-white hover:bg-gray-50 text-gray-900 font-semibold px-8 py-6 text-lg border-2 border-gray-300 h-auto">
                                Sign In
                            </Button>
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                        {stats.map((stat) => (
                            <div key={stat.label} className="text-center">
                                <p className="text-4xl font-bold text-gray-900 mb-2">{stat.value}</p>
                                <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FEATURES SECTION */}
            <section className="max-w-7xl mx-auto px-6 py-20">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything You Need to Scale</h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">Powerful features designed for businesses of all sizes</p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map(({ icon: Icon, title, desc }) => (
                        <Card key={title} className="bg-white border border-gray-200 p-6 hover:shadow-lg hover:border-[#25D366]/30 transition-all">
                            <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center mb-4">
                                <Icon className="w-6 h-6 text-[#25D366]" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
                            <p className="text-gray-600 leading-relaxed">{desc}</p>
                        </Card>
                    ))}
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="bg-gray-50 border-y border-gray-200">
                <div className="max-w-6xl mx-auto px-6 py-20">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">How WhatsBot Works</h2>
                        <p className="text-lg text-gray-600">Simple, fast, and effective</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12">
                        {[
                            { icon: Users, step: "01", title: "Upload Contacts", desc: "Import your audience via CSV or API. Organize contacts into lists for targeted campaigns." },
                            { icon: MessageSquare, step: "02", title: "Create Campaign", desc: "Write messages, add variables, schedule sends, or connect AI chatbots for automation." },
                            { icon: Clock, step: "03", title: "Send & Track", desc: "Launch campaigns instantly and monitor delivery, opens, and responses in real-time." },
                        ].map(({ icon: Icon, step, title, desc }) => (
                            <div key={step} className="text-center">
                                <div className="relative mb-6">
                                    <div className="mx-auto w-16 h-16 rounded-2xl bg-white border-2 border-gray-200 flex items-center justify-center shadow-sm">
                                        <Icon className="w-8 h-8 text-[#25D366]" />
                                    </div>
                                    <span className="absolute -top-2 -right-2 w-8 h-8 bg-[#25D366] text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                                        {step}
                                    </span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
                                <p className="text-gray-600 leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* PRICING HIGHLIGHTS */}
            <section className="max-w-7xl mx-auto px-6 py-20">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">Transparent Pricing</h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">No hidden fees. Pay only for what you use.</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-12 h-12 text-[#25D366] animate-spin" />
                    </div>
                ) : (
                    <>
                        <div className="grid md:grid-cols-3 gap-8 mb-12">
                            {pricingHighlights.map(({ title, price, desc, icon: Icon }) => (
                                <Card key={title} className="bg-green-50 border border-green-100 p-8 text-center">
                                    <div className="w-16 h-16 mx-auto rounded-full bg-white border border-green-200 flex items-center justify-center mb-4">
                                        <Icon className="w-8 h-8 text-[#25D366]" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                                    <p className="text-3xl font-bold text-[#25D366] mb-2">{price}</p>
                                    <p className="text-sm text-gray-600 font-medium">{desc}</p>
                                </Card>
                            ))}
                        </div>

                        <div className="bg-amber-50 border border-amber-100 p-6 max-w-3xl mx-auto">
                            <div className="flex items-start gap-4">
                                <CreditCard className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Pricing Information</h3>
                                    <ul className="space-y-1 text-sm text-gray-700">
                                        <li>• All prices exclude GST (18% added at checkout)</li>
                                        <li>• Credits never expire while account is active</li>
                                        <li>• Volume discounts: Buy more, pay less per credit</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </section>

            {/* PLANS PREVIEW */}
            <section className="bg-gray-50 py-20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">Start free and scale as you grow.</p>

                        <div className="inline-flex items-center gap-2 p-1.5 bg-white border border-gray-200 shadow-sm">
                            <button
                                onClick={() => setBillingCycle("MONTHLY")}
                                className={`px-6 py-2 text-sm font-semibold transition-all ${billingCycle === "MONTHLY" ? "bg-[#25D366] text-white" : "text-gray-600 hover:text-gray-900"}`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setBillingCycle("YEARLY")}
                                className={`px-6 py-2 text-sm font-semibold transition-all relative ${billingCycle === "YEARLY" ? "bg-[#25D366] text-white" : "text-gray-600 hover:text-gray-900"}`}
                            >
                                Yearly
                                <span className="absolute -top-6 -right-8 bg-[#25D366] text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md">SAVE 20%</span>
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-12 h-12 text-[#25D366] animate-spin" />
                        </div>
                    ) : filteredPlans.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-600">No plans available for {billingCycle.toLowerCase()} billing.</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {filteredPlans.map((plan) => {
                                    const isPopular = plan.name === "PRO";
                                    const isFree = plan.price === 0;

                                    return (
                                        <Card
                                            key={plan._id}
                                            className={`bg-white p-6 relative transition-all ${isPopular ? "border-2 border-[#25D366] shadow-xl" : "border border-gray-200 hover:border-[#25D366]/30"}`}
                                        >
                                            {isPopular && (
                                                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#25D366] text-white px-3 py-1 font-semibold border-0">
                                                    POPULAR
                                                </Badge>
                                            )}

                                            <CardHeader className="p-0 mb-6">
                                                <CardTitle className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</CardTitle>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-3xl font-bold text-gray-900">{formatPrice(plan.price)}</span>
                                                    <span className="text-gray-500 font-medium">/{billingCycle === "MONTHLY" ? "mo" : "yr"}</span>
                                                </div>
                                            </CardHeader>

                                            <CardContent className="p-0">
                                                <div className="mb-6 p-3 bg-amber-50 border border-amber-100">
                                                    <div className="flex items-center gap-2">
                                                        <Zap className="w-5 h-5 text-amber-500" />
                                                        <span className="font-semibold text-gray-900">
                                                            {plan.creditsIncluded !== null ? plan.creditsIncluded.toLocaleString("en-IN") : "Unlimited"} credits
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="space-y-3 mb-6">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <CheckCircle2 className="w-4 h-4 text-[#25D366] flex-shrink-0" />
                                                        <span className="text-gray-700">
                                                            <strong>{plan.maxCampaignsPerMonth !== null ? plan.maxCampaignsPerMonth.toLocaleString("en-IN") : "Unlimited"}</strong> campaigns/month
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <CheckCircle2 className="w-4 h-4 text-[#25D366] flex-shrink-0" />
                                                        <span className="text-gray-700">
                                                            <strong>{plan.maxRecipientsPerCampaign !== null ? plan.maxRecipientsPerCampaign.toLocaleString("en-IN") : "Unlimited"}</strong> recipients
                                                        </span>
                                                    </div>
                                                    {plan.features?.analyticsAccess && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <CheckCircle2 className="w-4 h-4 text-[#25D366] flex-shrink-0" />
                                                            <span className="text-gray-700">Advanced Analytics</span>
                                                        </div>
                                                    )}
                                                    {plan.features?.prioritySupport && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <CheckCircle2 className="w-4 h-4 text-[#25D366] flex-shrink-0" />
                                                            <span className="text-gray-700">Priority Support</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <Link to="/plans">
                                                    <Button className={`w-full font-semibold ${isPopular ? "bg-[#25D366] hover:bg-[#20BD5A] text-white" : "bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300"}`}>
                                                        {isFree ? "Start Free" : "Subscribe Now"}
                                                    </Button>
                                                </Link>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>

                            <div className="text-center mt-12">
                                <Link to="/plans">
                                    <Button className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-8 py-4">
                                        View All Plans & Pricing
                                    </Button>
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* USE CASES */}
            <section className="max-w-7xl mx-auto px-6 py-20">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">Built for Every Use Case</h2>
                    <p className="text-lg text-gray-600">From marketing to support, WhatsBot handles it all</p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {useCases.map((useCase) => (
                        <Card key={useCase} className="bg-white border border-gray-200 p-6 hover:border-[#25D366]/30 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center flex-shrink-0">
                                    <CheckCircle2 className="w-6 h-6 text-[#25D366]" />
                                </div>
                                <span className="text-gray-900 font-medium">{useCase}</span>
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            {/* TESTIMONIALS */}
            <section className="bg-gray-50 border-y border-gray-200 py-20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Loved by Businesses</h2>
                        <p className="text-lg text-gray-600">See what our customers have to say</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial) => (
                            <Card key={testimonial.name} className="bg-white border border-gray-200 p-8">
                                <div className="flex gap-1 mb-4">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <span key={i} className="text-amber-400 text-xl">★</span>
                                    ))}
                                </div>
                                <p className="text-gray-700 leading-relaxed mb-6 italic">"{testimonial.text}"</p>
                                <div>
                                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* SECURITY */}
            <section className="bg-[#25D366] text-white py-20">
                <div className="max-w-6xl mx-auto px-6 text-center">
                    <h2 className="text-4xl font-bold mb-6">Enterprise-Grade Security</h2>
                    <p className="text-lg text-white/90 max-w-2xl mx-auto mb-12">
                        Your data is protected with bank-level security and industry-standard compliance.
                    </p>

                    <div className="grid md:grid-cols-3 gap-8 mb-12">
                        {[
                            { icon: Shield, text: "SSL Encrypted" },
                            { icon: CheckCircle2, text: "GDPR Compliant" },
                            { icon: Zap, text: "99.9% Uptime" },
                        ].map(({ icon: Icon, text }) => (
                            <div key={text} className="bg-white/10 border border-white/20 p-6">
                                <Icon className="w-12 h-12 mx-auto mb-4" />
                                <p className="font-semibold text-lg">{text}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-wrap justify-center gap-6 text-sm font-medium">
                        <span className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> OTP Authentication</span>
                        <span className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Data Encryption</span>
                        <span className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Regular Backups</span>
                    </div>
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="max-w-6xl mx-auto px-6 py-32 text-center">
                <h2 className="text-5xl font-bold text-gray-900 mb-6">Ready to Scale Your Messaging?</h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12">
                    Join thousands of businesses using WhatsBot to reach customers faster and smarter.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
                    <Link to="/signup">
                        <Button className="bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold px-10 py-6 shadow-lg shadow-green-200 text-lg h-auto">
                            Start Free Today <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </Link>
                    <Link to="/plans">
                        <Button className="bg-white hover:bg-gray-50 text-gray-900 font-semibold px-10 py-6 border-2 border-gray-300 text-lg h-auto">
                            View Pricing
                        </Button>
                    </Link>
                </div>

                <p className="text-sm text-gray-500">
                    No credit card required • Free plan available • Cancel anytime
                </p>
            </section>
        </div>
    );
}