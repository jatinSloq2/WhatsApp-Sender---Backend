import { CheckCircle2, Loader2, Lock, Mail, MessageSquare, Shield, User, Zap } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// shadcn/ui
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
                        Start messaging at scale today
                    </h1>
                    
                    <p className="text-white/90 text-lg mb-12 leading-relaxed">
                        Join thousands of businesses using WhatsBot to automate customer conversations and send bulk messages.
                    </p>

                    {/* Features */}
                    <div className="space-y-4">
                        <Feature
                            icon={Zap}
                            title="Quick Setup"
                            desc="Get started in under 5 minutes with our simple onboarding"
                        />
                        <Feature
                            icon={MessageSquare}
                            title="50 Free Credits"
                            desc="Test all features with complimentary credits on signup"
                        />
                        <Feature
                            icon={Shield}
                            title="Enterprise Security"
                            desc="Bank-level encryption and OTP authentication included"
                        />
                    </div>

                    {/* Stats */}
                    <div className="mt-12 pt-8 border-t border-white/20">
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <div className="text-2xl font-bold">5,000+</div>
                                <div className="text-xs text-white/80">Active Users</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">10M+</div>
                                <div className="text-xs text-white/80">Messages Sent</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">99.9%</div>
                                <div className="text-xs text-white/80">Uptime</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ RIGHT SIGNUP FORM ═══ */}
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

                        <CardTitle className="text-2xl font-bold text-gray-900">Create your account</CardTitle>
                        <CardDescription className="text-gray-600">
                            Start automating your WhatsApp messaging for free
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Name Input */}
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-medium text-gray-900">
                                    Full Name
                                </Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="Your full name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className="pl-10 h-11 border-gray-300 focus:border-[#25D366] focus:ring-[#25D366]"
                                    />
                                </div>
                            </div>

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

                            {/* Password Input */}
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium text-gray-900">
                                    Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Minimum 8 characters"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        minLength={8}
                                        required
                                        className="pl-10 h-11 border-gray-300 focus:border-[#25D366] focus:ring-[#25D366]"
                                    />
                                </div>
                            </div>

                            {/* Confirm Password Input */}
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-900">
                                    Confirm Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="Re-enter your password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
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

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-medium h-11 shadow-sm"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Creating account...
                                    </>
                                ) : (
                                    "Create Account"
                                )}
                            </Button>

                            {/* Terms notice */}
                            <p className="text-xs text-center text-gray-500">
                                By creating an account, you agree to our{" "}
                                <a href="#" className="text-[#25D366] hover:text-[#20BD5A] font-medium">
                                    Terms of Service
                                </a>{" "}
                                and{" "}
                                <a href="#" className="text-[#25D366] hover:text-[#20BD5A] font-medium">
                                    Privacy Policy
                                </a>
                            </p>
                        </form>

                        {/* Sign in link */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <p className="text-center text-sm text-gray-600">
                                Already have an account?{" "}
                                <Link
                                    to="/login"
                                    className="font-medium text-[#25D366] hover:text-[#20BD5A]"
                                >
                                    Sign in
                                </Link>
                            </p>
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