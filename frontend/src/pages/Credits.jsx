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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  RefreshCw,
  Shield,
  Sparkles,
  TrendingUp,
  X,
  Zap
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { PaymentModal } from "../components/PaymentModal";
import { useAuth } from "../context/AuthContext";
import { useCredits } from "../context/CreditContext";

// ─────────────────────────────────────────────────────
// CUSTOM AMOUNT – tiered pricing helpers
// ─────────────────────────────────────────────────────
const CUSTOM_RATE_TIERS = [
  { min: 50, max: 199, creditsPerRupee: 5 },
  { min: 200, max: 499, creditsPerRupee: 6 },
  { min: 500, max: 999, creditsPerRupee: 7 },
  { min: 1000, max: 2999, creditsPerRupee: 8 },
  { min: 3000, max: 5999, creditsPerRupee: 9 },
  { min: 6000, max: 10000, creditsPerRupee: 10 },
];

const CUSTOM_MIN = 50;
const CUSTOM_MAX = 10000;

function calcCustomPrice(credits) {
  let total = 0;
  let remaining = credits;

  for (const tier of CUSTOM_RATE_TIERS) {
    if (remaining <= 0) break;

    const tierSize = tier.max - tier.min + 1;
    const used = Math.min(remaining, tierSize);

    total += used / tier.creditsPerRupee;
    remaining -= used;
  }

  return Math.round(total);
}

function activeRateLabel(credits) {
  for (let i = CUSTOM_RATE_TIERS.length - 1; i >= 0; i--) {
    if (credits >= CUSTOM_RATE_TIERS[i].min)
      return `${CUSTOM_RATE_TIERS[i].creditsPerRupee} credits / ₹1`;
  }
  return "";
}

// ─────────────────────────────────────────────────────
// TRANSACTION META
// ─────────────────────────────────────────────────────
const TXN_META = {
  PURCHASE: {
    icon: ArrowUpRight,
    color: "text-green-600",
    bg: "bg-green-50",
    label: "Purchase"
  },
  PLAN_REFILL: {
    icon: RefreshCw,
    color: "text-blue-600",
    bg: "bg-blue-50",
    label: "Plan Refill"
  },
  CAMPAIGN_SEND: {
    icon: ArrowDownLeft,
    color: "text-red-500",
    bg: "bg-red-50",
    label: "Campaign"
  },
  ADMIN_ADJUST: {
    icon: Shield,
    color: "text-gray-600",
    bg: "bg-gray-100",
    label: "Adjustment"
  },
};

