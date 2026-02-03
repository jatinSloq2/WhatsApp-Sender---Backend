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
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  RefreshCw,
  Shield,
  Sparkles,
  TrendingUp,
  X,
  Zap,
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
    if (credits >= CUSTOM_RATE_TIERS[i].min) return `${CUSTOM_RATE_TIERS[i].creditsPerRupee} credits / ₹1`;
  }
  return "";
}

// ─────────────────────────────────────────────────────
// TRANSACTION META
// ─────────────────────────────────────────────────────
const TXN_META = {
  PURCHASE: { icon: ArrowUpRight, color: "text-green-600", bg: "bg-green-50", label: "Purchase" },
  PLAN_REFILL: { icon: RefreshCw, color: "text-blue-600", bg: "bg-blue-50", label: "Plan Refill" },
  CAMPAIGN_SEND: { icon: ArrowDownLeft, color: "text-red-500", bg: "bg-red-50", label: "Campaign" },
  ADMIN_ADJUST: { icon: Shield, color: "text-gray-600", bg: "bg-gray-100", label: "Adjustment" },
};
const getTxnMeta = (type) => TXN_META[type] || TXN_META.ADMIN_ADJUST;

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
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
    if (isNaN(n)) { setInputVal(raw); setInputErr("Enter a number"); return; }
    if (n < CUSTOM_MIN) { setInputVal(raw); setInputErr(`Minimum ${CUSTOM_MIN} credits`); return; }
    if (n > CUSTOM_MAX) { setInputVal(raw); setInputErr(`Maximum ${CUSTOM_MAX.toLocaleString()} credits`); return; }
    setInputErr(""); setInputVal(String(n)); setCredits(n);
  };

  return (
    <Card className="col-span-1 sm:col-span-2 lg:col-span-4 border-2 border-dashed border-green-400 rounded-2xl shadow-sm bg-white mt-10">
      <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50 border-b-2 border-green-200 rounded-t-2xl px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-green-600 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-gray-800">Pick Your Own Amount</CardTitle>
              <CardDescription className="text-xs text-gray-500">Rate drops automatically as you buy more</CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs font-bold text-teal-700 bg-teal-100 border border-teal-300">Custom</Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* left – slider + input */}
          <div className="flex-1 space-y-4">

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold text-gray-700">Credits</Label>
                <Badge variant="outline" className="text-xs font-bold text-green-700 bg-green-100 border-green-300">
                  {activeRateLabel(credits)} marginal
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={inputVal}
                  onChange={(e) => applyValue(e.target.value)}
                  onBlur={() => applyValue(inputVal)}
                  className={`w-28 font-black text-xl text-center border-2 rounded-xl focus-visible:ring-offset-0 ${inputError
                    ? "border-red-300 bg-red-50 focus-visible:border-red-300 focus-visible:ring-red-200"
                    : "border-gray-300 focus-visible:border-green-600 focus-visible:ring-green-200"
                    }`}
                />
                <span className="text-gray-400 font-semibold text-sm">credits</span>
              </div>
              {inputError && <p className="text-xs text-red-500 font-semibold mt-1">{inputError}</p>}
            </div>

            {/* range slider */}
            <div>
              <input
                type="range" min={CUSTOM_MIN} max={CUSTOM_MAX} step={10} value={credits}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  setCredits(n); setInputVal(String(n)); setInputErr("");
                }}
                className="w-full accent-green-600 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
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
                    variant={active ? "secondary" : "outline"}
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-all ${active
                      ? "bg-green-100 border-green-300 text-green-700"
                      : "bg-gray-50 border-gray-200 text-gray-400"
                      }`}
                  >
                    {t.min}–{t.max} → {t.creditsPerRupee} credits / ₹1
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* right – price summary + CTA */}
          <Card className="sm:w-52 flex flex-col justify-between bg-gray-50 border-2 border-gray-300 rounded-2xl shadow-none">
            <CardContent className="p-5">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Base</span>
                  <span className="font-semibold text-gray-700">₹{basePrice.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">GST 18%</span>
                  <span className="font-semibold text-gray-700">₹{gstAmount.toLocaleString("en-IN")}</span>
                </div>
                <div className="border-t-2 border-gray-300 pt-2 mt-1 flex justify-between text-base">
                  <span className="font-black text-gray-800">Total</span>
                  <span className="font-black text-green-600">₹{total.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <Button
                disabled={!!inputError || credits < CUSTOM_MIN}
                onClick={() => onBuy({ id: "pack_custom", credits, price: basePrice, gstAmount, totalAmount: total })}
                className={`w-full mt-5 rounded-xl font-bold text-sm shadow-md transition-all ${inputError || credits < CUSTOM_MIN
                  ? "bg-gray-200 text-gray-400 hover:bg-gray-200 shadow-none cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white shadow-green-200"
                  }`}
              >
                <CreditCard size={16} className="mr-2" /> Buy {credits.toLocaleString()} Credits
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
  const { loading, getCreditPacks, getBalance, getCreditHistory, submitCreditProof, getMyPurchaseRequests } = useCredits();

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
    try { setPacks(await getCreditPacks() || []); }
    catch (e) { setError(e.message || "Failed to load packs"); }
  }, [getCreditPacks]);

  const loadBalance = useCallback(async () => {
    try { setBalance(await getBalance()); } catch { }
  }, [getBalance]);

  const loadHistory = useCallback(async (page = 1) => {
    try {
      const { transactions, pagination: pg } = await getCreditHistory(page);
      setHistory(transactions); setPagination(pg);
    } catch (e) { setError(e.message || "Failed to load history"); }
  }, [getCreditHistory]);

  const loadMyRequests = useCallback(async () => {
    try { setMyRequests(await getMyPurchaseRequests() || []); } catch { }
  }, [getMyPurchaseRequests]);

  useEffect(() => { loadPacks(); loadBalance(); loadHistory(1); loadMyRequests(); },
    [loadPacks, loadBalance, loadHistory, loadMyRequests]);

  useEffect(() => {
    if (activeTab === "history") loadHistory(historyPage);
    if (activeTab === "requests") loadMyRequests();
  }, [activeTab]);

  /* handlers */
  const handlePurchase = (pack) => { setSelectedPack(pack); setShowModal(true); };

  const handleProofSubmit = async (proofData) => {
    await submitCreditProof(proofData);
    setShowModal(false); setSelectedPack(null);
    setMessage({ type: "success", text: "Payment proof submitted! Credits will be added within 24 hours." });
    loadMyRequests();
  };

  /* status badge */
  const statusBadge = (status) => {
    if (status === "APPROVED")
      return <Badge variant="secondary" className="text-xs font-bold text-green-700 bg-green-100 border border-green-300"><CheckCircle2 size={12} className="mr-1" /> Approved</Badge>;
    if (status === "REJECTED")
      return <Badge variant="destructive" className="text-xs font-bold text-red-700 bg-red-100 border border-red-300"><X size={12} className="mr-1" /> Rejected</Badge>;
    return <Badge variant="outline" className="text-xs font-bold text-amber-700 bg-amber-100 border border-amber-300"><Clock size={12} className="mr-1" /> Pending</Badge>;
  };

  /* ── RENDER ── */
  return (
    <div className="min-h-[calc(100vh-64px)] mx-auto">

      {/* ── shared PaymentModal ── */}
      {showModal && selectedPack && (
        <PaymentModal
          item={{
            name: `${selectedPack.credits.toLocaleString("en-IN")} Credits${selectedPack.id === "pack_custom" ? " (Custom)" : ""}`,
            subtitle: "Credit Pack Purchase",
            baseAmount: selectedPack.price,
            gstAmount: selectedPack.gstAmount,
            totalAmount: selectedPack.totalAmount,
          }}
          extraPayload={{
            packId: selectedPack.id,
            ...(selectedPack.id === "pack_custom" && { credits: selectedPack.credits }),
          }}
          onClose={() => { setShowModal(false); setSelectedPack(null); }}
          onSubmitProof={handleProofSubmit}
        />
      )}

      {/* ══════════════ HERO ══════════════ */}
      <section className="relative overflow-hidden ">
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-14 text-center">
          <Badge variant="secondary" className="inline-flex items-center gap-2 bg-green-100 text-green-700 border-2 border-green-300 px-4 py-2 rounded-full font-semibold text-sm shadow-sm mb-6">
            <Zap size={16} className="text-green-600" /> Buy Credits
          </Badge>

          <h1 className="text-5xl sm:text-6xl font-black text-black tracking-tight leading-tight mb-4">
            Power your{" "}
            <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">campaigns</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Credits fuel every message you send. Top up anytime — no subscriptions needed.
          </p>
        </div>
      </section>

      {/* ══════════════ BALANCE CARD ══════════════ */}
      <section className="max-w-6xl mx-auto px-6 pt-6 pb-4">
        <Card className="bg-gradient-to-r from-green-600 to-teal-600 border-0 rounded-2xl shadow-xl shadow-green-200/40">
          <CardContent className="p-6 text-white flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <Zap size={28} className="text-white" />
              </div>
              <div>
                <p className="text-green-100 text-sm font-semibold">Your Balance</p>
                <p className="text-4xl font-black">
                  {balance.toLocaleString("en-IN")} <span className="text-xl font-semibold text-green-200">credits</span>
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={loadBalance}
              className="border-2 border-white/30 text-white bg-transparent hover:bg-white/10 hover:text-white rounded-xl font-semibold text-sm"
            >
              <RefreshCw size={16} className="mr-2" /> Refresh
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* ══════════════ MESSAGE BANNER ══════════════ */}
      {message.text && (
        <section className="max-w-6xl mx-auto px-6 pb-3">
          <Alert variant={message.type === "success" ? "default" : "destructive"} className={`rounded-xl border-2 shadow-sm ${message.type === "success" ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"
            }`}>
            {message.type === "success" ? <Check size={18} className="text-green-600" /> : <AlertCircle size={18} className="text-red-500" />}
            <AlertDescription className={`font-semibold ${message.type === "success" ? "text-green-700" : "text-red-700"}`}>
              {message.text}
            </AlertDescription>
            <Button variant="ghost" size="sm" onClick={() => setMessage({ type: "", text: "" })} className="ml-auto p-0 h-auto hover:bg-transparent">
              <X size={16} />
            </Button>
          </Alert>
        </section>
      )}

      {/* ══════════════ TAB BAR ══════════════ */}
      <section className="max-w-6xl mx-auto px-6 pb-4 pt-2">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {[
            { key: "packs", label: "Buy Credits", icon: Sparkles },
            { key: "history", label: "History", icon: Clock },
            { key: "requests", label: "My Requests", icon: Shield },
          ].map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={activeTab === key ? "default" : "ghost"}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === key
                ? "bg-white text-gray-800 shadow-sm hover:bg-white"
                : "text-gray-500 hover:text-gray-700 hover:bg-transparent"
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
        <section className="max-w-6xl mx-auto px-6 pb-24">
          {packs.length === 0 && loading ? (
            <div className="flex justify-center py-20"><Loader2 size={36} className="text-green-600 animate-spin" /></div>
          ) : packs.length === 0 ? (
            <Card className="bg-white border-2 border-gray-300 rounded-2xl shadow-sm max-w-md mx-auto">
              <CardContent className="p-12 text-center">
                <AlertCircle size={40} className="text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No credit packs available right now.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {packs.map((pack) => {
                  const isBestValue = pack.id === "pack_1000";
                  const perCredit = (pack.price / pack.credits).toFixed(2);

                  return (
                    <Card
                      key={pack.id}
                      className={`relative bg-white rounded-2xl transition-all duration-300 ${isBestValue
                        ? "border-4 border-green-600 shadow-xl shadow-green-200 scale-[1.04]"
                        : "border-2 border-gray-300 hover:border-green-600 hover:shadow-lg"
                        }`}
                    >
                      {isBestValue && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                          <Badge className="inline-flex items-center gap-1.5 px-4 py-1 bg-gradient-to-r from-green-600 to-teal-600 text-white text-xs font-black rounded-full shadow-lg border-0">
                            <TrendingUp size={13} /> Best Value
                          </Badge>
                        </div>
                      )}

                      <CardHeader className="pb-2 px-6 pt-6">
                        <div className="flex items-center justify-between">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-teal-100 border-2 border-green-300 rounded-xl flex items-center justify-center">
                            <Zap size={22} className="text-green-600" />
                          </div>
                          <Badge variant="outline" className="text-xs font-bold text-gray-500 bg-gray-100 border-gray-200">
                            ₹{perCredit}/credit
                          </Badge>
                        </div>
                        <CardTitle className="text-3xl font-black text-black mt-3">{pack.credits.toLocaleString("en-IN")}</CardTitle>
                        <CardDescription className="text-sm text-gray-500">credits</CardDescription>
                      </CardHeader>

                      <CardContent className="px-6 pb-6">
                        <div className="space-y-1.5 mb-5">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Base</span>
                            <span className="font-semibold text-gray-700">₹{pack.price.toLocaleString("en-IN")}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">GST 18%</span>
                            <span className="font-semibold text-gray-700">₹{pack.gstAmount.toLocaleString("en-IN")}</span>
                          </div>
                          <div className="border-t-2 border-gray-200 pt-1.5 mt-1.5 flex justify-between text-base">
                            <span className="font-black text-gray-800">Total</span>
                            <span className="font-black text-green-600">₹{pack.totalAmount.toLocaleString("en-IN")}</span>
                          </div>
                        </div>

                        <Button
                          onClick={() => handlePurchase(pack)}
                          className={`w-full rounded-xl font-bold text-sm shadow-md transition-all ${isBestValue
                            ? "bg-green-600 hover:bg-green-700 text-white shadow-green-200"
                            : "bg-white hover:bg-gray-50 text-black border-2 border-gray-300"
                            }`}
                        >
                          <CreditCard size={16} className="mr-2" /> Buy Now
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Custom amount card – full width */}
                <CustomAmountCard onBuy={handlePurchase} />
              </div>

              {/* ── How Credits Work ── */}
              <Card className="mt-10 bg-gradient-to-br from-green-50 to-teal-50 border-2 border-green-300 rounded-2xl shadow-none">
                <CardHeader className="px-8 pt-8 pb-2">
                  <CardTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <Sparkles size={18} className="text-green-600" /> How Credits Work
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <div className="grid md:grid-cols-3 gap-6">
                    {[
                      { icon: Zap, title: "Buy a Pack", desc: "Choose a preset or custom amount, pay via UPI, upload your proof." },
                      { icon: Clock, title: "Quick Verification", desc: "Our team verifies within 24 hours and adds credits to your balance." },
                      { icon: ArrowUpRight, title: "Send Campaigns", desc: "Each message sent uses 1 credit. Monitor usage in real-time." },
                    ].map(({ icon: Icon, title, desc }) => (
                      <div key={title} className="flex gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl border-2 border-green-200 flex items-center justify-center shadow-sm flex-shrink-0">
                          <Icon size={18} className="text-green-600" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 text-sm">{title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                        </div>
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
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <Card className="bg-white border-2 border-gray-300 rounded-2xl shadow-sm">
            <CardHeader className="px-6 py-5 border-b-2 border-gray-200">
              <CardTitle className="text-xl font-bold text-black">Transaction History</CardTitle>
              <CardDescription className="text-sm text-gray-500">{pagination.total} total transactions</CardDescription>
            </CardHeader>

            <CardContent className="p-6">
              {history.length === 0 ? (
                <div className="text-center py-14">
                  <Clock size={38} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No transactions yet</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          {["Type", "Amount", "Balance After", "Note", "Date"].map((h) => (
                            <th key={h} className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((txn) => {
                          const meta = getTxnMeta(txn.type);
                          const Icon = meta.icon;
                          const isCredit = ["PURCHASE", "PLAN_REFILL", "ADMIN_ADJUST"].includes(txn.type);

                          return (
                            <tr key={txn._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${meta.bg}`}>
                                    <Icon size={16} className={meta.color} />
                                  </div>
                                  <span className="font-semibold text-gray-800">{meta.label}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`font-bold ${isCredit ? "text-green-600" : "text-red-500"}`}>
                                  {isCredit ? "+" : "−"}{Math.abs(txn.amount).toLocaleString("en-IN")}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-semibold text-gray-800">{txn.balanceAfter?.toLocaleString("en-IN")}</td>
                              <td className="py-3 px-4 text-gray-500 text-xs max-w-xs truncate">{txn.meta?.note || "—"}</td>
                              <td className="py-3 px-4 text-gray-400 text-xs whitespace-nowrap">{fmtDate(txn.createdAt)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-6">
                      <Button
                        variant="outline"
                        disabled={historyPage <= 1}
                        onClick={() => { const p = historyPage - 1; setHistoryPage(p); loadHistory(p); }}
                        className="rounded-xl border-2 border-gray-300 text-gray-700 hover:border-green-600 disabled:opacity-40"
                      >Previous</Button>
                      <span className="text-sm text-gray-600 font-semibold">{historyPage} / {pagination.totalPages}</span>
                      <Button
                        variant="outline"
                        disabled={historyPage >= pagination.totalPages}
                        onClick={() => { const p = historyPage + 1; setHistoryPage(p); loadHistory(p); }}
                        className="rounded-xl border-2 border-gray-300 text-gray-700 hover:border-green-600 disabled:opacity-40"
                      >Next</Button>
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
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <Card className="bg-white border-2 border-gray-300 rounded-2xl shadow-sm">
            <CardHeader className="px-6 py-5 border-b-2 border-gray-200">
              <CardTitle className="text-xl font-bold text-black">My Purchase Requests</CardTitle>
              <CardDescription className="text-sm text-gray-500">Track the status of your UPI payments</CardDescription>
            </CardHeader>

            <CardContent className="p-6">
              {myRequests.length === 0 ? (
                <div className="text-center py-14">
                  <Shield size={38} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm mb-4">No purchase requests yet</p>
                  <Button
                    onClick={() => setActiveTab("packs")}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-green-200"
                  >
                    <CreditCard size={15} className="mr-2" /> Buy Credits
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        {["Credits", "Amount", "Txn ID", "Status", "Date"].map((h) => (
                          <th key={h} className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {myRequests.map((req) => (
                        <tr key={req._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center">
                                <Zap size={16} className="text-green-600" />
                              </div>
                              <span className="font-semibold text-gray-800">{req.packCredits?.toLocaleString("en-IN")} credits</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-semibold text-gray-800">₹{req.amount?.toLocaleString("en-IN")}</td>
                          <td className="py-3 px-4 font-mono text-xs text-gray-500">{req.transactionId}</td>
                          <td className="py-3 px-4">{statusBadge(req.status)}</td>
                          <td className="py-3 px-4 text-gray-400 text-xs whitespace-nowrap">{fmtDate(req.createdAt)}</td>
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