import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Loader2, Mail, Shield, CheckCircle2, Clock, ArrowLeft, MessageSquare } from "lucide-react";
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
      setSuccess("Verification successful! Redirecting...");
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
            Secure email verification
          </h1>

          <p className="text-white/90 text-lg mb-12 leading-relaxed">
            We use email-based OTP to ensure only authorized users can access your WhatsApp campaigns and customer data.
          </p>

          <div className="space-y-4">
            <Feature
              icon={Shield}
              title="Two-Factor Security"
              desc="OTP verification adds an extra layer of protection to your account"
            />
            <Feature
              icon={CheckCircle2}
              title="Quick & Easy"
              desc="Receive your code instantly and verify in seconds"
            />
            <Feature
              icon={Clock}
              title="Time-Limited"
              desc="Each code expires after 10 minutes for enhanced security"
            />
          </div>

          <div className="mt-12 pt-8 border-t border-white/20">
            <p className="text-white/90 text-sm">
              <strong>Having trouble?</strong> Check your spam folder or contact support if you don't receive the code.
            </p>
          </div>
        </div>
      </div>

      {/* ═══ RIGHT VERIFICATION FORM ═══ */}
      <div className="flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="bg-white border border-gray-200 shadow-sm p-8">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
              <div className="w-10 h-10 bg-[#25D366] rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-xl font-bold">WhatsBot</span>
            </div>

            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Verify your email
            </h2>
            <p className="text-sm text-gray-600 text-center mb-8">
              We've sent a 6-digit code to<br />
              <span className="font-semibold text-gray-900">{email}</span>
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
                <InputOTPGroup className="gap-2">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot
                      key={i}
                      index={i}
                      className="w-12 h-12 text-xl font-semibold border-gray-300 focus:border-[#25D366] focus:ring-[#25D366]"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>

              {/* Error Alert */}
              {error && (
                <Alert className="w-full bg-red-50 border-red-200">
                  <AlertDescription className="text-sm text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Success Alert */}
              {success && (
                <Alert className="w-full bg-green-50 border-green-200">
                  <AlertDescription className="text-sm text-green-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              {/* Verify Button */}
              <Button
                onClick={handleVerify}
                disabled={loading || otp.length !== 6}
                className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-medium h-11 shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Continue"
                )}
              </Button>

              {/* Resend Section */}
              <div className="text-center">
                {canResend ? (
                  <Button
                    variant="link"
                    onClick={handleResend}
                    disabled={resending}
                    className="text-[#25D366] font-medium hover:text-[#20BD5A] p-0 h-auto"
                  >
                    {resending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Resend code"
                    )}
                  </Button>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <p className="text-sm">
                      Resend available in <span className="font-semibold text-gray-900">{timer}s</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Back to login */}
            <div className="text-center pt-6 border-t border-gray-200">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#25D366] hover:text-[#20BD5A]"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </Link>
            </div>

            {/* Help section */}
            <div className="mt-6 p-3 bg-amber-50 border border-amber-100 rounded-lg">
              <p className="text-xs font-medium text-amber-900 mb-1">
                Didn't receive the code?
              </p>
              <ul className="text-xs text-amber-700 space-y-0.5">
                <li>• Check your spam or junk folder</li>
                <li>• Ensure your email address is correct</li>
                <li>• Wait for the timer and request a new code</li>
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