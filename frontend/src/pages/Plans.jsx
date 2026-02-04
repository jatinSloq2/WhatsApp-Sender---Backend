import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  BarChart2,
  Check,
  CheckCircle2,
  Code,
  CreditCard,
  Crown,
  Loader2,
  Shield,
  Sparkles,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PaymentModal } from "../components/PaymentModal";
import { useAuth } from "../context/AuthContext";
import { usePlans } from "../context/PlanContext";

/* ── feature icon / label maps ── */
const FEATURE_ICONS = { 
  analyticsAccess: BarChart2, 
  prioritySupport: Shield, 
  customTemplates: Sparkles, 
  apiAccess: Code 
};
const FEATURE_LABELS = { 
  analyticsAccess: "Advanced Analytics", 
  prioritySupport: "Priority Support", 
  customTemplates: "Custom Templates", 
  apiAccess: "API Access" 
};

/* ── FAQ data ── */
const FAQS = [
  {
    q: "Can I switch plans at any time?",
    a: "Yes! Upgrade or downgrade anytime. Upgrades take effect immediately with new features and credits. Downgrades take effect at the end of your current billing cycle."
  },
  {
    q: "What happens to my credits when I upgrade?",
    a: "Your existing credits are preserved. New plan credits are added on top of your current balance — you never lose credits when upgrading."
  },
  {
    q: "Do unused credits roll over?",
    a: "Credits from your active subscription stay available until your plan expires. If you cancel, you can keep using credits until your current period ends."
  },
  {
    q: "Can I cancel my subscription?",
    a: "Absolutely. Cancel anytime with no penalties. Your plan stays active until the end of your current billing period."
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major UPI apps, credit/debit cards, net banking, and digital wallets. All transactions are encrypted and compliant with Indian payment regulations."
  },
  {
    q: "Are there any additional charges or GST?",
    a: "Prices shown are base prices. GST (18%) is added at checkout as per Indian tax regulations. No other hidden fees."
  },
];

