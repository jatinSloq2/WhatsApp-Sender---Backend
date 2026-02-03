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
  Upload,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useCredits } from "../context/CreditContext";
import { PaymentModal } from "../components/PaymentModal";   // ← shared modal

// ─────────────────────────────────────────────────────
// CUSTOM AMOUNT – tiered pricing helpers
// ─────────────────────────────────────────────────────
const CUSTOM_RATE_TIERS = [
  { min: 1, max: 100, rate: 0.99 },
  { min: 101, max: 500, rate: 0.80 },
  { min: 501, max: 1000, rate: 0.70 },
  { min: 1001, max: 10000, rate: 0.50 },
];
const CUSTOM_MIN = 50;
const CUSTOM_MAX = 10000;

function calcCustomPrice(credits) {
  let total = 0, remaining = credits;
  for (const tier of CUSTOM_RATE_TIERS) {
    if (remaining <= 0) break;
    const chunkStart = Math.max(credits - remaining, tier.min - 1);
    const chunkInTier = Math.min(remaining, tier.max - chunkStart);
    if (chunkInTier > 0) { total += chunkInTier * tier.rate; remaining -= chunkInTier; }
  }
  return Math.round(total);
}

function activeRateLabel(credits) {
  for (let i = CUSTOM_RATE_TIERS.length - 1; i >= 0; i--) {
    if (credits >= CUSTOM_RATE_TIERS[i].min) return `₹${CUSTOM_RATE_TIERS[i].rate}/credit`;
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
    <div className="col-span-1 sm:col-span-2 lg:col-span-4 bg-white border-2 border-dashed border-green-400 rounded-2xl shadow-sm">
      {/* header strip */}
      <div className="bg-gradient-to-r from-green-50 to-teal-50 border-b-2 border-green-200 rounded-t-2xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-green-600 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-800 text-sm">Pick Your Own Amount</p>
            <p className="text-xs text-gray-500">Rate drops automatically as you buy more</p>
          </div>
        </div>
        <span className="text-xs font-bold text-teal-700 bg-teal-100 border border-teal-300 px-3 py-1 rounded-full">Custom</span>
      </div>

      <div className="p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* left – slider + input */}
          <div className="flex-1 space-y-4">
            {/* number input row */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">Credits</label>
                <span className="text-xs font-bold text-green-700 bg-green-100 border border-green-300 px-2.5 py-0.5 rounded-full">
                  {activeRateLabel(credits)} marginal
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  inputMode="numeric"
                  value={inputVal}
                  onChange={(e) => applyValue(e.target.value)}
                  onBlur={() => applyValue(inputVal)}
                  className={`w-28 px-3 py-2 rounded-xl border-2 font-black text-xl text-center focus:outline-none transition-all ${inputError ? "border-red-300 bg-red-50" : "border-gray-300 focus:border-green-600 focus:ring-2 focus:ring-green-200"
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
                  <span
                    key={t.min}
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold border transition-all ${active
                        ? "bg-green-100 border-green-300 text-green-700"
                        : "bg-gray-50 border-gray-200 text-gray-400"
                      }`}
                  >
                    {t.min}–{t.max.toLocaleString()} → ₹{t.rate}
                  </span>
                );
              })}
            </div>
          </div>

          {/* right – price summary + CTA */}
          <div className="sm:w-52 flex flex-col justify-between bg-gray-50 border-2 border-gray-300 rounded-2xl p-5">
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

            <button
              disabled={!!inputError || credits < CUSTOM_MIN}
              onClick={() =>
                onBuy({
                  id: "pack_custom", credits,
                  price: basePrice, gstAmount, totalAmount: total,
                })
              }
              className={`w-full mt-5 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all shadow-md ${inputError || credits < CUSTOM_MIN
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                  : "bg-green-600 hover:bg-green-700 text-white shadow-green-200"
                }`}
            >
              <CreditCard size={16} /> Buy {credits.toLocaleString()} Credits
            </button>
          </div>
        </div>
      </div>
    </div>
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
      return <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 border border-green-300 px-2.5 py-1 rounded-full"><CheckCircle2 size={12} /> Approved</span>;
    if (status === "REJECTED")
      return <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 border border-red-300 px-2.5 py-1 rounded-full"><X size={12} /> Rejected</span>;
    return <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-full"><Clock size={12} /> Pending</span>;
  };

  /* ── RENDER ── */
  return (
    <div className="min-h-[calc(100vh-64px)] mx-auto">

      {/* ── shared PaymentModal ── */}
      {showModal && selectedPack && (
        <PaymentModal
          item={{
            name: `${selectedPack.credits.toLocaleString("en-IN")} Credits${selectedPack.id === "pack_custom" ? " (Custom)" : ""}`,
            subtitle: `Credit Pack Purchase`,
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
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-teal-50">
        {/* decorative blobs – same as Home hero */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-green-200 rounded-full blur-3xl opacity-20 -z-10" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-200 rounded-full blur-3xl opacity-20 -z-10" />

        <div className="max-w-6xl mx-auto px-6 pt-20 pb-14 text-center">
          {/* badge */}
          <span className="inline-flex items-center gap-2 text-sm font-bold text-green-700 bg-green-100 border-2 border-green-300 px-4 py-2 rounded-full shadow-sm mb-6">
            <Zap size={16} className="text-green-600" /> Buy Credits
          </span>

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
        <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-6 text-white shadow-xl shadow-green-200/40 flex flex-wrap items-center justify-between gap-4">
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
          <button
            onClick={loadBalance}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-white/30 text-white font-semibold text-sm hover:bg-white/10 transition-all"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </section>

      {/* ══════════════ MESSAGE BANNER ══════════════ */}
      {message.text && (
        <section className="max-w-6xl mx-auto px-6 pb-3">
          <div className={`flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-semibold border-2 shadow-sm ${message.type === "success" ? "bg-green-50 text-green-700 border-green-300" : "bg-red-50 text-red-700 border-red-300"
            }`}>
            {message.type === "success" ? <Check size={18} /> : <AlertCircle size={18} />}
            <span>{message.text}</span>
            <button onClick={() => setMessage({ type: "", text: "" })} className="ml-auto"><X size={16} /></button>
          </div>
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
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === key ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
            TAB: BUY CREDITS (packs)
        ═══════════════════════════════════════════════════ */}
      {activeTab === "packs" && (
        <section className="max-w-6xl mx-auto px-6 pb-24">
          {packs.length === 0 && loading ? (
            <div className="flex justify-center py-20"><Loader2 size={36} className="text-green-600 animate-spin" /></div>
          ) : packs.length === 0 ? (
            <div className="bg-white border-2 border-gray-300 rounded-2xl p-12 text-center max-w-md mx-auto shadow-sm">
              <AlertCircle size={40} className="text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No credit packs available right now.</p>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {packs.map((pack) => {
                  const isBestValue = pack.id === "pack_1000";
                  const perCredit = (pack.price / pack.credits).toFixed(2);

                  return (
                    <div
                      key={pack.id}
                      className={`relative bg-white rounded-2xl transition-all duration-300 ${isBestValue
                          ? "border-4 border-green-600 shadow-xl shadow-green-200 scale-[1.04]"
                          : "border-2 border-gray-300 hover:border-green-600 hover:shadow-lg"
                        }`}
                    >
                      {/* Best Value badge */}
                      {isBestValue && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                          <span className="inline-flex items-center gap-1.5 px-4 py-1 bg-gradient-to-r from-green-600 to-teal-600 text-white text-xs font-black rounded-full shadow-lg">
                            <TrendingUp size={13} /> Best Value
                          </span>
                        </div>
                      )}

                      <div className="p-6">
                        {/* icon row */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-teal-100 border-2 border-green-300 rounded-xl flex items-center justify-center">
                            <Zap size={22} className="text-green-600" />
                          </div>
                          <span className="text-xs font-bold text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full">
                            ₹{perCredit}/credit
                          </span>
                        </div>

                        {/* credits count */}
                        <p className="text-3xl font-black text-black">{pack.credits.toLocaleString("en-IN")}</p>
                        <p className="text-sm text-gray-500 font-medium mb-4">credits</p>

                        {/* price breakdown */}
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

                        {/* CTA */}
                        <button
                          onClick={() => handlePurchase(pack)}
                          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all shadow-md ${isBestValue
                              ? "bg-green-600 hover:bg-green-700 text-white shadow-green-200"
                              : "bg-white hover:bg-gray-50 text-black border-2 border-gray-300"
                            }`}
                        >
                          <CreditCard size={16} /> Buy Now
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Custom amount card – full width */}
                <CustomAmountCard onBuy={handlePurchase} />
              </div>

              {/* ── How Credits Work ── */}
              <div className="mt-10 bg-gradient-to-br from-green-50 to-teal-50 border-2 border-green-300 rounded-2xl p-8">
                <h3 className="font-bold text-gray-800 text-base flex items-center gap-2 mb-6">
                  <Sparkles size={18} className="text-green-600" /> How Credits Work
                </h3>
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
              </div>
            </>
          )}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════
            TAB: HISTORY
        ═══════════════════════════════════════════════════ */}
      {activeTab === "history" && (
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <div className="bg-white border-2 border-gray-300 rounded-2xl shadow-sm overflow-hidden">
            {/* card header */}
            <div className="px-6 py-5 border-b-2 border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-black">Transaction History</h3>
                <p className="text-sm text-gray-500">{pagination.total} total transactions</p>
              </div>
            </div>

            <div className="p-6">
              {history.length === 0 ? (
                <div className="text-center py-14">
                  <Clock size={38} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No transactions yet</p>
                </div>
              ) : (
                <>
                  {/* table */}
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
                      <button
                        disabled={historyPage <= 1}
                        onClick={() => { const p = historyPage - 1; setHistoryPage(p); loadHistory(p); }}
                        className="px-4 py-2 rounded-xl text-sm font-semibold border-2 border-gray-300 text-gray-700 hover:border-green-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >Previous</button>
                      <span className="text-sm text-gray-600 font-semibold">{historyPage} / {pagination.totalPages}</span>
                      <button
                        disabled={historyPage >= pagination.totalPages}
                        onClick={() => { const p = historyPage + 1; setHistoryPage(p); loadHistory(p); }}
                        className="px-4 py-2 rounded-xl text-sm font-semibold border-2 border-gray-300 text-gray-700 hover:border-green-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >Next</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════
            TAB: MY REQUESTS
        ═══════════════════════════════════════════════════ */}
      {activeTab === "requests" && (
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <div className="bg-white border-2 border-gray-300 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b-2 border-gray-200">
              <h3 className="text-xl font-bold text-black">My Purchase Requests</h3>
              <p className="text-sm text-gray-500">Track the status of your UPI payments</p>
            </div>

            <div className="p-6">
              {myRequests.length === 0 ? (
                <div className="text-center py-14">
                  <Shield size={38} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm mb-4">No purchase requests yet</p>
                  <button
                    onClick={() => setActiveTab("packs")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-green-200 transition-all"
                  >
                    <CreditCard size={15} /> Buy Credits
                  </button>
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
            </div>
          </div>
        </section>
      )}
    </div>
  );
}