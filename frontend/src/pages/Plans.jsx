import {
  AlertCircle,
  BarChart2,
  Check,
  Code,
  CreditCard,
  Loader2,
  Shield,
  Sparkles,
  TrendingUp,
  X,
  Zap,CheckCircle2 
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PaymentModal } from "../components/PaymentModal"; // ← shared modal
import { useAuth } from "../context/AuthContext";
import { usePlans } from "../context/PlanContext";

/* ── feature icon / label maps ── */
const FEATURE_ICONS = { analyticsAccess: BarChart2, prioritySupport: Shield, customTemplates: Sparkles, apiAccess: Code };
const FEATURE_LABELS = { analyticsAccess: "Advanced Analytics", prioritySupport: "Priority Support", customTemplates: "Custom Templates", apiAccess: "API Access" };

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

// ─────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────
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

  /* fetch */
  useEffect(() => { loadPlans(); }, []);

  const loadPlans = async () => {
    try { setError(null); setPlans(await getPlans() || []); }
    catch (e) { setError(e.message || "Failed to load plans"); }
  };

  /* derived */
  const filteredPlans = plans
    .filter((p) => p.billingCycle === billingCycle)
    .sort((a, b) => a.price - b.price);

  const isCurrentPlan = (planId) => {
    if (!user?.subscription?.planId) return false;
    const id = typeof user.subscription.planId === "object" ? user.subscription.planId._id : user.subscription.planId;
    return id === planId && user.subscription.isActive;
  };

  /* handlers */
  const handleSubscribe = async (plan) => {
    if (!user) { navigate("/login"); return; }
    if (isCurrentPlan(plan._id)) { setMessage({ type: "error", text: "You are already on this plan" }); return; }
    setSubscribing(plan._id);
    setMessage({ type: "", text: "" });
    try {
      if (plan.price === 0) {
        await submitPaymentProof({ planId: plan._id, billingCycle: plan.billingCycle, isFree: true });
        setMessage({ type: "success", text: `Successfully subscribed to ${plan.name}! Redirecting…` });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setSelectedPlan(plan);
        setShowPaymentModal(true);
      }
    } catch (e) {
      setMessage({ type: "error", text: e.message || "Subscription failed. Please try again." });
    } finally { setSubscribing(null); }
  };

  const handlePaymentProofSubmit = async (proofData) => {
    await submitPaymentProof(proofData);
    setShowPaymentModal(false); setSelectedPlan(null);
    setMessage({ type: "success", text: "Payment proof submitted! We'll verify and activate your plan within 24 hours." });
  };

  /* helpers */
  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);

  const calculateYearlySavings = (monthlyPrice) =>
    formatPrice(monthlyPrice * 12 * 0.2);

  /* ── loading / error screens ── */
  if (plansLoading && plans.length === 0) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading plans…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border-2 border-red-300 p-8 text-center shadow-lg">
          <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Unable to Load Plans</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button onClick={loadPlans} className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all">Try Again</button>
        </div>
      </div>
    );
  }

  /* ── MAIN RENDER ── */
  return (
    <div className="min-h-[calc(100vh-64px)] mx-auto">

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
          onClose={() => { setShowPaymentModal(false); setSelectedPlan(null); }}
          onSubmitProof={handlePaymentProofSubmit}
        />
      )}

      {/* ══════════════ HERO ══════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-teal-50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-200 rounded-full blur-3xl opacity-20 -z-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-200 rounded-full blur-3xl opacity-20 -z-10" />

        <div className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
          {/* badge */}
          <span className="inline-flex items-center gap-2 text-sm font-bold text-green-700 bg-green-100 border-2 border-green-300 px-4 py-2 rounded-full shadow-sm mb-6">
            <Sparkles size={16} className="text-green-600" /> Choose Your Plan
          </span>

          <h1 className="text-5xl sm:text-6xl font-black text-black tracking-tight leading-tight mb-4">
            Scale your campaigns
            <br />
            <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">with confidence</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Start free and upgrade as you grow. Transparent pricing with no hidden fees.
          </p>
        </div>
      </section>

      {/* ══════════════ MESSAGE BANNER ══════════════ */}
      {message.text && (
        <section className="max-w-6xl mx-auto px-6 pt-4">
          <div className={`flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-semibold border-2 shadow-sm ${message.type === "success" ? "bg-green-50 text-green-700 border-green-300"
              : message.type === "info" ? "bg-blue-50 text-blue-700 border-blue-300"
                : "bg-red-50 text-red-700 border-red-300"
            }`}>
            {message.type === "success" ? <Check size={18} /> : message.type === "info" ? <AlertCircle size={18} /> : <X size={18} />}
            <span>{message.text}</span>
            <button onClick={() => setMessage({ type: "", text: "" })} className="ml-auto"><X size={16} /></button>
          </div>
        </section>
      )}

      {/* ══════════════ BILLING TOGGLE ══════════════ */}
      <section className="max-w-6xl mx-auto px-6 py-6 flex justify-center">
        <div className="inline-flex items-center gap-1 p-1.5 bg-gray-100 rounded-2xl shadow-sm border-2 border-gray-200">
          <button
            onClick={() => setBillingCycle("MONTHLY")}
            className={`px-8 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${billingCycle === "MONTHLY" ? "bg-green-600 text-white shadow-md" : "text-gray-600 hover:text-black"
              }`}
          >Monthly</button>

          <button
            onClick={() => setBillingCycle("YEARLY")}
            className={`px-8 py-3 text-sm font-bold rounded-xl transition-all duration-200 relative ${billingCycle === "YEARLY" ? "bg-green-600 text-white shadow-md" : "text-gray-600 hover:text-black"
              }`}
          >
            Yearly
            <span className="absolute -top-5 -right-10 bg-gradient-to-r from-green-500 to-teal-500 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-lg">
              SAVE 20%
            </span>
          </button>
        </div>
      </section>

      {/* ══════════════ PLANS GRID ══════════════ */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        {filteredPlans.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No plans available for {billingCycle.toLowerCase()} billing.</p>
          </div>
        ) : (
          <div className={`gap-6 mx-auto ${filteredPlans.length < 4 ? "flex justify-center flex-wrap" : "grid md:grid-cols-2 lg:grid-cols-4"}`}>
            {filteredPlans.map((plan, idx) => {
              const isPopular = plan.name === "PRO";
              const isCurrent = isCurrentPlan(plan._id);
              const isFree = plan.price === 0;

              return (
                <div
                  key={plan._id}
                  className={`relative bg-white rounded-2xl transition-all duration-300 ${isPopular
                      ? "border-4 border-green-600 shadow-2xl shadow-green-200 scale-[1.04]"
                      : isCurrent
                        ? "border-4 border-blue-500 shadow-xl"
                        : "border-2 border-gray-300 hover:border-green-600 hover:shadow-lg"
                    }`}
                >
                  {/* Popular badge */}
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <span className="inline-flex items-center gap-2 px-5 py-1.5 bg-gradient-to-r from-green-600 to-teal-600 text-white text-xs font-black rounded-full shadow-lg uppercase tracking-wider">
                        <TrendingUp size={14} /> Most Popular
                      </span>
                    </div>
                  )}

                  <div className="p-7">
                    {/* plan name + price */}
                    <h3 className="text-2xl font-black text-black mb-3">{plan.name}</h3>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-4xl font-black text-black">{formatPrice(plan.price)}</span>
                      <span className="text-gray-500 font-semibold">/{billingCycle === "MONTHLY" ? "mo" : "yr"}</span>
                    </div>
                    {billingCycle === "YEARLY" && !isFree && (
                      <p className="text-xs text-green-600 font-semibold">Save {calculateYearlySavings(plan.price / 0.8 / 12)} per year</p>
                    )}

                    {/* credits badge */}
                    <div className="mt-5 mb-5 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Zap size={18} className="text-amber-500" />
                        <span className="font-black text-black text-sm">
                          {plan.creditsIncluded !== null ? plan.creditsIncluded.toLocaleString("en-IN") : "Unlimited"} credits
                        </span>
                      </div>
                      {billingCycle === "YEARLY" && plan.creditsIncluded && (
                        <p className="text-xs text-gray-500 mt-1">~{Math.round(plan.creditsIncluded / 12).toLocaleString("en-IN")} per month</p>
                      )}
                    </div>

                    {/* features list */}
                    <div className="space-y-3 mb-7">
                      <div className="flex items-center gap-2.5 text-sm">
                        <CheckCircle2 size={17} className="text-green-600 flex-shrink-0" />
                        <span className="text-gray-700">
                          <strong className="text-black">
                            {plan.maxCampaignsPerMonth !== null ? plan.maxCampaignsPerMonth.toLocaleString("en-IN") : "Unlimited"}
                          </strong> campaigns/month
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 text-sm">
                        <CheckCircle2 size={17} className="text-green-600 flex-shrink-0" />
                        <span className="text-gray-700">
                          <strong className="text-black">
                            {plan.maxRecipientsPerCampaign !== null ? plan.maxRecipientsPerCampaign.toLocaleString("en-IN") : "Unlimited"}
                          </strong> recipients/campaign
                        </span>
                      </div>
                      {Object.entries(plan.features || {}).map(([key, val]) => {
                        if (!val) return null;
                        const Icon = FEATURE_ICONS[key];
                        const label = FEATURE_LABELS[key];
                        return (
                          <div key={key} className="flex items-center gap-2.5 text-sm">
                            {Icon ? <Icon size={17} className="text-green-600 flex-shrink-0" /> : <CheckCircle2 size={17} className="text-green-600 flex-shrink-0" />}
                            <span className="text-gray-700">{label}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* CTA button */}
                    <button
                      onClick={() => handleSubscribe(plan)}
                      disabled={subscribing === plan._id || isCurrent}
                      className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all shadow-md ${isCurrent
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                          : isPopular
                            ? "bg-green-600 hover:bg-green-700 text-white shadow-green-200"
                            : "bg-white hover:bg-gray-50 text-black border-2 border-gray-300"
                        }`}
                    >
                      {subscribing === plan._id ? (
                        <><Loader2 size={17} className="animate-spin" /> Processing…</>
                      ) : isCurrent ? (
                        "Current Plan"
                      ) : (
                        <><CreditCard size={17} /> {isFree ? "Get Started Free" : "Subscribe Now"}</>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ══════════════ WHAT HAPPENS WHEN YOU UPGRADE ══════════════ */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="bg-gradient-to-br from-green-50 via-teal-50 to-green-50 border-2 border-green-300 rounded-2xl p-10 shadow-sm">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-black mb-3">What happens when you upgrade?</h2>
            <p className="text-gray-600 max-w-xl mx-auto">Understanding your subscription and how it works</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { gradient: "from-green-600 to-teal-600", icon: Zap, title: "Instant Credit Refill", desc: "Credits are added immediately to your balance. Start sending campaigns right away." },
              { gradient: "from-blue-500 to-teal-500", icon: TrendingUp, title: "Auto-Renewal Protection", desc: "Your plan automatically renews each billing period. Credits refill, limits reset. Cancel anytime." },
              { gradient: "from-green-600 to-blue-600", icon: Shield, title: "Premium Features Unlocked", desc: "Access advanced analytics, priority support, and custom templates based on your plan." },
            ].map(({ gradient, icon: Icon, title, desc }) => (
              <div key={title} className="text-center">
                <div className={`w-18 h-18 mx-auto bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center shadow-lg mb-4`} style={{ width: 72, height: 72 }}>
                  <Icon size={30} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-black mb-2">{title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* payment & billing details box */}
          <div className="mt-10 bg-white border-2 border-green-300 rounded-2xl p-6 shadow-sm">
            <h4 className="font-bold text-black text-base flex items-center gap-2 mb-4">
              <CreditCard size={18} className="text-green-600" /> Payment & Billing Details
            </h4>
            <div className="space-y-3">
              {[
                "Secure payment processing with industry-standard encryption",
                "Automatic billing on your renewal date — cancel anytime before renewal",
                "Unused credits roll over if you upgrade, but expire at plan end if you cancel",
                "Yearly plans save 20% and include 12 months of credits upfront",
                "All prices in Indian Rupees (INR) — GST applicable as per regulations",
              ].map((txt, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Check size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{txt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ FAQ ══════════════ */}
      <section className="max-w-4xl mx-auto px-6 pb-28">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black text-black">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, i) => (
            <details key={i} className="group bg-white border-2 border-gray-300 rounded-2xl shadow-sm hover:border-green-600 transition-all">
              <summary className="flex items-center justify-between px-6 py-5 cursor-pointer list-none">
                <span className="font-bold text-gray-800 text-base">{faq.q}</span>
                <span className="text-green-600 text-2xl group-open:rotate-45 transition-transform duration-200 flex-shrink-0 ml-4">+</span>
              </summary>
              <div className="px-6 pb-5">
                <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}