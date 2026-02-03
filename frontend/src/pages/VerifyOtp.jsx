import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Loader2, Mail, ShieldCheck } from "lucide-react";
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
      setError("Please enter the 6-digit code");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await verifyOTP(email, otp);
      setSuccess("Verification successful. Redirecting…");
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (err) {
      setError(err.message || "Invalid or expired OTP");
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
      setError("Failed to resend OTP. Try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] grid grid-cols-1 lg:grid-cols-2">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex flex-col justify-center px-14 bg-gradient-to-br from-green-600 to-green-700 text-white">
        <div className="max-w-md space-y-6">
          <ShieldCheck className="w-12 h-12 text-white/90" />
          <h1 className="text-3xl font-bold leading-tight">
            Secure verification
            <br />
            to protect your account
          </h1>
          <p className="text-green-100 text-sm leading-relaxed">
            We use email-based OTP verification to ensure only authorized users
            can access your BulkSend dashboard, campaigns, and chatbot tools.
          </p>

          <ul className="space-y-3 text-sm text-green-100">
            <li>• Prevents unauthorized access</li>
            <li>• Required for bulk messaging compliance</li>
            <li>• Industry-standard authentication flow</li>
          </ul>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border shadow-sm p-8">
            {/* Icon */}
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <Mail className="w-7 h-7 text-green-600" />
            </div>

            <h2 className="text-xl font-semibold text-center">
              Verify your email
            </h2>
            <p className="text-sm text-muted-foreground text-center mt-1 mb-8">
              Enter the 6-digit code sent to
              <br />
              <span className="font-medium text-foreground">{email}</span>
            </p>

            {/* OTP */}
            <div className="flex flex-col items-center gap-6">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(val) => {
                  setOtp(val);
                  setError("");
                }}
                onComplete={handleVerify}
              >
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot
                      key={i}
                      index={i}
                      className="w-12 h-12 text-lg rounded-lg"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>

              {error && (
                <Alert variant="destructive" className="w-full">
                  <AlertDescription className="text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="w-full border-green-200 bg-green-50">
                  <AlertDescription className="text-sm text-green-700">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleVerify}
                disabled={loading || otp.length !== 6}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Verify & Continue
              </Button>

              {/* Resend */}
              <div className="text-center text-sm">
                {canResend ? (
                  <Button
                    variant="link"
                    onClick={handleResend}
                    disabled={resending}
                    className="text-green-600 font-semibold"
                  >
                    {resending && (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    )}
                    Resend OTP
                  </Button>
                ) : (
                  <p className="text-muted-foreground">
                    Resend available in {timer}s
                  </p>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-8">
              Wrong email?{" "}
              <Link
                to="/login"
                className="text-green-600 font-medium hover:underline"
              >
                Go back to login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
