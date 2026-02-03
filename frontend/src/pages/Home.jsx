import {
    BarChart2,
    CheckCircle2,
    Clock,
    MessageSquare,
    Send,
    Shield,
    Users,
    Zap,
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const features = [
    {
        icon: Send,
        title: "Bulk Messaging",
        desc: "Send WhatsApp campaigns to thousands of users instantly with high delivery rates.",
    },
    {
        icon: Zap,
        title: "Flexible Credit System",
        desc: "Only pay for what you use. Top-up credits anytime without changing plans.",
    },
    {
        icon: BarChart2,
        title: "Advanced Analytics",
        desc: "Track sent, delivered, failed messages and engagement in real time.",
    },
    {
        icon: Shield,
        title: "Secure & Reliable",
        desc: "Enterprise-grade security, OTP login, encrypted data and 99.9% uptime.",
    },
];

const useCases = [
    "Marketing campaigns & promotions",
    "Order & payment notifications",
    "Customer support & chatbots",
    "OTP & transactional messages",
    "Internal team alerts",
];

export default function Home() {
    const { user } = useAuth();

    if (user) {
        return <Navigate to="/dashboard" replace />;
    }


    return (
        <div className="min-h-[calc(100vh-64px)] bg-white">
            {/* ───────────────── HERO ───────────────── */}
            <section className="relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 pt-28 pb-24 text-center">
                    <span className="inline-flex items-center gap-2 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-4 py-1 mb-6">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        WhatsApp Bulk Messaging & AI Chatbots
                    </span>

                    <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 tracking-tight leading-tight mb-6">
                        Power your messaging
                        <br />
                        <span className="text-green-600">at massive scale</span>
                    </h1>

                    <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed mb-10">
                        BulkSend helps businesses send WhatsApp campaigns, automate chats,
                        and manage customer communication — fast, secure, and affordable.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-4">
                        {user ? (
                            <Link
                                to="/dashboard"
                                className="px-7 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 shadow-lg shadow-green-200 transition"
                            >
                                Go to Dashboard →
                            </Link>
                        ) : (
                            <>
                                <Link
                                    to="/signup"
                                    className="px-7 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 shadow-lg shadow-green-200 transition"
                                >
                                    Start Free
                                </Link>
                                <Link
                                    to="/login"
                                    className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-green-700 transition"
                                >
                                    Login to existing account
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* ───────────────── FEATURES ───────────────── */}
            <section className="max-w-7xl mx-auto px-6 pb-28">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map(({ icon: Icon, title, desc }) => (
                        <div
                            key={title}
                            className="bg-gray-50 border border-gray-100 rounded-2xl p-6 hover:shadow-md hover:border-green-200 transition"
                        >
                            <div className="w-11 h-11 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center mb-4">
                                <Icon className="w-5 h-5 text-green-600" />
                            </div>
                            <h3 className="text-sm font-semibold text-gray-800 mb-2">
                                {title}
                            </h3>
                            <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ───────────────── HOW IT WORKS ───────────────── */}
            <section className="bg-gray-50 border-y">
                <div className="max-w-6xl mx-auto px-6 py-24">
                    <h2 className="text-3xl font-bold text-gray-900 text-center mb-14">
                        How BulkSend works
                    </h2>

                    <div className="grid md:grid-cols-3 gap-10">
                        {[
                            {
                                icon: Users,
                                title: "Upload Contacts",
                                desc: "Import your audience via CSV or API in seconds.",
                            },
                            {
                                icon: MessageSquare,
                                title: "Create Campaign",
                                desc: "Write messages, add variables, or connect AI chatbots.",
                            },
                            {
                                icon: Clock,
                                title: "Send & Track",
                                desc: "Launch campaigns and monitor performance live.",
                            },
                        ].map(({ icon: Icon, title, desc }) => (
                            <div key={title} className="text-center">
                                <div className="mx-auto w-14 h-14 rounded-2xl bg-white border flex items-center justify-center mb-5">
                                    <Icon className="w-6 h-6 text-green-600" />
                                </div>
                                <h3 className="font-semibold text-gray-800 mb-2">{title}</h3>
                                <p className="text-sm text-gray-500">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ───────────────── USE CASES ───────────────── */}
            <section className="max-w-6xl mx-auto px-6 py-24">
                <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">
                    Built for every messaging need
                </h2>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {useCases.map((item) => (
                        <div
                            key={item}
                            className="flex items-center gap-3 bg-white border rounded-xl px-5 py-4 shadow-sm"
                        >
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <span className="text-sm text-gray-700">{item}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* ───────────────── TRUST ───────────────── */}
            <section className="bg-green-600 text-white">
                <div className="max-w-6xl mx-auto px-6 py-20 text-center">
                    <h2 className="text-3xl font-bold mb-4">
                        Trusted, secure & scalable
                    </h2>
                    <p className="text-green-100 max-w-2xl mx-auto mb-8">
                        Built with modern infrastructure, role-based access, OTP
                        authentication and encrypted data storage.
                    </p>

                    <div className="flex flex-wrap justify-center gap-8 text-sm font-semibold">
                        <span>✔ 99.9% uptime</span>
                        <span>✔ Secure OTP login</span>
                        <span>✔ Scales to millions</span>
                    </div>
                </div>
            </section>

            {/* ───────────────── FINAL CTA ───────────────── */}
            <section className="max-w-6xl mx-auto px-6 py-24 text-center">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                    Start messaging smarter today
                </h2>
                <p className="text-gray-500 max-w-xl mx-auto mb-8">
                    Create your account in under a minute and start sending WhatsApp
                    campaigns instantly.
                </p>

                <Link
                    to={user ? "/dashboard" : "/signup"}
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 shadow-lg shadow-green-200 transition"
                >
                    {user ? "Open Dashboard" : "Get Started Free"}
                </Link>
            </section>
        </div>
    );
}
