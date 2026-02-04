import { CheckCircle2, Loader2, Lock, Mail, MessageSquare, Shield, Zap } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// shadcn/ui
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
            Welcome back to your
            <br />messaging dashboard
          </h1>
          
          <p className="text-white/90 text-lg mb-12 leading-relaxed">
            Sign in to manage your WhatsApp campaigns, chatbots, and customer conversations.
          </p>

          {/* Features */}
          <div className="space-y-4">
            <Feature
              icon={MessageSquare}
              title="Bulk Messaging"
              desc="Send messages to thousands of contacts instantly"
            />
            <Feature
              icon={Zap}
              title="AI Chatbots"
              desc="Automate responses with intelligent conversation flows"
            />
            <Feature
              icon={Shield}
              title="Secure & Reliable"
              desc="Enterprise-grade security with 99.9% uptime"
            />
          </div>

          {/* Trust indicators */}
          <div className="mt-12 pt-8 border-t border-white/20">
            <div className="flex items-center gap-6 text-sm font-medium">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> OTP Protected
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> SSL Encrypted
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ RIGHT LOGIN FORM ═══ */}
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

            <CardTitle className="text-2xl font-bold text-gray-900">Sign in to your account</CardTitle>
            <CardDescription className="text-gray-600">
              Enter your credentials to access your dashboard
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

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-900">
                    Password
                  </Label>
                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-[#25D366] hover:text-[#20BD5A]"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            {/* Sign up link */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="font-medium text-[#25D366] hover:text-[#20BD5A]"
                >
                  Create one now
                </Link>
              </p>
            </div>

            {/* Security notice */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-blue-900 mb-0.5">
                    Secure Login
                  </p>
                  <p className="text-xs text-blue-700">
                    You'll receive a one-time password via email for additional security.
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