import { Loader2, Lock, Mail, MessageSquare, Send, ShieldCheck, User, Zap } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// shadcn/ui
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function Signup() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters long");
            return;
        }

        setLoading(true);
        try {
            await register(name, email, password);
            navigate("/verify-otp", { state: { email } });
        } catch (err) {
            setError(err.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] grid lg:grid-cols-2">
            {/* ═══ LEFT BRANDING PANEL ═══ */}
            <div className="hidden lg:flex flex-col justify-center px-16 bg-gradient-to-br from-green-600 to-teal-600 text-white relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

                <div className="relative z-10">
                    <div className="mb-8">
                        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                            <Zap className="w-4 h-4" />
                            <span className="text-sm font-semibold">Join 5,000+ businesses</span>
                        </div>
                    </div>

                    <h1 className="text-5xl font-black leading-tight mb-6">
                        Start Messaging
                        <br />
                        at Scale Today
                    </h1>
                    <p className="text-green-100 text-lg max-w-md mb-12 leading-relaxed">
                        Create your free account and launch bulk WhatsApp campaigns or AI chatbots in minutes.
                        No credit card required.
                    </p>

                    {/* Feature highlights */}
                    <div className="space-y-6">
                        <Feature
                            icon={Send}
                            title="Instant Setup"
                            desc="Create account and start sending in under 5 minutes"
                        />
                        <Feature
                            icon={Zap}
                            title="50 Free Credits"
                            desc="Test the platform with 50 complimentary credits"
                        />
                        <Feature
                            icon={MessageSquare}
                            title="AI Chatbots Included"
                            desc="Build automated conversation flows with ease"
                        />
                        <Feature
                            icon={ShieldCheck}
                            title="Enterprise Security"
                            desc="Bank-level encryption and OTP authentication"
                        />
                    </div>

                    {/* Trust section */}
                    <div className="mt-12 pt-8 border-t border-white/20">
                        <p className="text-green-100 text-sm font-semibold mb-4">Trusted by companies like:</p>
                        <div className="flex flex-wrap gap-4">
                            <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-sm font-bold">
                                TechCorp
                            </div>
                            <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-sm font-bold">
                                E-Shop
                            </div>
                            <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-sm font-bold">
                                StartupHub
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ RIGHT SIGNUP FORM ═══ */}
            <div className="flex items-center justify-center px-6 py-12 bg-gray-50">
                <Card className="w-full max-w-md rounded-2xl shadow-xl border-2 border-gray-300">
                    <CardHeader className="text-center space-y-2 pb-6">
                        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-100 to-teal-100 rounded-2xl border-2 border-green-300 flex items-center justify-center mb-4">
                            <Zap className="w-8 h-8 text-green-600" />
                        </div>
                        <CardTitle className="text-3xl font-black text-black">Create Account</CardTitle>
                        <CardDescription className="text-base text-gray-600">
                            Start sending bulk campaigns for free
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Name Input */}
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-bold text-black">
                                    Full Name
                                </Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="Jatin Mehta"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className="pl-11 py-3 border-2 border-gray-300 rounded-xl focus:border-green-600 focus:ring-2 focus:ring-green-200 transition-all"
                                    />
                                </div>
                            </div>

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

                            {/* Password Input */}
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-bold text-black">
                                    Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Minimum 8 characters"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        minLength={8}
                                        required
                                        className="pl-11 py-3 border-2 border-gray-300 rounded-xl focus:border-green-600 focus:ring-2 focus:ring-green-200 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Confirm Password Input */}
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-sm font-bold text-black">
                                    Confirm Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="Re-enter your password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
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

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-md transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Creating account...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-5 h-5 mr-2" />
                                        Create Free Account
                                    </>
                                )}
                            </Button>

                            {/* Terms notice */}
                            <p className="text-xs text-center text-gray-600 leading-relaxed">
                                By creating an account, you agree to our{" "}
                                <a href="#" className="text-green-600 hover:text-green-700 font-semibold">
                                    Terms of Service
                                </a>{" "}
                                and{" "}
                                <a href="#" className="text-green-600 hover:text-green-700 font-semibold">
                                    Privacy Policy
                                </a>
                            </p>
                        </form>

                        {/* Divider */}
                        <Separator className="my-8" />

                        {/* Sign in link */}
                        <p className="text-center text-sm text-gray-600">
                            Already have an account?{" "}
                            <Link
                                to="/login"
                                className="font-bold text-green-600 hover:text-green-700 transition-colors"
                            >
                                Sign in instead
                            </Link>
                        </p>
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