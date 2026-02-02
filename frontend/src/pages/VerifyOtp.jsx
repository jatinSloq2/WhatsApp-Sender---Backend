import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import { Loader, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function VerifyOTP() {
    const { verifyOTP, resendOTP } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || '';

    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);

    // Redirect if no email provided
    useEffect(() => {
        if (!email) {
            navigate('/login');
        }
    }, [email, navigate]);

    // Countdown timer for resend OTP
    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(interval);
        } else {
            setCanResend(true);
        }
    }, [timer]);

    const handleVerify = async () => {
        if (otp.length !== 6) {
            setError('Please enter a 6-digit OTP');
            return;
        }

        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await verifyOTP(email, otp);
            setSuccess('OTP verified successfully! Redirecting...');
            setTimeout(() => {
                navigate('/dashboard');
            }, 1000);
        } catch (err) {
            setError(err.message || 'OTP verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setError('');
        setSuccess('');
        setResending(true);

        try {
            await resendOTP(email);
            setSuccess('OTP resent successfully! Check your email.');
            setTimer(60);
            setCanResend(false);
            setOtp('');
        } catch (err) {
            setError('Failed to resend OTP. Please try again.');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center px-4 animate-fadeIn">
            <div className="w-full max-w-md">
                {/* Card */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                    {/* Icon */}
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                        <Mail className="w-8 h-8 text-green-600" />
                    </div>

                    <h1 className="text-xl font-bold text-gray-900 mb-1 text-center">
                        Verify your email
                    </h1>
                    <p className="text-sm text-gray-500 text-center mb-8">
                        We've sent a 6-digit code to<br />
                        <span className="font-semibold text-gray-700">{email}</span>
                    </p>

                    {/* OTP Input */}
                    <div className="flex flex-col items-center gap-6">
                        <InputOTP
                            maxLength={6}
                            value={otp}
                            onChange={(value) => {
                                setOtp(value);
                                setError('');
                            }}
                            onComplete={handleVerify}
                        >
                            <InputOTPGroup>
                                <InputOTPSlot index={0} className="w-12 h-12 text-lg" />
                                <InputOTPSlot index={1} className="w-12 h-12 text-lg" />
                                <InputOTPSlot index={2} className="w-12 h-12 text-lg" />
                                <InputOTPSlot index={3} className="w-12 h-12 text-lg" />
                                <InputOTPSlot index={4} className="w-12 h-12 text-lg" />
                                <InputOTPSlot index={5} className="w-12 h-12 text-lg" />
                            </InputOTPGroup>
                        </InputOTP>

                        {/* Error Alert */}
                        {error && (
                            <Alert variant="destructive" className="w-full">
                                <AlertDescription className="text-sm">
                                    {error}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Success Alert */}
                        {success && (
                            <Alert className="w-full border-green-200 bg-green-50">
                                <AlertDescription className="text-sm text-green-700">
                                    {success}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Verify Button */}
                        <Button
                            onClick={handleVerify}
                            disabled={loading || otp.length !== 6}
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                            {loading ? (
                                <>
                                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                'Verify OTP'
                            )}
                        </Button>

                        {/* Resend OTP */}
                        <div className="text-center">
                            <p className="text-sm text-gray-500 mb-2">
                                Didn't receive the code?
                            </p>
                            {canResend ? (
                                <Button
                                    variant="link"
                                    onClick={handleResend}
                                    disabled={resending}
                                    className="text-green-600 hover:text-green-700 font-semibold"
                                >
                                    {resending ? (
                                        <>
                                            <Loader className="mr-2 h-3 w-3 animate-spin" />
                                            Resending...
                                        </>
                                    ) : (
                                        'Resend OTP'
                                    )}
                                </Button>
                            ) : (
                                <p className="text-sm text-gray-400">
                                    Resend in {timer}s
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Footer link */}
                    <p className="text-xs text-gray-500 text-center mt-8">
                        Wrong email?{' '}
                        <Link to="/login" className="text-green-600 font-semibold hover:underline">
                            Go back to login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}