export default function Plans() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getPlans, submitPaymentProof, loading: plansLoading } = usePlans();

  const [plans, setPlans] = useState([]);
  const [billingCycle, setBillingCycle] = useState("MONTHLY");
  const [subscribing, setSubscribing] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [error, setError] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => { loadPlans(); }, []);

  const loadPlans = async () => {
    try { 
      setError(null); 
      setPlans(await getPlans() || []); 
    } catch (e) { 
      setError(e.message || "Failed to load plans"); 
    }
  };

  /* derived */
  const filteredPlans = plans
    .filter((p) => p.billingCycle === billingCycle)
    .sort((a, b) => a.price - b.price);

  const isCurrentPlan = (planId) => {
    if (!user?.subscription?.planId) return false;
    const id = typeof user.subscription.planId === "object" 
      ? user.subscription.planId._id 
      : user.subscription.planId;
    return id === planId && user.subscription.isActive;
  };

  /* handlers */
  const handleSubscribe = async (plan) => {
    if (!user) { navigate("/login"); return; }
    if (isCurrentPlan(plan._id)) { 
      setMessage({ type: "error", text: "You are already on this plan" }); 
      return; 
    }
    setSubscribing(plan._id);
    setMessage({ type: "", text: "" });
    try {
      if (plan.price === 0) {
        await submitPaymentProof({ 
          planId: plan._id, 
          billingCycle: plan.billingCycle, 
          isFree: true 
        });
        setMessage({ 
          type: "success", 
          text: `Successfully subscribed to ${plan.name}! Redirecting…` 
        });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setSelectedPlan(plan);
        setShowPaymentModal(true);
      }
    } catch (e) {
      setMessage({ 
        type: "error", 
        text: e.message || "Subscription failed. Please try again." 
      });
    } finally { 
      setSubscribing(null); 
    }
  };

  const handlePaymentProofSubmit = async (proofData) => {
    await submitPaymentProof(proofData);
    setShowPaymentModal(false); 
    setSelectedPlan(null);
    setMessage({ 
      type: "success", 
      text: "Payment proof submitted! We'll verify and activate your plan within 24 hours." 
    });
  };

  /* helpers */
  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", { 
      style: "currency", 
      currency: "INR", 
      maximumFractionDigits: 0 
    }).format(price);

  const calculateYearlySavings = (monthlyPrice) =>
    formatPrice(monthlyPrice * 12 * 0.2);

  /* ── loading ── */
  if (plansLoading && plans.length === 0) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#25D366] animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading plans…</p>
        </div>
      </div>
    );
  }

  /* ── error ── */
  if (error) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full border border-red-200 shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Plans</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button 
              onClick={loadPlans} 
              className="bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ── MAIN RENDER ── */
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">

      {/* ── shared PaymentModal ── */}
      {showPaymentModal && selectedPlan && (
        <PaymentModal
          item={{
            name: selectedPlan.name,
            subtitle: `${selectedPlan.name} · ${selectedPlan.billingCycle === "MONTHLY" ? "Monthly" : "Yearly"} Subscription`,
            baseAmount: selectedPlan.price,
            gstAmount: Math.round(selectedPlan.price * 0.18),
            totalAmount: selectedPlan.price + Math.round(selectedPlan.price * 0.18),
          }}
          extraPayload={{
            planId: selectedPlan._id,
            billingCycle: selectedPlan.billingCycle,
          }}
          onClose={() => { 
            setShowPaymentModal(false); 
            setSelectedPlan(null); 
          }}
          onSubmitProof={handlePaymentProofSubmit}
        />
      )}

      {/* ══════════════ HERO ══════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center">
          <Badge className="inline-flex items-center gap-2 bg-white text-[#25D366] border border-[#25D366]/20 px-4 py-2 font-semibold text-sm mb-6 shadow-sm">
            <Crown className="w-4 h-4" /> Subscription Plans
          </Badge>

          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 tracking-tight leading-tight mb-4">
            Scale Your Campaigns
            <br />
            <span className="text-[#25D366]">with Confidence</span>
          </h1>
          
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Start free and upgrade as you grow. Transparent pricing with no hidden fees.
          </p>
        </div>
      </section>

      {/* ══════════════ MESSAGE BANNER ══════════════ */}
      {message.text && (
        <section className="max-w-7xl mx-auto px-6 pb-6">
          <Alert 
            variant={message.type === "error" ? "destructive" : "default"} 
            className={`border shadow-sm ${
              message.type === "success" 
                ? "bg-green-50 border-green-200" 
                : message.type === "info" 
                  ? "bg-blue-50 border-blue-200" 
                  : "bg-red-50 border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : message.type === "info" ? (
              <AlertCircle className="h-4 w-4 text-blue-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription 
              className={`font-medium ${
                message.type === "success" 
                  ? "text-green-700" 
                  : message.type === "info" 
                    ? "text-blue-700" 
                    : "text-red-700"
              }`}
            >
              {message.text}
            </AlertDescription>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setMessage({ type: "", text: "" })} 
              className="ml-auto p-0 h-auto hover:bg-transparent"
            >
              <X size={16} />
            </Button>
          </Alert>
        </section>
      )}

      {/* ══════════════ BILLING TOGGLE ══════════════ */}
      <section className="max-w-7xl mx-auto px-6 pb-8">
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 p-1.5 bg-white border border-gray-200 shadow-sm">
            <Button
              variant={billingCycle === "MONTHLY" ? "default" : "ghost"}
              onClick={() => setBillingCycle("MONTHLY")}
              className={`px-8 py-2.5 text-sm font-semibold transition-all ${
                billingCycle === "MONTHLY"
                  ? "bg-[#25D366] text-white hover:bg-[#25D366]"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Monthly
            </Button>

            <Button
              variant={billingCycle === "YEARLY" ? "default" : "ghost"}
              onClick={() => setBillingCycle("YEARLY")}
              className={`px-8 py-2.5 text-sm font-semibold transition-all relative ${
                billingCycle === "YEARLY"
                  ? "bg-[#25D366] text-white hover:bg-[#25D366]"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Yearly
              <Badge className="absolute -top-6 -right-8 bg-[#25D366] text-white text-xs font-bold px-2.5 py-0.5 shadow-lg border-0">
                SAVE 20%
              </Badge>
            </Button>
          </div>
        </div>
      </section>

      {/* ══════════════ PLANS GRID ══════════════ */}
      <section className="max-w-7xl mx-auto px-6 pb-12">
        {filteredPlans.length === 0 ? (
          <Card className="bg-white border border-gray-200 shadow-sm max-w-md mx-auto">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600">No plans available for {billingCycle.toLowerCase()} billing.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredPlans.map((plan) => {
              const isPopular = plan.name === "PRO";
              const isCurrent = isCurrentPlan(plan._id);
              const isFree = plan.price === 0;

              return (
                <Card
                  key={plan._id}
                  className={`bg-white transition-all ${
                    isPopular
                      ? "border-2 border-[#25D366] shadow-xl shadow-green-100"
                      : isCurrent
                        ? "border-2 border-blue-500 shadow-lg"
                        : "border border-gray-200 hover:border-[#25D366]/30 hover:shadow-md"
                  }`}
                >
                  {/* Popular badge */}
                  {isPopular && (
                    <div className="bg-[#25D366] text-white text-center py-2 font-semibold text-sm flex items-center justify-center gap-2">
                      <TrendingUp size={16} /> Most Popular
                    </div>
                  )}

                  <CardHeader className="px-6 pt-6 pb-4">
                    <CardTitle className="text-2xl font-bold text-gray-900 mb-3">
                      {plan.name}
                    </CardTitle>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-gray-900">
                        {formatPrice(plan.price)}
                      </span>
                      <span className="text-gray-600 font-medium">
                        /{billingCycle === "MONTHLY" ? "mo" : "yr"}
                      </span>
                    </div>
                    {billingCycle === "YEARLY" && !isFree && (
                      <CardDescription className="text-xs text-green-600 font-semibold mt-2">
                        Save {calculateYearlySavings(plan.price / 0.8 / 12)} per year
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="px-6 pb-6">
                    {/* credits badge */}
                    <div className="mb-5 p-4 bg-amber-50 border border-amber-200">
                      <div className="flex items-center gap-2">
                        <Zap size={18} className="text-amber-600" />
                        <span className="font-bold text-gray-900 text-sm">
                          {plan.creditsIncluded !== null 
                            ? plan.creditsIncluded.toLocaleString("en-IN") 
                            : "Unlimited"} credits
                        </span>
                      </div>
                      {billingCycle === "YEARLY" && plan.creditsIncluded && (
                        <p className="text-xs text-gray-600 mt-1">
                          ~{Math.round(plan.creditsIncluded / 12).toLocaleString("en-IN")} per month
                        </p>
                      )}
                    </div>

                    {/* features list */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2.5 text-sm">
                        <CheckCircle2 size={16} className="text-[#25D366] flex-shrink-0" />
                        <span className="text-gray-700">
                          <strong className="text-gray-900">
                            {plan.maxCampaignsPerMonth !== null 
                              ? plan.maxCampaignsPerMonth.toLocaleString("en-IN") 
                              : "Unlimited"}
                          </strong> campaigns/month
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 text-sm">
                        <CheckCircle2 size={16} className="text-[#25D366] flex-shrink-0" />
                        <span className="text-gray-700">
                          <strong className="text-gray-900">
                            {plan.maxRecipientsPerCampaign !== null 
                              ? plan.maxRecipientsPerCampaign.toLocaleString("en-IN") 
                              : "Unlimited"}
                          </strong> recipients/campaign
                        </span>
                      </div>
                      {Object.entries(plan.features || {}).map(([key, val]) => {
                        if (!val) return null;
                        const Icon = FEATURE_ICONS[key];
                        const label = FEATURE_LABELS[key];
                        return (
                          <div key={key} className="flex items-center gap-2.5 text-sm">
                            {Icon ? (
                              <Icon size={16} className="text-[#25D366] flex-shrink-0" />
                            ) : (
                              <CheckCircle2 size={16} className="text-[#25D366] flex-shrink-0" />
                            )}
                            <span className="text-gray-700">{label}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* CTA */}
                    <Button
                      onClick={() => handleSubscribe(plan)}
                      disabled={subscribing === plan._id || isCurrent}
                      className={`w-full font-semibold text-sm shadow-sm transition-all ${
                        isCurrent
                          ? "bg-gray-100 text-gray-400 hover:bg-gray-100 cursor-not-allowed"
                          : isPopular
                            ? "bg-[#25D366] hover:bg-[#20BD5A] text-white"
                            : "bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300"
                      }`}
                    >
                      {subscribing === plan._id ? (
                        <>
                          <Loader2 size={16} className="animate-spin mr-2" /> Processing…
                        </>
                      ) : isCurrent ? (
                        "Current Plan"
                      ) : (
                        <>
                          <CreditCard size={16} className="mr-2" /> 
                          {isFree ? "Get Started Free" : "Subscribe Now"}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ══════════════ WHAT HAPPENS WHEN YOU UPGRADE ══════════════ */}
      <section className="max-w-7xl mx-auto px-6 pb-12">
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="px-8 pt-8 pb-4 text-center">
            <CardTitle className="text-3xl font-bold text-gray-900">
              What Happens When You Upgrade?
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Understanding your subscription and how it works
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              {[
                { 
                  icon: Zap, 
                  title: "Instant Credit Refill", 
                  desc: "Credits are added immediately to your balance. Start sending campaigns right away.",
                  gradient: "from-[#25D366] to-green-600"
                },
                { 
                  icon: TrendingUp, 
                  title: "Auto-Renewal Protection", 
                  desc: "Your plan automatically renews each billing period. Credits refill, limits reset. Cancel anytime.",
                  gradient: "from-blue-500 to-blue-600"
                },
                { 
                  icon: Shield, 
                  title: "Premium Features Unlocked", 
                  desc: "Access advanced analytics, priority support, and custom templates based on your plan.",
                  gradient: "from-purple-500 to-purple-600"
                },
              ].map(({ gradient, icon: Icon, title, desc }) => (
                <div key={title} className="text-center">
                  <div 
                    className={`mx-auto w-16 h-16 bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-lg`}
                  >
                    <Icon size={28} className="text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            {/* payment & billing details */}
            <Card className="bg-green-50 border border-green-200 shadow-none">
              <CardHeader className="px-6 pt-6 pb-2">
                <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <CreditCard size={18} className="text-[#25D366]" /> 
                  Payment & Billing Details
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="space-y-3">
                  {[
                    "Secure payment processing with industry-standard encryption",
                    "Automatic billing on your renewal date — cancel anytime before renewal",
                    "Unused credits roll over if you upgrade, but expire at plan end if you cancel",
                    "Yearly plans save 20% and include 12 months of credits upfront",
                    "All prices in Indian Rupees (INR) — GST applicable as per regulations",
                  ].map((txt, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <Check size={16} className="text-[#25D366] mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{txt}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </section>

      {/* ══════════════ FAQ ══════════════ */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-600">Everything you need to know about our plans</p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, i) => (
            <Card 
              key={i} 
              className="bg-white border border-gray-200 shadow-sm hover:border-[#25D366]/30 transition-all"
            >
              <details className="group">
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none">
                  <span className="font-semibold text-gray-900 text-base">{faq.q}</span>
                  <span className="text-[#25D366] text-2xl group-open:rotate-45 transition-transform duration-200 flex-shrink-0 ml-4">
                    +
                  </span>
                </summary>
                <CardContent className="px-6 pb-5 pt-0">
                  <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                </CardContent>
              </details>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}