import { Loader2, Lock, Mail, User, MessageSquare, Send, Zap, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
            {/* Left branding */}
            <div className="hidden lg:flex flex-col justify-center px-16 bg-gradient-to-br from-green-600 to-green-700 text-white">
                <h1 className="text-4xl font-bold leading-tight">
                    Start Messaging at Scale
                </h1>
                <p className="mt-4 text-green-100 max-w-md">
                    Create your account and launch bulk campaigns or AI chatbots in minutes.
                </p>

                <div className="mt-10 space-y-5">
                    <Feature icon={Send} title="Bulk Campaigns" desc="Reach thousands of users with one click." />
                    <Feature icon={MessageSquare} title="AI Chatbots" desc="Automate conversations and support." />
                    <Feature icon={Zap} title="Instant Setup" desc="No complex configuration required." />
                    <Feature icon={ShieldCheck} title="Secure & Reliable" desc="OTP verification and encrypted data." />
                </div>
            </div>

            {/* Right signup */}
            <div className="flex items-center justify-center px-4 bg-slate-50">
                <Card className="w-full max-w-sm rounded-2xl shadow-md">
                    <CardHeader className="text-center">
                        <CardTitle className="text-xl">Create your account</CardTitle>
                        <CardDescription>Start sending bulk campaigns for free</CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Name */}
                            <div className="space-y-1.5">
                                <Label htmlFor="name">Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="Jatin Mehta"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-1.5">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Minimum 8 characters"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        minLength={8}
                                        required
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-1.5">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="Re-enter password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription className="text-xs">{error}</AlertDescription>
                                </Alert>
                            )}

                            {/* Submit */}
                            <Button
                                type="submit"
                                className="w-full bg-green-600 hover:bg-green-700"
                                disabled={loading}
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {loading ? "Creating account…" : "Create Account"}
                            </Button>
                        </form>

                        <Separator className="my-6" />

                        <p className="text-center text-xs text-muted-foreground">
                            Already have an account?{" "}
                            <Link to="/login" className="font-medium text-green-600 hover:underline">
                                Sign in
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
        <div className="flex gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-green-100">{desc}</p>
            </div>
        </div>
    );
}