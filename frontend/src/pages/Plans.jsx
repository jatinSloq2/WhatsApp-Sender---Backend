import { BarChart, Check, Code, Copy, CreditCard, Loader2, Shield, Sparkles, TrendingUp, X, Zap, AlertCircle, QrCode, CheckCircle2, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePlans } from '../context/PlanContext';

// Feature icons mapping
const featureIcons = {
  analyticsAccess: BarChart,
  prioritySupport: Shield,
  customTemplates: Sparkles,
  apiAccess: Code,
};

const featureLabels = {
  analyticsAccess: 'Advanced Analytics',
  prioritySupport: 'Priority Support',
  customTemplates: 'Custom Templates',
  apiAccess: 'API Access',
};

// Improved PaymentModal with better error handling

function PaymentModal({ plan, onClose, onSubmitProof }) {
  const [upiId] = useState('7240440461@ybl');
  const [copied, setCopied] = useState(false);
  const [paymentProof, setPaymentProof] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Calculate total with GST
  const baseAmount = plan.price;
  const gstRate = 0.18;
  const gstAmount = Math.round(baseAmount * gstRate);
  const totalAmount = baseAmount + gstAmount;

  const upiLink = `upi://pay?pa=${upiId}&pn=YourBusinessName&am=${totalAmount}&cu=INR&tn=Payment for ${plan.name} Plan`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiLink)}`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('File size must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please upload an image file');
        return;
      }

      setPaymentProof(file);
      setPreviewUrl(URL.createObjectURL(file));
      setErrorMessage('');
    }
  };

  const handleSubmit = async () => {
    // Clear previous errors
    setErrorMessage('');

    // Validation
    if (!paymentProof) {
      setErrorMessage('Please upload payment screenshot');
      return;
    }

    if (!transactionId.trim()) {
      setErrorMessage('Please enter transaction ID');
      return;
    }

    // Validate transaction ID format (typically 12 digits)
    if (transactionId.trim().length < 10) {
      setErrorMessage('Transaction ID seems too short. Please verify.');
      return;
    }

    setSubmitting(true);

    try {
      console.log('Submitting payment proof with data:', {
        planId: plan._id,
        planName: plan.name,
        billingCycle: plan.billingCycle,
        amount: totalAmount,
        transactionId: transactionId.trim(),
        fileName: paymentProof.name,
        fileSize: paymentProof.size,
        fileType: paymentProof.type
      });

      // Call the parent handler
      await onSubmitProof({
        planId: plan._id,
        billingCycle: plan.billingCycle,
        amount: totalAmount,
        transactionId: transactionId.trim(),
        paymentProof,
      });

      console.log('Payment proof submitted successfully');

    } catch (error) {
      console.error('Payment proof submission error:', error);

      // Set a more descriptive error message
      if (error.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else if (error.message) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Failed to submit payment proof. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black mb-1">Complete Payment</h2>
              <p className="text-emerald-100 text-sm font-medium">
                {plan.name} Plan - {plan.billingCycle === 'MONTHLY' ? 'Monthly' : 'Yearly'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-900 mb-1">Error</p>
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Amount Breakdown */}
          <div className="bg-slate-50 rounded-2xl p-6 mb-6 border-2 border-slate-200">
            <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
              <CreditCard size={20} className="text-emerald-600" />
              Payment Breakdown
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Base Amount:</span>
                <span className="font-bold text-slate-900">₹{baseAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">GST (18%):</span>
                <span className="font-bold text-slate-900">₹{gstAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="h-px bg-slate-300 my-3"></div>
              <div className="flex justify-between text-lg">
                <span className="text-slate-900 font-black">Total Amount:</span>
                <span className="font-black text-emerald-600">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 mb-6 border-2 border-purple-200 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <QrCode size={32} className="text-white" />
            </div>
            <h3 className="font-black text-slate-900 mb-2">Scan QR Code to Pay</h3>
            <p className="text-slate-600 text-sm mb-4 font-medium">
              Open any UPI app and scan this code
            </p>

            <div className="bg-white rounded-2xl p-6 inline-block shadow-lg mb-4">
              <img
                src={qrCodeUrl}
                alt="Payment QR Code"
                className="w-64 h-64"
              />
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Works with Google Pay, PhonePe, Paytm, BHIM & all UPI apps
            </p>
          </div>

          {/* UPI ID Section */}
          <div className="bg-blue-50 rounded-2xl p-6 mb-6 border-2 border-blue-200">
            <h3 className="font-black text-slate-900 mb-3">Or Pay Using UPI ID</h3>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={upiId}
                readOnly
                className="flex-1 px-4 py-3 bg-white border-2 border-blue-300 rounded-xl font-mono font-bold text-slate-900"
              />
              <button
                onClick={() => copyToClipboard(upiId)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2 shadow-lg"
              >
                {copied ? (
                  <>
                    <CheckCircle2 size={18} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    Copy
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-600 mt-3 font-medium">
              Amount to pay: <span className="font-black text-emerald-600">₹{totalAmount.toLocaleString('en-IN')}</span>
            </p>
          </div>

          {/* Payment Proof Upload */}
          <div className="bg-amber-50 rounded-2xl p-6 border-2 border-amber-200">
            <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
              <Upload size={20} className="text-amber-600" />
              Upload Payment Proof
            </h3>

            {/* Transaction ID */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Transaction ID / UTR Number *
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => {
                  setTransactionId(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="Enter 12-digit transaction ID"
                className="w-full px-4 py-3 bg-white border-2 border-amber-300 rounded-xl font-medium focus:border-amber-500 focus:outline-none"
              />
              <p className="text-xs text-slate-600 mt-1 font-medium">
                Find this in your payment app after completing the transaction
              </p>
            </div>

            {/* File Upload */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Payment Screenshot *
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="payment-proof"
                />
                <label
                  htmlFor="payment-proof"
                  className="w-full px-4 py-3 bg-white border-2 border-dashed border-amber-300 rounded-xl font-medium hover:border-amber-500 cursor-pointer flex items-center justify-center gap-2 transition-colors"
                >
                  <Upload size={18} />
                  {paymentProof ? paymentProof.name : 'Choose screenshot (max 5MB)'}
                </label>
              </div>
            </div>

            {/* Preview */}
            {previewUrl && (
              <div className="mb-4">
                <label className="block text-sm font-bold text-slate-900 mb-2">Preview:</label>
                <img
                  src={previewUrl}
                  alt="Payment proof preview"
                  className="w-full max-w-sm rounded-xl border-2 border-amber-300"
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={submitting || !paymentProof || !transactionId.trim()}
              className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 size={20} />
                  Submit for Verification
                </>
              )}
            </button>

            <p className="text-xs text-slate-600 mt-3 text-center font-medium">
              Your payment will be verified within 24 hours. You'll receive a confirmation email once approved.
            </p>
          </div>

          {/* Instructions */}
          <div className="mt-6 bg-slate-50 rounded-2xl p-6 border-2 border-slate-200">
            <h4 className="font-black text-slate-900 mb-3 text-sm">Payment Instructions:</h4>
            <ol className="space-y-2 text-xs text-slate-600 font-medium">
              <li className="flex items-start gap-2">
                <span className="font-black text-emerald-600 flex-shrink-0">1.</span>
                <span>Scan the QR code or copy the UPI ID</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-black text-emerald-600 flex-shrink-0">2.</span>
                <span>Pay the exact amount: ₹{totalAmount.toLocaleString('en-IN')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-black text-emerald-600 flex-shrink-0">3.</span>
                <span>Take a screenshot of the successful payment</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-black text-emerald-600 flex-shrink-0">4.</span>
                <span>Upload the screenshot and enter transaction ID above</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-black text-emerald-600 flex-shrink-0">5.</span>
                <span>We'll verify and activate your plan within 24 hours</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Plans() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getPlans, submitPaymentProof, loading: plansLoading } = usePlans();

  const [plans, setPlans] = useState([]);
  const [billingCycle, setBillingCycle] = useState('MONTHLY');
  const [subscribing, setSubscribing] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [error, setError] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Load plans on mount
  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setError(null);
      const data = await getPlans();
      setPlans(data || []);
    } catch (err) {
      console.error('Failed to fetch plans:', err);
      setError(err.message || 'Failed to load plans');
    }
  };

  // Filter and sort plans by billing cycle and price
  const filteredPlans = plans
    .filter(plan => plan.billingCycle === billingCycle)
    .sort((a, b) => a.price - b.price);

  // Check if user is on this plan
  const isCurrentPlan = (planId) => {
    console.log(user)
    if (!user?.subscription?.planId) return false;
    const userPlanId = typeof user.subscription.planId === 'object'
      ? user.subscription.planId._id
      : user.subscription.planId;
    return userPlanId === planId && user.subscription.isActive;
  };

  // Handle subscription
  const handleSubscribe = async (plan) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (isCurrentPlan(plan._id)) {
      setMessage({ type: 'error', text: 'You are already on this plan' });
      return;
    }

    setSubscribing(plan._id);
    setMessage({ type: '', text: '' });

    try {
      // For free plan, subscribe directly
      if (plan.price === 0) {
        await submitPaymentProof({
          planId: plan._id,
          billingCycle: plan.billingCycle,
          isFree: true
        });
        setMessage({
          type: 'success',
          text: `Successfully subscribed to ${plan.name}! Redirecting...`
        });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        // For paid plans, show payment modal
        setSelectedPlan(plan);
        setShowPaymentModal(true);
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.message || 'Subscription failed. Please try again.'
      });
    } finally {
      setSubscribing(null);
    }
  };

  // Handle payment proof submission
  const handlePaymentProofSubmit = async (proofData) => {
    try {
      await submitPaymentProof(proofData);
      setShowPaymentModal(false);
      setSelectedPlan(null);
      setMessage({
        type: 'success',
        text: 'Payment proof submitted! We will verify and activate your plan within 24 hours. Check your email for updates.'
      });
    } catch (err) {
      throw err;
    }
  };

  // Format currency in INR
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Get plan badge color
  const getPlanColor = (planName) => {
    const colors = {
      FREE: 'gray',
      STARTER: 'blue',
      PRO: 'purple',
      ENTERPRISE: 'green',
    };
    return colors[planName] || 'gray';
  };

  // Calculate yearly savings
  const calculateYearlySavings = (monthlyPrice) => {
    const yearlyEquivalent = monthlyPrice * 12;
    const savings = yearlyEquivalent * 0.20; // 20% savings
    return formatPrice(savings);
  };

  if (plansLoading && plans.length === 0) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading plans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border-2 border-red-200 p-8 text-center shadow-lg">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Unable to Load Plans</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={loadPlans}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] mx-auto">

      {/* Payment Modal */}
      {showPaymentModal && selectedPlan && (
        <PaymentModal
          plan={selectedPlan}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPlan(null);
          }}
          onSubmitProof={handlePaymentProofSubmit}
        />
      )}
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-12">
        <div className="text-center animate-fadeIn">
          {/* Badge */}
          <span className="inline-flex items-center gap-2 text-sm font-bold text-green-700 bg-green-50 border-2 border-green-200 rounded-full px-4 py-2 mb-6 shadow-sm">
            <Sparkles size={16} className="text-green-600" />
            Choose Your Plan
          </span>

          <h1 className="text-6xl sm:text-7xl font-black text-slate-900 leading-tight tracking-tighter mb-6">
            Scale your campaigns
            <br />
            <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              with confidence
            </span>
          </h1>

          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Start free and upgrade as you grow. Transparent pricing with no hidden fees.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl shadow-inner">
            <button
              onClick={() => setBillingCycle('MONTHLY')}
              className={`px-8 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${billingCycle === 'MONTHLY'
                ? 'bg-white text-slate-900 shadow-md'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('YEARLY')}
              className={`px-8 py-3 text-sm font-bold rounded-xl transition-all duration-200 relative ${billingCycle === 'YEARLY'
                ? 'bg-white text-slate-900 shadow-md'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-teal-500 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-lg">
                SAVE 20%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Message Banner */}
      {message.text && (
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <div
            className={`flex items-center gap-3 px-6 py-4 mx-auto rounded-2xl text-sm font-semibold border-2 shadow-sm ${message.type === 'success'
              ? 'bg-green-50 text-green-700 border-green-300'
              : message.type === 'info'
                ? 'bg-blue-50 text-blue-700 border-blue-300'
                : 'bg-red-50 text-red-700 border-red-300'
              }`}
          >
            {message.type === 'success' ? (
              <Check size={20} />
            ) : message.type === 'info' ? (
              <AlertCircle size={20} />
            ) : (
              <X size={20} />
            )}
            <span>{message.text}</span>
          </div>
        </section>
      )}

      {/* Plans Grid */}
      <section className="max-w-8xl mx-auto px-6 pb-20">
        {filteredPlans.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-600 text-lg">No plans available for {billingCycle.toLowerCase()} billing.</p>
          </div>
        ) : (
          <div
            className={`gap-8 mx-auto ${filteredPlans.length < 4
              ? 'flex justify-center flex-wrap'
              : 'grid md:grid-cols-2 lg:grid-cols-4'
              }`}
          >
            {filteredPlans.map((plan, index) => {
              const isPopular = plan.name === 'PRO';
              const isCurrent = isCurrentPlan(plan._id);
              const isFree = plan.price === 0;

              return (
                <div
                  key={plan._id}
                  className={`relative bg-white rounded-3xl transition-all duration-300 ${isPopular
                    ? 'border-4 border-green-500 shadow-2xl shadow-green-200/50 scale-105'
                    : isCurrent
                      ? 'border-4 border-blue-400 shadow-xl'
                      : 'border-2 border-slate-200 hover:border-green-300 hover:shadow-xl'
                    } animate-fadeIn`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Popular Badge */}
                  {isPopular && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
                      <span className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white text-xs font-black rounded-full shadow-xl uppercase tracking-wider">
                        <TrendingUp size={16} />
                        Most Popular
                      </span>
                    </div>
                  )}

                 

                  <div className="p-8">
                    {/* Plan Header */}
                    <div className="mb-8">
                      <h3 className="text-3xl font-black text-slate-900 mb-3">{plan.name}</h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-slate-900">
                          {formatPrice(plan.price)}
                        </span>
                        <span className="text-slate-500 text-base font-semibold">
                          /{billingCycle === 'MONTHLY' ? 'mo' : 'yr'}
                        </span>
                      </div>
                      {billingCycle === 'YEARLY' && !isFree && (
                        <p className="text-xs text-green-600 font-semibold mt-2">
                          Save {calculateYearlySavings(plan.price / 0.8 / 12)} per year
                        </p>
                      )}
                    </div>

                    {/* Credits Badge */}
                    <div className="mb-8 p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl border-2 border-amber-200">
                      <div className="flex items-center gap-2 text-sm">
                        <Zap size={18} className="text-amber-500" />
                        <span className="font-black text-slate-900">
                          {plan.creditsIncluded !== null
                            ? plan.creditsIncluded.toLocaleString('en-IN')
                            : 'Unlimited'}{' '}
                          credits
                        </span>
                      </div>
                      {billingCycle === 'YEARLY' && plan.creditsIncluded && (
                        <p className="text-xs text-slate-600 mt-1 font-medium">
                          ~{Math.round(plan.creditsIncluded / 12).toLocaleString('en-IN')} per month
                        </p>
                      )}
                    </div>

                    {/* Features List */}
                    <div className="space-y-4 mb-10">
                      {/* Campaigns */}
                      <div className="flex items-start gap-3 text-sm">
                        <Check size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-700 font-medium">
                          <strong className="text-slate-900">
                            {plan.maxCampaignsPerMonth !== null
                              ? plan.maxCampaignsPerMonth.toLocaleString('en-IN')
                              : 'Unlimited'}
                          </strong>{' '}
                          campaigns/month
                        </span>
                      </div>

                      {/* Recipients */}
                      <div className="flex items-start gap-3 text-sm">
                        <Check size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-700 font-medium">
                          <strong className="text-slate-900">
                            {plan.maxRecipientsPerCampaign !== null
                              ? plan.maxRecipientsPerCampaign.toLocaleString('en-IN')
                              : 'Unlimited'}
                          </strong>{' '}
                          recipients/campaign
                        </span>
                      </div>

                      {/* Feature flags */}
                      {Object.entries(plan.features || {}).map(([key, value]) => {
                        if (!value) return null;
                        const Icon = featureIcons[key];
                        const label = featureLabels[key];

                        return (
                          <div key={key} className="flex items-start gap-3 text-sm">
                            {Icon && <Icon size={18} className="text-green-600 mt-0.5 flex-shrink-0" />}
                            <span className="text-slate-700 font-medium">{label}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={() => handleSubscribe(plan)}
                      disabled={subscribing === plan._id || isCurrent}
                      className={`w-full py-4 px-6 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2 shadow-lg ${isCurrent
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : isPopular
                          ? 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white shadow-green-300'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                    >
                      {subscribing === plan._id ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Processing...
                        </>
                      ) : isCurrent ? (
                        'Current Plan'
                      ) : (
                        <>
                          <CreditCard size={18} />
                          {isFree ? 'Get Started Free' : 'Subscribe Now'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* What You Get Section */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="bg-gradient-to-br from-green-50 via-teal-50 to-green-50 rounded-3xl border-2 border-green-200 p-12 shadow-xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-slate-900 mb-4">
              What happens when you upgrade?
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto font-medium">
              Understanding your subscription and how it works
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {/* Immediate Access */}
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                <Zap size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3">Instant Credit Refill</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                Your credits are added immediately to your account balance. Start sending campaigns right away.
              </p>
            </div>

            {/* Auto Renewal */}
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                <TrendingUp size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3">Auto-Renewal Protection</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                Your plan automatically renews each billing period. Credits refill, limits reset. Cancel anytime.
              </p>
            </div>

            {/* Support */}
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                <Shield size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3">Premium Features Unlocked</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                Access advanced analytics, priority support, and custom templates based on your plan level.
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-12 p-8 bg-white rounded-2xl border-2 border-green-200 shadow-sm">
            <h4 className="font-black text-slate-900 mb-4 flex items-center gap-2 text-lg">
              <CreditCard size={20} className="text-green-600" />
              Payment & Billing Details
            </h4>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-3">
                <Check size={16} className="text-green-600 mt-1 flex-shrink-0" />
                <span className="font-medium">Secure payment processing with industry-standard encryption</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={16} className="text-green-600 mt-1 flex-shrink-0" />
                <span className="font-medium">Automatic billing on your renewal date - cancel anytime before renewal</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={16} className="text-green-600 mt-1 flex-shrink-0" />
                <span className="font-medium">Unused credits roll over if you upgrade, but expire at plan end if you cancel</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={16} className="text-green-600 mt-1 flex-shrink-0" />
                <span className="font-medium">Yearly plans save 20% and include 12 months of credits upfront</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={16} className="text-green-600 mt-1 flex-shrink-0" />
                <span className="font-medium">All prices in Indian Rupees (INR) - GST applicable as per regulations</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-6 pb-32">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black text-slate-900 mb-4">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {[
            {
              q: 'Can I switch plans at any time?',
              a: `Yes! You can upgrade or downgrade your plan at any time. When upgrading, you'll get immediate access to new features and credits. When downgrading, changes take effect at your next billing cycle.`,
            },
            {
              q: 'What happens to my credits when I upgrade?',
              a: `Your existing credits are preserved! When you upgrade, your new plan's credits are added to your current balance. This means you never lose credits when improving your plan.`,
            },
            {
              q: 'Do unused credits roll over?',
              a: 'Credits from your active subscription remain available until your plan expires. If you cancel your subscription, you can continue using credits until your current period ends.',
            },
            {
              q: 'Can I cancel my subscription?',
              a: 'Absolutely. Cancel anytime with no penalties. Your plan remains active until the end of your current billing period, and you can continue using all features and credits during that time.',
            },
            {
              q: 'What payment methods do you accept?',
              a: 'We accept all major credit/debit cards, UPI, net banking, and digital wallets through our secure payment gateway. All transactions are encrypted and comply with Indian payment regulations.',
            },
            {
              q: 'Are there any additional charges or GST?',
              a: 'Prices shown are base prices. GST will be added as per Indian tax regulations at checkout. There are no hidden fees or additional charges.',
            },
          ].map((faq, index) => (
            <details
              key={index}
              className="group bg-white border-2 border-slate-200 rounded-2xl p-6 hover:border-green-300 transition-all shadow-sm"
            >
              <summary className="font-bold text-slate-900 cursor-pointer list-none flex items-center justify-between text-base">
                <span>{faq.q}</span>
                <span className="text-green-600 text-2xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-4 text-sm text-slate-600 leading-relaxed font-medium">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}