const getTxnMeta = (type) => TXN_META[type] || TXN_META.ADMIN_ADJUST;

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// ─────────────────────────────────────────────────────
// CUSTOM AMOUNT CARD
// ─────────────────────────────────────────────────────
function CustomAmountCard({ onBuy }) {
  const [credits, setCredits] = useState(200);
  const [inputVal, setInputVal] = useState("200");
  const [inputError, setInputErr] = useState("");

  const basePrice = calcCustomPrice(credits);
  const gstAmount = Math.round(basePrice * 0.18);
  const total = basePrice + gstAmount;

  const applyValue = (raw) => {
    const n = parseInt(raw, 10);
    if (isNaN(n)) {
      setInputVal(raw);
      setInputErr("Enter a number");
      return;
    }
    if (n < CUSTOM_MIN) {
      setInputVal(raw);
      setInputErr(`Minimum ${CUSTOM_MIN} credits`);
      return;
    }
    if (n > CUSTOM_MAX) {
      setInputVal(raw);
      setInputErr(`Maximum ${CUSTOM_MAX.toLocaleString()} credits`);
      return;
    }
    setInputErr("");
    setInputVal(String(n));
    setCredits(n);
  };

  return (
    <Card className="col-span-1 sm:col-span-2 lg:col-span-4 border-2 border-dashed border-[#25D366]/50 bg-gradient-to-br from-green-50 to-white shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="border-b border-green-100 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#25D366] to-green-600 flex items-center justify-center shadow-md">
              <Sparkles size={22} className="text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-gray-900">
                Custom Amount
              </CardTitle>
              <CardDescription className="text-sm text-gray-600 font-medium">
                Choose your exact credit amount
              </CardDescription>
            </div>
          </div>
          <Badge className="bg-[#25D366] text-white border-0 font-bold">
            Flexible
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* left – slider + input */}
          <div className="flex-1 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-semibold text-gray-900">Credits Amount</Label>
                <Badge variant="outline" className="text-xs font-bold text-green-700 bg-green-50 border-green-200">
                  {activeRateLabel(credits)}
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={inputVal}
                  onChange={(e) => applyValue(e.target.value)}
                  onBlur={() => applyValue(inputVal)}
                  className={`w-32 h-12 font-bold text-2xl text-center ${inputError
                      ? "border-red-300 bg-red-50 focus-visible:ring-red-200"
                      : "border-gray-300 focus-visible:ring-[#25D366]/20"
                    }`}
                />
                <span className="text-gray-500 font-semibold">credits</span>
              </div>
              {inputError && (
                <p className="text-xs text-red-600 font-semibold mt-2">{inputError}</p>
              )}
            </div>

            {/* range slider */}
            <div>
              <input
                type="range"
                min={CUSTOM_MIN}
                max={CUSTOM_MAX}
                step={10}
                value={credits}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  setCredits(n);
                  setInputVal(String(n));
                  setInputErr("");
                }}
                className="w-full accent-[#25D366] cursor-pointer h-2 rounded-lg"
              />
              <div className="flex justify-between text-xs text-gray-500 font-medium mt-2">
                <span>{CUSTOM_MIN}</span>
                <span>{CUSTOM_MAX.toLocaleString()}</span>
              </div>
            </div>

            {/* tier badges */}
            <div className="flex flex-wrap gap-2">
              {CUSTOM_RATE_TIERS.map((t) => {
                const active = credits >= t.min && credits <= t.max;
                return (
                  <Badge
                    key={t.min}
                    variant={active ? "default" : "outline"}
                    className={`text-xs px-3 py-1 font-semibold transition-all ${active
                        ? "bg-[#25D366] text-white border-[#25D366]"
                        : "bg-gray-50 border-gray-200 text-gray-500"
                      }`}
                  >
                    {t.min}–{t.max} → {t.creditsPerRupee}/₹
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* right – price summary + CTA */}
          <Card className="lg:w-72 flex flex-col justify-between bg-white border-2 border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Base Amount</span>
                  <span className="font-semibold text-gray-900">
                    ₹{basePrice.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">GST (18%)</span>
                  <span className="font-semibold text-gray-900">
                    ₹{gstAmount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="border-t-2 border-gray-300 pt-3 mt-2 flex justify-between items-center">
                  <span className="font-bold text-gray-900 text-base">Total</span>
                  <span className="font-bold text-[#25D366] text-xl">
                    ₹{total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <Button
                disabled={!!inputError || credits < CUSTOM_MIN}
                onClick={() => onBuy({
                  id: "pack_custom",
                  credits,
                  price: basePrice,
                  gstAmount,
                  totalAmount: total
                })}
                className={`w-full h-12 font-bold shadow-sm transition-all ${inputError || credits < CUSTOM_MIN
                    ? "bg-gray-200 text-gray-400 hover:bg-gray-200 cursor-not-allowed"
                    : "bg-[#25D366] hover:bg-[#20BD5A] text-white"
                  }`}
              >
                <CreditCard size={18} className="mr-2" />
                Buy {credits.toLocaleString()} Credits
              </Button>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────
export default function Credits() {
  const { user } = useAuth();
  const {
    loading,
    getCreditPacks,
    getBalance,
    getCreditHistory,
    submitCreditProof,
    getMyPurchaseRequests
  } = useCredits();

  /* state */
  const [packs, setPacks] = useState([]);
  const [balance, setBalance] = useState(user?.credits?.balance ?? 0);
  const [history, setHistory] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [myRequests, setMyRequests] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [selectedPack, setSelectedPack] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("packs");

  /* fetchers */
  const loadPacks = useCallback(async () => {
    try {
      setPacks(await getCreditPacks() || []);
    } catch (e) {
      setError(e.message || "Failed to load packs");
    }
  }, [getCreditPacks]);

  const loadBalance = useCallback(async () => {
    try {
      setBalance(await getBalance());
    } catch { }
  }, [getBalance]);

  const loadHistory = useCallback(async (page = 1) => {
    try {
      const { transactions, pagination: pg } = await getCreditHistory(page);
      setHistory(transactions);
      setPagination(pg);
    } catch (e) {
      setError(e.message || "Failed to load history");
    }
  }, [getCreditHistory]);

  const loadMyRequests = useCallback(async () => {
    try {
      setMyRequests(await getMyPurchaseRequests() || []);
    } catch { }
  }, [getMyPurchaseRequests]);

  useEffect(() => {
    loadPacks();
    loadBalance();
    loadHistory(1);
    loadMyRequests();
  }, [loadPacks, loadBalance, loadHistory, loadMyRequests]);

  useEffect(() => {
    if (activeTab === "history") loadHistory(historyPage);
    if (activeTab === "requests") loadMyRequests();
  }, [activeTab]);

  /* handlers */
  const handlePurchase = (pack) => {
    setSelectedPack(pack);
    setShowModal(true);
  };

  const handleProofSubmit = async (proofData) => {
    const submissionData = {
      ...proofData,
      ...(selectedPack.id === 'pack_custom' && { credits: selectedPack.credits }),
    };

    await submitCreditProof(submissionData);
    setShowModal(false);
    setSelectedPack(null);
    setMessage({
      type: "success",
      text: "Payment proof submitted! Credits will be added within 24 hours."
    });
    loadMyRequests();
  };

  /* status badge */
  const statusBadge = (status) => {
    if (status === "APPROVED")
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200 font-bold">
          <CheckCircle2 size={12} className="mr-1" /> Approved
        </Badge>
      );
    if (status === "REJECTED")
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200 font-bold">
          <X size={12} className="mr-1" /> Rejected
        </Badge>
      );
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200 font-bold">
        <Clock size={12} className="mr-1" /> Pending
      </Badge>
    );
  };

  /* ── RENDER ── */
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">

      {showModal && selectedPack && (
        <PaymentModal
          item={{
            name: `${selectedPack.credits.toLocaleString("en-IN")} Credits${selectedPack.id === "pack_custom" ? " (Custom)" : ""
              }`,
            subtitle: "Credit Pack Purchase",
            baseAmount: selectedPack.price,
            gstAmount: selectedPack.gstAmount,
            totalAmount: selectedPack.totalAmount,
          }}
          extraPayload={{
            packId: selectedPack.id,
            ...(selectedPack.id === "pack_custom" && {
              credits: selectedPack.credits
            }),
          }}
          onClose={() => {
            setShowModal(false);
            setSelectedPack(null);
          }}
          onSubmitProof={handleProofSubmit}
        />
      )}

      {/* ══════════════ HERO ══════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-12 text-center">
          <Badge className="inline-flex items-center gap-2 bg-white text-[#25D366] border border-[#25D366]/20 px-4 py-2 font-semibold text-sm mb-6 shadow-sm">
            <Zap size={16} className="text-[#25D366]" /> Credit Packs
          </Badge>

          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 tracking-tight leading-tight mb-4">
            Power Your
            <br />
            <span className="text-[#25D366]">Campaigns</span>
          </h1>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Top up credits anytime. No subscriptions. Pay only for what you use.
          </p>
        </div>
      </section>

      {/* ══════════════ BALANCE CARD ══════════════ */}
      <section className="max-w-7xl mx-auto px-6 pb-6">
        <Card className="bg-gradient-to-r from-[#25D366] to-green-600 border-0 shadow-xl shadow-green-200/50">
          <CardContent className="p-6 text-white flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Zap size={32} className="text-white" />
              </div>
              <div>
                <p className="text-green-100 text-sm font-semibold mb-1">Your Balance</p>
                <p className="text-4xl font-bold">
                  {balance.toLocaleString("en-IN")}{" "}
                  <span className="text-xl font-semibold text-green-100">credits</span>
                </p>
              </div>
            </div>
            <Button
              onClick={loadBalance}
              className="bg-white/20 hover:bg-white/30 text-white border border-white/30 font-semibold backdrop-blur-sm h-11"
            >
              <RefreshCw size={16} className="mr-2" /> Refresh Balance
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* ══════════════ MESSAGE BANNER ══════════════ */}
      {message.text && (
        <section className="max-w-7xl mx-auto px-6 pb-6">
          <Alert
            className={`border-2 shadow-sm flex ${message.type === "success"
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
              }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <AlertDescription
              className={`font-medium ${message.type === "success"
                  ? "text-green-700"
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

      {/* ══════════════ TAB BAR ══════════════ */}
      <section className="max-w-7xl mx-auto px-6 pb-6">
        <div className="inline-flex gap-2 bg-white border-2 border-gray-200 p-1.5 rounded-xl shadow-sm">
          {[
            { key: "packs", label: "Buy Credits", icon: Sparkles },
            { key: "history", label: "History", icon: Clock },
            { key: "requests", label: "My Requests", icon: Shield },
          ].map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={activeTab === key ? "default" : "ghost"}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === key
                  ? "bg-[#25D366] text-white hover:bg-[#25D366]"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
            >
              <Icon size={16} /> {label}
            </Button>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
            TAB: BUY CREDITS
        ═══════════════════════════════════════════════════ */}
      {activeTab === "packs" && (
        <section className="max-w-7xl mx-auto px-6 pb-20">
          {packs.length === 0 && loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={48} className="text-[#25D366] animate-spin mb-4" />
              <p className="text-gray-600 font-medium">Loading credit packs...</p>
            </div>
          ) : packs.length === 0 ? (
            <Card className="bg-white border-2 border-gray-200 shadow-sm max-w-md mx-auto rounded-2xl">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={32} className="text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">No credit packs available right now.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {packs.map((pack) => {
                  const isBestValue = pack.id === "pack_1000";
                  const perCredit = (pack.price / pack.credits).toFixed(2);

                  return (
                    <Card
                      key={pack.id}
                      className={`bg-white transition-all rounded-2xl ${isBestValue
                          ? "border-2 border-[#25D366] shadow-xl shadow-green-100"
                          : "border-2 border-gray-200 hover:border-[#25D366]/50 hover:shadow-lg"
                        }`}
                    >
                      {isBestValue && (
                        <div className="bg-[#25D366] text-white text-center py-2.5 font-semibold text-sm flex items-center justify-center gap-2 rounded-t-xl">
                          <TrendingUp size={16} /> Best Value
                        </div>
                      )}

                      <CardHeader className="pb-3 px-6 pt-6">
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-12 h-12 rounded-xl bg-green-50 border-2 border-green-200 flex items-center justify-center">
                            <Zap size={24} className="text-[#25D366]" />
                          </div>
                          <Badge variant="outline" className="text-xs font-bold text-gray-600 bg-gray-50 border-gray-200">
                            ₹{perCredit}/credit
                          </Badge>
                        </div>
                        <CardTitle className="text-3xl font-bold text-gray-900">
                          {pack.credits.toLocaleString("en-IN")}
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-600 font-medium">
                          credits
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="px-6 pb-6">
                        <div className="space-y-2 mb-5 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Base</span>
                            <span className="font-semibold text-gray-900">
                              ₹{pack.price.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">GST 18%</span>
                            <span className="font-semibold text-gray-900">
                              ₹{pack.gstAmount.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="border-t-2 border-gray-200 pt-2 mt-2 flex justify-between items-center">
                            <span className="font-bold text-gray-900 text-base">Total</span>
                            <span className="font-bold text-[#25D366] text-lg">
                              ₹{pack.totalAmount.toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>

                        <Button
                          onClick={() => handlePurchase(pack)}
                          className={`w-full h-11 font-bold shadow-sm transition-all rounded-xl ${isBestValue
                              ? "bg-[#25D366] hover:bg-[#20BD5A] text-white"
                              : "bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300"
                            }`}
                        >
                          <CreditCard size={16} className="mr-2" /> Buy Now
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Custom amount card */}
              <div className="mb-10">
                <CustomAmountCard onBuy={handlePurchase} />
              </div>

              {/* ── How Credits Work ── */}
              <Card className="bg-white border-2 border-gray-200 shadow-sm rounded-2xl">
                <CardHeader className="px-8 pt-8 pb-4 text-center">
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    How Credits Work
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <div className="grid md:grid-cols-3 gap-8">
                    {[
                      {
                        icon: Zap,
                        title: "Buy a Pack",
                        desc: "Choose a preset or custom amount, pay via UPI, upload your proof."
                      },
                      {
                        icon: Clock,
                        title: "Quick Verification",
                        desc: "Our team verifies within 24 hours and adds credits to your balance."
                      },
                      {
                        icon: ArrowUpRight,
                        title: "Send Campaigns",
                        desc: "Each message sent uses 1 credit. Monitor usage in real-time."
                      },
                    ].map(({ icon: Icon, title, desc }) => (
                      <div key={title} className="text-center">
                        <div className="w-16 h-16 mx-auto rounded-xl bg-green-50 border-2 border-green-200 flex items-center justify-center mb-4 shadow-sm">
                          <Icon size={28} className="text-[#25D366]" />
                        </div>
                        <h3 className="font-semibold text-gray-900 text-base mb-2">{title}</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════
            TAB: HISTORY
        ═══════════════════════════════════════════════════ */}
      {activeTab === "history" && (
        <section className="max-w-7xl mx-auto px-6 pb-20">
          <Card className="bg-white border-2 border-gray-200 shadow-sm rounded-2xl">
            <CardHeader className="px-8 py-6 border-b-2 border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Clock size={24} className="text-[#25D366]" />
                    Transaction History
                  </CardTitle>
                  <CardDescription className="text-gray-600 mt-1 font-medium">
                    {pagination.total} total transactions
                  </CardDescription>
                </div>
                <Button
                  onClick={() => loadHistory(historyPage)}
                  variant="outline"
                  className="border-2 border-gray-300 hover:border-[#25D366] font-medium h-11 rounded-xl"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-8">
              {history.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Clock size={40} className="text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium text-lg mb-2">No transactions yet</p>
                  <p className="text-gray-500 text-sm">Your transaction history will appear here</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto border-2 border-gray-200 rounded-xl">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b-2 border-gray-200">
                          {["Type", "Amount", "Balance After", "Note", "Date"].map((h) => (
                            <th
                              key={h}
                              className="text-left py-4 px-6 text-xs font-bold text-gray-700 uppercase tracking-wider"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {history.map((txn) => {
                          const meta = getTxnMeta(txn.type);
                          const Icon = meta.icon;
                          const isCredit = ["PURCHASE", "PLAN_REFILL", "ADMIN_ADJUST"].includes(txn.type);

                          return (
                            <tr
                              key={txn._id}
                              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                            >
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${meta.bg}`}>
                                    <Icon size={18} className={meta.color} />
                                  </div>
                                  <span className="font-semibold text-gray-900">{meta.label}</span>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <span className={`font-bold ${isCredit ? "text-green-600" : "text-red-500"}`}>
                                  {isCredit ? "+" : "−"}{Math.abs(txn.amount).toLocaleString("en-IN")}
                                </span>
                              </td>
                              <td className="py-4 px-6 font-semibold text-gray-900">
                                {txn.balanceAfter?.toLocaleString("en-IN")}
                              </td>
                              <td className="py-4 px-6 text-gray-600 text-xs max-w-xs truncate">
                                {txn.meta?.note || "—"}
                              </td>
                              <td className="py-4 px-6 text-gray-500 text-xs whitespace-nowrap font-medium">
                                {fmtDate(txn.createdAt)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-8">
                      <Button
                        variant="outline"
                        disabled={historyPage <= 1}
                        onClick={() => {
                          const p = historyPage - 1;
                          setHistoryPage(p);
                          loadHistory(p);
                        }}
                        className="border-2 border-gray-300 text-gray-700 hover:border-[#25D366] disabled:opacity-40 font-medium h-11 rounded-xl"
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-gray-600 font-semibold">
                        Page {historyPage} of {pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        disabled={historyPage >= pagination.totalPages}
                        onClick={() => {
                          const p = historyPage + 1;
                          setHistoryPage(p);
                          loadHistory(p);
                        }}
                        className="border-2 border-gray-300 text-gray-700 hover:border-[#25D366] disabled:opacity-40 font-medium h-11 rounded-xl"
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════
            TAB: MY REQUESTS
        ═══════════════════════════════════════════════════ */}
      {activeTab === "requests" && (
        <section className="max-w-7xl mx-auto px-6 pb-20">
          <Card className="bg-white border-2 border-gray-200 shadow-sm rounded-2xl">
            <CardHeader className="px-8 py-6 border-b-2 border-gray-200">
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Shield size={24} className="text-[#25D366]" />
                My Purchase Requests
              </CardTitle>
              <CardDescription className="text-gray-600 mt-1 font-medium">
                Track the status of your UPI payments
              </CardDescription>
            </CardHeader>

            <CardContent className="p-8">
              {myRequests.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Shield size={40} className="text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium text-lg mb-2">No purchase requests yet</p>
                  <p className="text-gray-500 text-sm mb-6">Buy credits to see your payment requests here</p>
                  <Button
                    onClick={() => setActiveTab("packs")}
                    className="bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold shadow-sm h-11 rounded-xl"
                  >
                    <CreditCard size={16} className="mr-2" /> Buy Credits
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto border-2 border-gray-200 rounded-xl">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b-2 border-gray-200">
                        {["Credits", "Amount", "Transaction ID", "Status", "Date"].map((h) => (
                          <th
                            key={h}
                            className="text-left py-4 px-6 text-xs font-bold text-gray-700 uppercase tracking-wider"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {myRequests.map((req) => (
                        <tr
                          key={req._id}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-green-50 border-2 border-green-200 flex items-center justify-center">
                                <Zap size={18} className="text-[#25D366]" />
                              </div>
                              <span className="font-semibold text-gray-900">
                                {req.packCredits?.toLocaleString("en-IN")} credits
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-semibold text-gray-900">
                            ₹{req.amount?.toLocaleString("en-IN")}
                          </td>
                          <td className="py-4 px-6 font-mono text-xs text-gray-600">
                            {req.transactionId}
                          </td>
                          <td className="py-4 px-6">{statusBadge(req.status)}</td>
                          <td className="py-4 px-6 text-gray-500 text-xs whitespace-nowrap font-medium">
                            {fmtDate(req.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}