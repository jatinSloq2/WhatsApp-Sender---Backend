import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Loader2, Mail, ShieldCheck, CheckCircle2, Clock, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function VerifyOTP() {
  const { verifyOTP, resendOTP } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (!email) navigate("/login");
  }, [email, navigate]);

  useEffect(() => {
    if (timer > 0) {
      const t = setInterval(() => setTimer((v) => v - 1), 1000);
      return () => clearInterval(t);
    }
    setCanResend(true);
  }, [timer]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await verifyOTP(email, otp);
      setSuccess("Verification successful! Redirecting to dashboard...");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      setError(err.message || "Invalid or expired OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    setSuccess("");

    try {
      await resendOTP(email);
      setSuccess("A new OTP has been sent to your email.");
      setTimer(60);
      setCanResend(false);
      setOtp("");
    } catch {
      setError("Failed to resend OTP. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] grid grid-cols-1 lg:grid-cols-2">
      {/* ═══ LEFT BRANDING PANEL ═══ */}
      <div className="hidden lg:flex flex-col justify-center px-16 bg-gradient-to-br from-green-600 to-teal-600 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-sm font-semibold">Two-factor authentication</span>
            </div>
          </div>

          <h1 className="text-5xl font-black leading-tight mb-6">
            Secure Email
            <br />
            Verification
          </h1>
          <p className="text-green-100 text-lg max-w-md mb-12 leading-relaxed">
            We use email-based OTP to ensure only authorized users can access
            your campaigns, analytics, and sensitive business data.
          </p>

          <div className="space-y-6">
            <Feature
              icon={ShieldCheck}
              title="Enhanced Security"
              desc="Two-factor authentication prevents unauthorized access"
            />
            <Feature
              icon={CheckCircle2}
              title="Compliance Ready"
              desc="Required for bulk messaging and WhatsApp Business API compliance"
            />
            <Feature
              icon={Clock}
              title="Quick Verification"
              desc="Receive your code instantly and verify in seconds"
            />
          </div>

          <div className="mt-12 pt-8 border-t border-white/20">
            <p className="text-green-100 text-sm">
              <strong>Need help?</strong> Check your spam folder or contact support if you don't receive the code.
            </p>
          </div>
        </div>
      </div>

      {/* ═══ RIGHT VERIFICATION FORM ═══ */}
      <div className="flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border-2 border-gray-300 shadow-xl p-10">
            {/* Icon */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 border-2 border-blue-300 flex items-center justify-center mx-auto mb-8">
              <Mail className="w-10 h-10 text-blue-600" />
            </div>

            <h2 className="text-3xl font-black text-black text-center mb-3">
              Verify Your Email
            </h2>
            <p className="text-sm text-gray-600 text-center mb-8">
              We've sent a 6-digit code to
              <br />
              <span className="font-bold text-black">{email}</span>
            </p>

            {/* OTP Input */}
            <div className="flex flex-col items-center gap-6 mb-6">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(val) => {
                  setOtp(val);
                  setError("");
                }}
                onComplete={handleVerify}
              >
                <InputOTPGroup className="gap-3">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot
                      key={i}
                      index={i}
                      className="w-14 h-14 text-2xl font-black rounded-xl border-2 border-gray-300 focus:border-green-600 focus:ring-2 focus:ring-green-200 transition-all"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>

              {/* Error Alert */}
              {error && (
                <Alert className="w-full bg-red-50 border-2 border-red-300 rounded-xl">
                  <AlertDescription className="text-sm font-medium text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Success Alert */}
              {success && (
                <Alert className="w-full bg-green-50 border-2 border-green-300 rounded-xl">
                  <AlertDescription className="text-sm font-medium text-green-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              {/* Verify Button */}
              <Button
                onClick={handleVerify}
                disabled={loading || otp.length !== 6}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-md transition-all hover:shadow-lg disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 mr-2" />
                    Verify & Continue
                  </>
                )}
              </Button>

              {/* Resend Section */}
              <div className="text-center">
                {canResend ? (
                  <Button
                    variant="link"
                    onClick={handleResend}
                    disabled={resending}
                    className="text-green-600 font-bold hover:text-green-700 p-0 h-auto"
                  >
                    {resending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Resend OTP"
                    )}
                  </Button>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <p className="text-sm font-medium">
                      Resend available in <span className="font-bold text-black">{timer}s</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Back to login */}
            <div className="text-center mt-8 pt-6 border-t border-gray-200">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-green-600 hover:text-green-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </Link>
            </div>

            {/* Help section */}
            <div className="mt-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
              <p className="text-xs font-bold text-amber-900 mb-2">
                Didn't receive the code?
              </p>
              <ul className="text-xs text-amber-700 space-y-1">
                <li>• Check your spam or junk folder</li>
                <li>• Ensure {email} is correct</li>
                <li>• Wait for the timer and request a new code</li>
                <li>• Contact support if issues persist</li>
              </ul>
            </div>
          </div>
        </div>
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