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
        desc: "Send WhatsApp campaigns to thousands instantly. High delivery rates guaranteed.",
    },
    {
        icon: MessageSquare,
        title: "AI Chatbots",
        desc: "Automate customer conversations with intelligent AI-powered chatbots.",
    },
    {
        icon: Zap,
        title: "Flexible Credits",
        desc: "Pay only for what you use. Top-up credits anytime without changing plans.",
    },
    {
        icon: BarChart2,
        title: "Real-time Analytics",
        desc: "Track sent, delivered, failed messages and engagement metrics live.",
    },
    {
        icon: Shield,
        title: "Enterprise Security",
        desc: "OTP login, encrypted data, role-based access, and 99.9% uptime SLA.",
    },
    {
        icon: TrendingUp,
        title: "Auto-scaling",
        desc: "Built to handle millions of messages with low latency infrastructure.",
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
        text: "BulkSend transformed our campaign delivery. We reached 50,000 customers in minutes with 98% delivery rate.",
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
                // Fetch credit packs
                const packsData = await getCreditPacks();
                setCreditPacks(packsData || []);

                // Calculate pricing highlights from credit packs
                if (packsData && packsData.length > 0) {
                    // Find smallest and best value packs
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
                            desc: `${smallestPack.credits} credits (₹${(smallestPack.price / smallestPack.credits).toFixed(2)}/credit)`,
                            icon: Sparkles,
                        },
                        {
                            title: "Best Value",
                            price: `₹${bestValuePack.totalAmount.toLocaleString('en-IN')}`,
                            desc: `${bestValuePack.credits.toLocaleString('en-IN')} credits (₹${(bestValuePack.price / bestValuePack.credits).toFixed(2)}/credit)`,
                            icon: TrendingUp,
                        },
                    ];
                    setPricingHighlights(highlights);
                }

                // Fetch plans
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

    // Filter plans by billing cycle and sort by price
    const filteredPlans = plans
        .filter(plan => plan.billingCycle === billingCycle)
        .sort((a, b) => a.price - b.price);

    // Format currency
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
            {/* ═══════════════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════════════ */}
            <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-teal-50">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-green-200 rounded-full blur-3xl opacity-20 -z-10" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-200 rounded-full blur-3xl opacity-20 -z-10" />

                <div className="max-w-7xl mx-auto px-6 pt-24 pb-32 text-center">
                    {/* Badge */}
                    <Badge className="inline-flex items-center gap-2 bg-green-100 text-green-700 border-2 border-green-300 px-4 py-2 rounded-full font-semibold text-sm mb-8 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        WhatsApp Bulk Messaging & AI Chatbots
                    </Badge>

                    {/* Main heading */}
                    <h1 className="text-6xl sm:text-7xl font-black text-black tracking-tight leading-tight mb-6">
                        Power Your Messaging
                        <br />
                        <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                            At Massive Scale
                        </span>
                    </h1>

                    <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-12">
                        Send WhatsApp campaigns to thousands, automate customer conversations with AI,
                        and manage all your messaging from one powerful platform — fast, secure, and affordable.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
                        <Link to="/signup">
                            <Button className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-green-200 text-lg transition-all">
                                Start Free <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </Link>
                        <Link to="/login">
                            <Button className="bg-white hover:bg-gray-50 text-black font-semibold px-8 py-4 rounded-xl border-2 border-gray-300 text-lg transition-all">
                                Sign In
                            </Button>
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                        {stats.map((stat) => (
                            <div key={stat.label} className="text-center">
                                <p className="text-4xl font-black text-black mb-2">{stat.value}</p>
                                <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
          FEATURES SECTION
      ═══════════════════════════════════════════════════════ */}
            <section className="max-w-7xl mx-auto px-6 py-24">
                <div className="text-center mb-16">
                    <h2 className="text-5xl font-black text-black mb-4">
                        Everything You Need to Scale
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Powerful features designed for businesses of all sizes
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map(({ icon: Icon, title, desc }) => (
                        <Card
                            key={title}
                            className="bg-white border-2 border-gray-300 rounded-2xl p-8 hover:shadow-xl hover:border-green-600 transition-all duration-300"
                        >
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-100 to-teal-100 border-2 border-green-300 flex items-center justify-center mb-6">
                                <Icon className="w-7 h-7 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-black mb-3">{title}</h3>
                            <p className="text-gray-600 leading-relaxed">{desc}</p>
                        </Card>
                    ))}
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════════════════ */}
            <section className="bg-gray-50 border-y-2 border-gray-300">
                <div className="max-w-6xl mx-auto px-6 py-24">
                    <div className="text-center mb-16">
                        <h2 className="text-5xl font-black text-black mb-4">
                            How BulkSend Works
                        </h2>
                        <p className="text-lg text-gray-600">Simple, fast, and effective</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12">
                        {[
                            {
                                icon: Users,
                                step: "01",
                                title: "Upload Contacts",
                                desc: "Import your audience via CSV or API in seconds. Organize contacts into lists for targeted campaigns.",
                            },
                            {
                                icon: MessageSquare,
                                step: "02",
                                title: "Create Campaign",
                                desc: "Write messages, add variables, schedule sends, or connect AI chatbots for automated conversations.",
                            },
                            {
                                icon: Clock,
                                step: "03",
                                title: "Send & Track",
                                desc: "Launch campaigns instantly and monitor delivery, opens, clicks, and responses in real-time analytics.",
                            },
                        ].map(({ icon: Icon, step, title, desc }) => (
                            <div key={step} className="text-center">
                                <div className="relative mb-6">
                                    <div className="mx-auto w-20 h-20 rounded-2xl bg-white border-2 border-gray-300 flex items-center justify-center shadow-md">
                                        <Icon className="w-9 h-9 text-green-600" />
                                    </div>
                                    <span className="absolute -top-2 -right-2 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-black text-sm">
                                        {step}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-black mb-3">{title}</h3>
                                <p className="text-gray-600 leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
          PRICING HIGHLIGHTS
      ═══════════════════════════════════════════════════════ */}
            <section className="max-w-7xl mx-auto px-6 py-24">
                <div className="text-center mb-16">
                    <h2 className="text-5xl font-black text-black mb-4">
                        Transparent Pricing
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        No hidden fees. Pay only for what you use. Buy credits in packs or subscribe to a plan.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
                    </div>
                ) : (
                    <>
                        <div className="grid md:grid-cols-3 gap-8 mb-16">
                            {pricingHighlights.map(({ title, price, desc, icon: Icon }) => (
                                <Card
                                    key={title}
                                    className="bg-gradient-to-br from-green-50 to-teal-50 border-2 border-green-300 rounded-2xl p-8 text-center"
                                >
                                    <div className="w-16 h-16 mx-auto rounded-full bg-white border-2 border-green-300 flex items-center justify-center mb-4">
                                        <Icon className="w-8 h-8 text-green-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-black mb-2">{title}</h3>
                                    <p className="text-4xl font-black text-green-600 mb-2">{price}</p>
                                    <p className="text-sm text-gray-600 font-medium">{desc}</p>
                                </Card>
                            ))}
                        </div>

                        {/* GST Notice */}
                        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 max-w-3xl mx-auto">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                    <CreditCard className="w-6 h-6 text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-black mb-2">Pricing Information</h3>
                                    <ul className="space-y-1 text-sm text-gray-700">
                                        <li>• All prices exclude GST (18% will be added at checkout)</li>
                                        <li>• Credits never expire while your account is active</li>
                                        <li>• Volume discounts: Buy more credits, pay less per credit</li>
                                        <li>• Subscription plans include monthly credit refills</li>
                                        <li>• Custom enterprise pricing available for high-volume needs</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </section>

            {/* ═══════════════════════════════════════════════════════
          PLANS PREVIEW
      ═══════════════════════════════════════════════════════ */}
            <section className="bg-gradient-to-br from-gray-50 to-green-50 py-24">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-5xl font-black text-black mb-4">
                            Choose Your Plan
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
                            Start free and scale as you grow. All plans include core features.
                        </p>

                        {/* Billing Toggle */}
                        <div className="inline-flex items-center gap-2 p-1.5 bg-white rounded-2xl shadow-md border-2 border-gray-300">
                            <button
                                onClick={() => setBillingCycle("MONTHLY")}
                                className={`px-8 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${
                                    billingCycle === "MONTHLY"
                                        ? "bg-green-600 text-white shadow-md"
                                        : "text-gray-600 hover:text-black"
                                }`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setBillingCycle("YEARLY")}
                                className={`px-8 py-3 text-sm font-bold rounded-xl transition-all duration-200 relative ${
                                    billingCycle === "YEARLY"
                                        ? "bg-green-600 text-white shadow-md"
                                        : "text-gray-600 hover:text-black"
                                }`}
                            >
                                Yearly
                                <span className="absolute -top-5 -right-10 bg-gradient-to-r from-green-500 to-teal-500 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-lg">
                                    SAVE 20%
                                </span>
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
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
                                            className={`bg-white rounded-2xl p-6 relative transition-all duration-300 ${
                                                isPopular
                                                    ? "border-4 border-green-600 shadow-2xl shadow-green-200"
                                                    : "border-2 border-gray-300 hover:border-green-600"
                                            }`}
                                        >
                                            {isPopular && (
                                                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-1 font-bold border-0 shadow-lg">
                                                    MOST POPULAR
                                                </Badge>
                                            )}

                                            <CardHeader className="p-0 mb-6">
                                                <CardTitle className="text-2xl font-black text-black mb-2">
                                                    {plan.name}
                                                </CardTitle>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-4xl font-black text-black">
                                                        {formatPrice(plan.price)}
                                                    </span>
                                                    <span className="text-gray-500 font-semibold">
                                                        /{billingCycle === "MONTHLY" ? "mo" : "yr"}
                                                    </span>
                                                </div>
                                                {billingCycle === "YEARLY" && !isFree && (
                                                    <p className="text-xs text-green-600 font-semibold mt-1">
                                                        Save 20% compared to monthly
                                                    </p>
                                                )}
                                            </CardHeader>

                                            <CardContent className="p-0">
                                                <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
                                                    <div className="flex items-center gap-2">
                                                        <Zap className="w-5 h-5 text-amber-500" />
                                                        <span className="font-bold text-black">
                                                            {plan.creditsIncluded !== null
                                                                ? plan.creditsIncluded.toLocaleString("en-IN")
                                                                : "Unlimited"}{" "}
                                                            credits
                                                        </span>
                                                    </div>
                                                    {billingCycle === "YEARLY" && plan.creditsIncluded && (
                                                        <p className="text-xs text-gray-600 mt-1">
                                                            ~{Math.round(plan.creditsIncluded / 12).toLocaleString("en-IN")} per month
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="space-y-3 mb-6">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                                                        <span className="text-gray-700">
                                                            <strong>
                                                                {plan.maxCampaignsPerMonth !== null
                                                                    ? plan.maxCampaignsPerMonth.toLocaleString("en-IN")
                                                                    : "Unlimited"}
                                                            </strong>{" "}
                                                            campaigns/month
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                                                        <span className="text-gray-700">
                                                            <strong>
                                                                {plan.maxRecipientsPerCampaign !== null
                                                                    ? plan.maxRecipientsPerCampaign.toLocaleString("en-IN")
                                                                    : "Unlimited"}
                                                            </strong>{" "}
                                                            recipients/campaign
                                                        </span>
                                                    </div>
                                                    {plan.features?.analyticsAccess && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                                                            <span className="text-gray-700">Advanced Analytics</span>
                                                        </div>
                                                    )}
                                                    {plan.features?.prioritySupport && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                                                            <span className="text-gray-700">Priority Support</span>
                                                        </div>
                                                    )}
                                                    {plan.features?.customTemplates && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                                                            <span className="text-gray-700">Custom Templates</span>
                                                        </div>
                                                    )}
                                                    {plan.features?.apiAccess && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                                                            <span className="text-gray-700">API Access</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <Link to="/plans">
                                                    <Button
                                                        className={`w-full py-3 rounded-xl font-bold transition-all ${
                                                            isPopular
                                                                ? "bg-green-600 hover:bg-green-700 text-white shadow-md"
                                                                : "bg-white hover:bg-gray-50 text-black border-2 border-gray-300"
                                                        }`}
                                                    >
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
                                    <Button className="bg-black hover:bg-gray-800 text-white font-bold px-8 py-4 rounded-xl shadow-lg transition-all">
                                        View All Plans & Pricing
                                    </Button>
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
          USE CASES
      ═══════════════════════════════════════════════════════ */}
            <section className="max-w-7xl mx-auto px-6 py-24">
                <div className="text-center mb-16">
                    <h2 className="text-5xl font-black text-black mb-4">
                        Built for Every Use Case
                    </h2>
                    <p className="text-lg text-gray-600">
                        From marketing to support, BulkSend handles it all
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {useCases.map((useCase) => (
                        <Card
                            key={useCase}
                            className="bg-white border-2 border-gray-300 rounded-xl p-6 hover:border-green-600 transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-green-100 border border-green-300 flex items-center justify-center flex-shrink-0">
                                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                                </div>
                                <span className="text-black font-semibold">{useCase}</span>
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
          TESTIMONIALS
      ═══════════════════════════════════════════════════════ */}
            <section className="bg-gray-50 border-y-2 border-gray-300 py-24">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-5xl font-black text-black mb-4">
                            Loved by Businesses
                        </h2>
                        <p className="text-lg text-gray-600">
                            See what our customers have to say
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial) => (
                            <Card
                                key={testimonial.name}
                                className="bg-white border-2 border-gray-300 rounded-2xl p-8"
                            >
                                <div className="flex gap-1 mb-4">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <span key={i} className="text-amber-400 text-xl">★</span>
                                    ))}
                                </div>
                                <p className="text-gray-700 leading-relaxed mb-6 italic">
                                    "{testimonial.text}"
                                </p>
                                <div>
                                    <p className="font-bold text-black">{testimonial.name}</p>
                                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
          TRUST & SECURITY
      ═══════════════════════════════════════════════════════ */}
            <section className="bg-gradient-to-r from-green-600 to-teal-600 text-white py-24">
                <div className="max-w-6xl mx-auto px-6 text-center">
                    <h2 className="text-5xl font-black mb-6">
                        Enterprise-Grade Security
                    </h2>
                    <p className="text-green-100 text-lg max-w-2xl mx-auto mb-12">
                        Your data is protected with bank-level security, encrypted storage,
                        and compliance with industry standards.
                    </p>

                    <div className="grid md:grid-cols-3 gap-8 mb-12">
                        {[
                            { icon: Shield, text: "SSL Encrypted" },
                            { icon: CheckCircle2, text: "GDPR Compliant" },
                            { icon: Zap, text: "99.9% Uptime SLA" },
                        ].map(({ icon: Icon, text }) => (
                            <div
                                key={text}
                                className="bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-2xl p-6"
                            >
                                <Icon className="w-12 h-12 mx-auto mb-4" />
                                <p className="font-bold text-lg">{text}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-wrap justify-center gap-6 text-sm font-semibold">
                        <span className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5" /> OTP Authentication
                        </span>
                        <span className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5" /> Role-Based Access
                        </span>
                        <span className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5" /> Data Encryption
                        </span>
                        <span className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5" /> Regular Backups
                        </span>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
          FINAL CTA
      ═══════════════════════════════════════════════════════ */}
            <section className="max-w-6xl mx-auto px-6 py-32 text-center">
                <h2 className="text-6xl font-black text-black mb-6">
                    Ready to Scale Your Messaging?
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12">
                    Join thousands of businesses using BulkSend to reach their customers
                    faster, smarter, and more effectively.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
                    <Link to="/signup">
                        <Button className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl px-10 py-5 shadow-lg shadow-green-200 text-lg transition-all">
                            Start Free Today <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </Link>
                    <Link to="/plans">
                        <Button className="bg-white hover:bg-gray-50 text-black font-semibold px-10 py-5 rounded-xl border-2 border-gray-300 text-lg transition-all">
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