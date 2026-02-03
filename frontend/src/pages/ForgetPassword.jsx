// ForgotPassword_Improved.jsx
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, Mail, Send, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

// shadcn/ui
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const res = await fetch(`${API}/api/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const body = await res.json();

            if (!res.ok) {
                throw new Error(body.error?.message || "Failed to send reset link");
            }

            setSuccess(
                "If this email exists, a password reset link has been sent. Please check your inbox."
            );
            setEmail("");
        } catch (err) {
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] grid lg:grid-cols-2">
            {/* ═══ LEFT BRANDING PANEL ═══ */}
            <div className="hidden lg:flex flex-col justify-center px-16 bg-gradient-to-br from-green-600 to-teal-600 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

                <div className="relative z-10">
                    <div className="mb-8">
                        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                            <ShieldCheck className="w-4 h-4" />
                            <span className="text-sm font-semibold">Secure account recovery</span>
                        </div>
                    </div>

                    <h1 className="text-5xl font-black leading-tight mb-6">
                        Forgot Your
                        <br />
                        Password?
                    </h1>
                    <p className="text-green-100 text-lg max-w-md mb-12 leading-relaxed">
                        No worries! We'll send you a secure reset link to regain access to your account in minutes.
                    </p>

                    <div className="space-y-6">
                        <Feature
                            icon={Send}
                            title="Instant Reset Link"
                            desc="Receive a secure password reset link via email immediately"
                        />
                        <Feature
                            icon={ShieldCheck}
                            title="Secure Process"
                            desc="Your reset link is encrypted and expires after 1 hour"
                        />
                        <Feature
                            icon={CheckCircle2}
                            title="Quick Recovery"
                            desc="Regain access to your campaigns and data in under 5 minutes"
                        />
                    </div>
                </div>
            </div>

            {/* ═══ RIGHT FORM ═══ */}
            <div className="flex items-center justify-center px-6 py-12 bg-gray-50">
                <Card className="w-full max-w-md rounded-2xl shadow-xl border-2 border-gray-300">
                    <CardHeader className="text-center space-y-2 pb-6">
                        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl border-2 border-amber-300 flex items-center justify-center mb-4">
                            <KeyRound className="w-8 h-8 text-amber-600" />
                        </div>
                        <CardTitle className="text-3xl font-black text-black">Reset Password</CardTitle>
                        <CardDescription className="text-base text-gray-600">
                            Enter your email to receive a reset link
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email Input */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-bold text-black">
                                    Email Address
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="pl-11 py-3 border-2 border-gray-300 rounded-xl focus:border-green-600 focus:ring-2 focus:ring-green-200 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Error Alert */}
                            {error && (
                                <Alert className="bg-red-50 border-2 border-red-300 rounded-xl">
                                    <AlertDescription className="text-sm font-medium text-red-700">
                                        {error}
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Success Alert */}
                            {success && (
                                <Alert className="bg-green-50 border-2 border-green-300 rounded-xl">
                                    <AlertDescription className="text-sm font-medium text-green-700">
                                        {success}
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-md transition-all hover:shadow-lg disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Sending link...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5 mr-2" />
                                        Send Reset Link
                                    </>
                                )}
                            </Button>
                        </form>

                        {/* Back to login */}
                        <div className="mt-8 text-center">
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 text-sm font-semibold text-green-600 hover:text-green-700 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to login
                            </Link>
                        </div>

                        {/* Help text */}
                        <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                            <div className="flex items-start gap-3">
                                <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-blue-900 mb-1">
                                        How password reset works
                                    </p>
                                    <ul className="text-xs text-blue-700 space-y-1">
                                        <li>• We'll send a secure link to your email</li>
                                        <li>• Link expires in 1 hour for security</li>
                                        <li>• Click the link to set a new password</li>
                                        <li>• Your account remains secure throughout</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function Feature({ icon: Icon, title, desc }) {
    return (
        <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center flex-shrink-0">
                <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
                <h3 className="font-bold text-white text-lg mb-1">{title}</h3>
                <p className="text-sm text-green-100 leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}