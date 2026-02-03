import { KeyRound, Loader2, Mail, MessageSquare, Send, ShieldCheck, Zap } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

// shadcn/ui
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

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
            {/* Left branding */}
            <div className="hidden lg:flex flex-col justify-center px-16 bg-gradient-to-br from-green-600 to-green-700 text-white">
                <h1 className="text-4xl font-bold leading-tight">
                    Secure Account Recovery
                </h1>
                <p className="mt-4 text-green-100 max-w-md">
                    Forgot your password? We’ll help you regain access securely in seconds.
                </p>

                <div className="mt-10 space-y-5">
                    <Feature icon={Send} title="Bulk Messaging" desc="Run campaigns at scale." />
                    <Feature icon={MessageSquare} title="AI Chatbots" desc="Automate conversations." />
                    <Feature icon={Zap} title="Fast Recovery" desc="Instant reset links." />
                    <Feature icon={ShieldCheck} title="Secure by Design" desc="OTP & encrypted flows." />
                </div>
            </div>

            {/* Right form */}
            <div className="flex items-center justify-center px-4 bg-slate-50">
                <Card className="w-full max-w-sm rounded-2xl shadow-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                            <KeyRound className="h-6 w-6 text-green-600" />
                        </div>
                        <CardTitle className="text-xl">Forgot your password?</CardTitle>
                        <CardDescription>
                            We’ll email you a secure reset link
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
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

                            {/* Error */}
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription className="text-xs">
                                        {error}
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Success */}
                            {success && (
                                <Alert className="border-green-200 bg-green-50">
                                    <AlertDescription className="text-xs text-green-700">
                                        {success}
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Submit */}
                            <Button
                                type="submit"
                                className="w-full bg-green-600 hover:bg-green-700"
                                disabled={loading}
                            >
                                {loading && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {loading ? "Sending link…" : "Send reset link"}
                            </Button>
                        </form>

                        <Separator className="my-6" />

                        <p className="text-center text-xs text-muted-foreground">
                            Remember your password?{" "}
                            <Link
                                to="/login"
                                className="font-medium text-green-600 hover:underline"
                            >
                                Back to login
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
