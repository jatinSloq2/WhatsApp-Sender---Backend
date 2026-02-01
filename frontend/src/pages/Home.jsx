import { BarChart2, Send, Shield, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const features = [
    { icon: Send, title: 'Bulk Messaging', desc: 'Send campaigns to thousands of contacts in one click.' },
    { icon: Zap, title: 'Credit System', desc: 'Flexible pay-as-you-go credits on top of your plan.' },
    { icon: BarChart2, title: 'Deep Analytics', desc: 'Track delivery rates, opens, and engagement in real time.' },
    { icon: Shield, title: 'Secure & Reliable', desc: 'Enterprise-grade security with 99.9% uptime SLA.' },
];

export default function Home() {
    const { user } = useAuth();

    return (
        <div className="min-h-[calc(100vh-64px)] bg-white">

            {/* ── Hero ── */}
            <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center animate-fadeIn">

                {/* Badge */}
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1 mb-6">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Now available — WhatsApp bulk campaigns
                </span>

                <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight tracking-tighter mb-5">
                    Send bulk messages<br />
                    <span className="text-green-600">the smart way</span>
                </h1>

                <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-9 leading-relaxed">
                    A modern platform to manage, send, and analyse WhatsApp bulk campaigns — with flexible plans and a credit system that fits every budget.
                </p>

                {/* CTAs — swap based on auth */}
                <div className="flex flex-wrap items-center justify-center gap-3">
                    {user ? (
                        <Link
                            to="/dashboard"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors px-6 py-3 rounded-xl shadow-md shadow-green-200"
                        >
                            Go to Dashboard →
                        </Link>
                    ) : (
                        <>
                            <Link
                                to="/signup"
                                className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors px-6 py-3 rounded-xl shadow-md shadow-green-200"
                            >
                                Get Started Free
                            </Link>
                            <Link
                                to="/login"
                                className="text-sm font-medium text-gray-600 hover:text-green-700 transition-colors px-5 py-3"
                            >
                                Already have an account? Log in
                            </Link>
                        </>
                    )}
                </div>
            </section>

            {/* ── Features ── */}
            <section className="max-w-5xl mx-auto px-6 pb-28">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger">
                    {features.map(({ icon: Icon, title, desc }) => (
                        <div
                            key={title}
                            className="animate-fadeIn bg-gray-50 border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-green-200 transition-all duration-200"
                        >
                            <div className="w-10 h-10 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center mb-4">
                                <Icon size={18} className="text-green-600" strokeWidth={2} />
                            </div>
                            <h3 className="text-sm font-semibold text-gray-800 mb-1.5">{title}</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}