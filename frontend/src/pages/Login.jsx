import { CheckCircle2, Loader2, Lock, Mail, MessageSquare, Send, ShieldCheck, Zap } from "lucide-react";
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

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/verify-otp", { state: { email } });
    } catch (err) {
      setError(err.message || "Login failed");
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
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-sm font-semibold">Trusted by 5,000+ businesses</span>
            </div>
          </div>

          <h1 className="text-5xl font-black leading-tight mb-6">
            Welcome Back to
            <br />
            BulkSend
          </h1>
          <p className="text-green-100 text-lg max-w-md mb-12 leading-relaxed">
            Sign in to access your campaigns, chatbots, and analytics dashboard.
            Manage all your WhatsApp messaging from one powerful platform.
          </p>

          {/* Feature highlights */}
          <div className="space-y-6">
            <Feature
              icon={Send}
              title="Bulk Campaigns"
              desc="Send thousands of messages instantly with high delivery rates"
            />
            <Feature
              icon={MessageSquare}
              title="AI Chatbots"
              desc="Automate conversations and handle support 24/7"
            />
            <Feature
              icon={Zap}
              title="Real-time Analytics"
              desc="Track delivery, opens, and engagement metrics live"
            />
            <Feature
              icon={ShieldCheck}
              title="Secure Authentication"
              desc="OTP-based login with enterprise-grade security"
            />
          </div>

          {/* Trust badges */}
          <div className="mt-12 pt-8 border-t border-white/20">
            <div className="flex flex-wrap items-center gap-6 text-sm font-semibold">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> SSL Encrypted
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> 99.9% Uptime
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> 24/7 Support
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ RIGHT LOGIN FORM ═══ */}
      <div className="flex items-center justify-center px-6 py-12 bg-gray-50">
        <Card className="w-full max-w-md rounded-2xl shadow-xl border-2 border-gray-300">
          <CardHeader className="text-center space-y-2 pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-100 to-teal-100 rounded-2xl border-2 border-green-300 flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-3xl font-black text-black">Welcome Back</CardTitle>
            <CardDescription className="text-base text-gray-600">
              Sign in to your BulkSend account
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

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-bold text-black">
                    Password
                  </Label>
                  <Link
                    to="/forgot-password"
                    className="text-sm font-semibold text-green-600 hover:text-green-700 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                    Signing in...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <Separator className="my-8" />

            {/* Sign up link */}
            <p className="text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="font-bold text-green-600 hover:text-green-700 transition-colors"
              >
                Create one now
              </Link>
            </p>

            {/* Security notice */}
            <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-blue-900 mb-1">
                    Secure Login with OTP
                  </p>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    After entering your credentials, you'll receive a one-time password
                    via email for additional security.
                  </p>
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