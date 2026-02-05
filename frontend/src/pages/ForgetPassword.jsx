import { ArrowLeft, CheckCircle2, KeyRound, Loader2, Mail, MessageSquare, Shield } from "lucide-react";
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
            {/* ═══ LEFT PANEL ═══ */}
            <div className="hidden lg:flex flex-col justify-center px-16 bg-[#25D366] text-white relative">
                <div className="max-w-md">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                            <MessageSquare className="w-7 h-7 text-[#25D366]" strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold tracking-tight">WhatsBot</span>
                            <span className="text-xs text-white/80 font-medium">WhatsApp Business Platform</span>
                        </div>
                    </div>

                    <h1 className="text-4xl font-bold mb-4 leading-tight">
                        Reset your password
                    </h1>
                    
                    <p className="text-white/90 text-lg mb-12 leading-relaxed">
                        Enter your email address and we'll send you a secure link to reset your password.
                    </p>

                    <div className="space-y-4">
                        <Feature
                            icon={Mail}
                            title="Instant Reset Link"
                            desc="Receive a secure password reset link via email immediately"
                        />
                        <Feature
                            icon={Shield}
                            title="Secure Process"
                            desc="Your reset link is encrypted and expires after 1 hour"
                        />
                        <Feature
                            icon={CheckCircle2}
                            title="Quick Recovery"
                            desc="Regain access to your account in just a few minutes"
                        />
                    </div>

                    <div className="mt-12 pt-8 border-t border-white/20">
                        <p className="text-white/90 text-sm">
                            <strong>Security tip:</strong> Never share your password reset link with anyone.
                        </p>
                    </div>
                </div>
            </div>

            {/* ═══ RIGHT FORM ═══ */}
            <div className="flex items-center justify-center px-6 py-12 bg-gray-50">
                <Card className="w-full max-w-md bg-white shadow-sm border border-gray-200">
                    <CardHeader className="text-center pb-6">
                        {/* Mobile Logo */}
                        <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
                            <div className="w-10 h-10 bg-[#25D366] rounded-xl flex items-center justify-center">
                                <MessageSquare className="w-6 h-6 text-white" strokeWidth={2.5} />
                            </div>
                            <span className="text-xl font-bold">WhatsBot</span>
                        </div>

                        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-4">
                            <KeyRound className="w-8 h-8 text-amber-600" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-900">Reset your password</CardTitle>
                        <CardDescription className="text-gray-600">
                            Enter your email to receive a reset link
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Email Input */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium text-gray-900">
                                    Email Address
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="pl-10 h-11 border-gray-300 focus:border-[#25D366] focus:ring-[#25D366]"
                                    />
                                </div>
                            </div>

                            {/* Error Alert */}
                            {error && (
                                <Alert className="bg-red-50 border-red-200">
                                    <AlertDescription className="text-sm text-red-800">
                                        {error}
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Success Alert */}
                            {success && (
                                <Alert className="bg-green-50 border-green-200">
                                    <AlertDescription className="text-sm text-green-800">
                                        {success}
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-medium h-11 shadow-sm"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Sending link...
                                    </>
                                ) : (
                                    "Send Reset Link"
                                )}
                            </Button>
                        </form>

                        {/* Back to login */}
                        <div className="mt-6 text-center pt-6 border-t border-gray-200">
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 text-sm font-medium text-[#25D366] hover:text-[#20BD5A]"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to login
                            </Link>
                        </div>

                        {/* Help text */}
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                            <div className="flex items-start gap-2">
                                <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-medium text-blue-900 mb-1">
                                        How it works
                                    </p>
                                    <ul className="text-xs text-blue-700 space-y-0.5">
                                        <li>• We'll send a secure link to your email</li>
                                        <li>• Link expires in 1 hour for security</li>
                                        <li>• Click the link to set a new password</li>
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
        <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
                <h3 className="font-semibold text-white mb-0.5">{title}</h3>
                <p className="text-sm text-white/80">{desc}</p>
            </div>
        </div>
    );
}