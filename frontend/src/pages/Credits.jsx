import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Loader2,
  QrCode,
  RefreshCw,
  Shield,
  Sparkles,
  TrendingUp,
  Upload,
  X,
  Zap
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCredits } from '../context/CreditContext';

// ─── shadcn-style primitives (drop-in, no extra deps) ─
// These mirror the shadcn/ui API so you can swap real
// shadcn later by just removing these definitions.

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

const Card = ({ className, children, ...props }) => (
  <div className={cn('bg-white rounded-xl border border-slate-200 shadow-sm', className)} {...props}>
    {children}
  </div>
);

const CardHeader = ({ className, children }) => (
  <div className={cn('p-6 pb-2', className)}>{children}</div>
);

const CardContent = ({ className, children }) => (
  <div className={cn('p-6 pt-0', className)}>{children}</div>
);

const CardTitle = ({ className, children }) => (
  <h3 className={cn('text-lg font-semibold text-slate-900', className)}>{children}</h3>
);

const CardDescription = ({ className, children }) => (
  <p className={cn('text-sm text-slate-500 mt-1', className)}>{children}</p>
);

const Badge = ({ className, variant = 'default', children }) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
    secondary: 'bg-slate-100 text-slate-600',
  };
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full', variants[variant], className)}>
      {children}
    </span>
  );
};

const Button = ({ className, variant = 'default', size = 'md', disabled, children, ...props }) => {
  const variants = {
    default: 'bg-slate-900 hover:bg-slate-800 text-white',
    primary: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-200',
    outline: 'border-2 border-slate-200 bg-white hover:border-slate-300 text-slate-900',
    ghost: 'hover:bg-slate-100 text-slate-700',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  return (
    <button
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all shadow-sm',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

const Table = ({ children }) => (
  <div className="w-full overflow-x-auto rounded-lg border border-slate-200">
    <table className="w-full text-sm">{children}</table>
  </div>
);

const TableHead = ({ children }) => (
  <thead className="bg-slate-50 border-b border-slate-200">{children}</thead>
);

const TableBody = ({ children }) => <tbody>{children}</tbody>;

const TableRow = ({ className, children }) => (
  <tr className={cn('border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors', className)}>
    {children}
  </tr>
);

const TableHeader = ({ className, children }) => (
  <th className={cn('px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider', className)}>
    {children}
  </th>
);

const TableCell = ({ className, children }) => (
  <td className={cn('px-4 py-3 text-slate-700', className)}>{children}</td>
);

// ─────────────────────────────────────────────────────
// PAYMENT MODAL (mirrors PaymentModal from Plans.jsx)
// ─────────────────────────────────────────────────────
function CreditPaymentModal({ pack, onClose, onSubmitProof }) {
  const UPI_ID = '7240440461@ybl';

  const [copied, setCopied] = useState(false);
  const [paymentProof, setProof] = useState(null);
  const [transactionId, setTxnId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [errorMessage, setError] = useState('');

  const baseAmount = pack.price;
  const gstAmount = pack.gstAmount;
  const totalAmount = pack.totalAmount;

  const upiLink = `upi://pay?pa=${UPI_ID}&pn=YourBusinessName&am=${totalAmount}&cu=INR&tn=Credits ${pack.credits}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiLink)}`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('File must be < 5 MB'); return; }
    if (!file.type.startsWith('image/')) { setError('Only image files allowed'); return; }
    setProof(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError('');
  };

  const handleSubmit = async () => {
    setError('');
    if (!paymentProof) { setError('Upload a payment screenshot'); return; }
    if (!transactionId.trim()) { setError('Enter your transaction / UTR ID'); return; }
    if (transactionId.trim().length < 10) { setError('Transaction ID seems too short'); return; }

    setSubmitting(true);
    try {
      await onSubmitProof({
        packId: pack.id,
        amount: totalAmount,
        transactionId: transactionId.trim(),
        paymentProof,
        // custom packs need credits count so the server knows how many to credit
        ...(pack.id === 'pack_custom' && { credits: pack.credits }),
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Submission failed');
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
                {pack.credits.toLocaleString('en-IN')} Credits {pack.id === 'pack_custom' ? '(Custom)' : 'Pack'}
              </p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Error */}
          {errorMessage && (
            <div className="mb-5 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-900">Error</p>
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Amount Breakdown */}
          <div className="bg-slate-50 rounded-2xl p-6 mb-5 border-2 border-slate-200">
            <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
              <CreditCard size={20} className="text-emerald-600" /> Payment Breakdown
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
              <div className="h-px bg-slate-300 my-3" />
              <div className="flex justify-between text-lg">
                <span className="text-slate-900 font-black">Total:</span>
                <span className="font-black text-emerald-600">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 mb-5 border-2 border-purple-200 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <QrCode size={32} className="text-white" />
            </div>
            <h3 className="font-black text-slate-900 mb-2">Scan QR Code to Pay</h3>
            <p className="text-slate-600 text-sm mb-4 font-medium">Open any UPI app and scan</p>
            <div className="bg-white rounded-2xl p-6 inline-block shadow-lg mb-3">
              <img src={qrCodeUrl} alt="QR" className="w-64 h-64" />
            </div>
            <p className="text-xs text-slate-500 font-medium">Google Pay · PhonePe · Paytm · BHIM & all UPI apps</p>
          </div>

          {/* UPI ID */}
          <div className="bg-blue-50 rounded-2xl p-6 mb-5 border-2 border-blue-200">
            <h3 className="font-black text-slate-900 mb-3">Or Pay Using UPI ID</h3>
            <div className="flex items-center gap-3">
              <input type="text" value={UPI_ID} readOnly className="flex-1 px-4 py-3 bg-white border-2 border-blue-300 rounded-xl font-mono font-bold text-slate-900" />
              <Button variant="default" onClick={() => copyToClipboard(UPI_ID)} className="bg-blue-600 hover:bg-blue-700 text-white">
                {copied ? <><CheckCircle2 size={16} /> Copied!</> : <><Copy size={16} /> Copy</>}
              </Button>
            </div>
            <p className="text-xs text-slate-600 mt-3 font-medium">
              Amount: <span className="font-black text-emerald-600">₹{totalAmount.toLocaleString('en-IN')}</span>
            </p>
          </div>

          {/* Upload proof */}
          <div className="bg-amber-50 rounded-2xl p-6 border-2 border-amber-200">
            <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
              <Upload size={20} className="text-amber-600" /> Upload Payment Proof
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-900 mb-2">Transaction ID / UTR *</label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => { setTxnId(e.target.value); setError(''); }}
                placeholder="12-digit transaction ID"
                className="w-full px-4 py-3 bg-white border-2 border-amber-300 rounded-xl font-medium focus:border-amber-500 focus:outline-none"
              />
              <p className="text-xs text-slate-600 mt-1 font-medium">Find this in your payment app after the transaction</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-900 mb-2">Payment Screenshot *</label>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="credit-proof" />
              <label htmlFor="credit-proof" className="w-full px-4 py-3 bg-white border-2 border-dashed border-amber-300 rounded-xl font-medium hover:border-amber-500 cursor-pointer flex items-center justify-center gap-2 transition-colors">
                <Upload size={18} />
                {paymentProof ? paymentProof.name : 'Choose screenshot (max 5 MB)'}
              </label>
            </div>

            {previewUrl && (
              <div className="mb-4">
                <label className="block text-sm font-bold text-slate-900 mb-2">Preview</label>
                <img src={previewUrl} alt="Preview" className="w-full max-w-sm rounded-xl border-2 border-amber-300" />
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              disabled={submitting || !paymentProof || !transactionId.trim()}
              onClick={handleSubmit}
              className="w-full"
            >
              {submitting ? <><Loader2 size={20} className="animate-spin" /> Submitting...</> : <><CheckCircle2 size={20} /> Submit for Verification</>}
            </Button>

            <p className="text-xs text-slate-600 mt-3 text-center font-medium">
              Verification within 24 hours · confirmation email on approval
            </p>
          </div>

          {/* Steps */}
          <div className="mt-5 bg-slate-50 rounded-2xl p-6 border-2 border-slate-200">
            <h4 className="font-black text-slate-900 mb-3 text-sm">Payment Instructions</h4>
            <ol className="space-y-2 text-xs text-slate-600 font-medium">
              {[
                'Scan the QR code or copy the UPI ID',
                `Pay exactly ₹${totalAmount.toLocaleString('en-IN')}`,
                'Take a screenshot of the successful payment',
                'Upload the screenshot and enter your transaction ID',
                'We\'ll verify and credit your account within 24 hours',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="font-black text-emerald-600 flex-shrink-0">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// TRANSACTION TYPE → icon / colour helpers
// ─────────────────────────────────────────────────────
const TXN_META = {
  PURCHASE: { icon: ArrowUpRight, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Purchase' },
  PLAN_REFILL: { icon: RefreshCw, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Plan Refill' },
  CAMPAIGN_SEND: { icon: ArrowDownLeft, color: 'text-red-500', bg: 'bg-red-50', label: 'Campaign' },
  ADMIN_ADJUST: { icon: Shield, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Adjustment' },
};

const getTxnMeta = (type) => TXN_META[type] || TXN_META.ADMIN_ADJUST;

// Helper: format Date
const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// ─────────────────────────────────────────────────────
// CUSTOM AMOUNT CARD (standalone component)
// ─────────────────────────────────────────────────────
// Matches the pack pricing curve: rate drops as qty rises.
// Thresholds mirror the existing preset packs so it feels consistent.
const CUSTOM_RATE_TIERS = [
  { min: 1,    max: 100,  rate: 0.99 },   // same as pack_100
  { min: 101,  max: 500,  rate: 0.80 },   // between 100 & 500
  { min: 501,  max: 1000, rate: 0.70 },   // ~pack_1000
  { min: 1001, max: 10000, rate: 0.50 },  // ~pack_5000
];
const CUSTOM_MIN = 50;
const CUSTOM_MAX = 10000;

/** Given a credits count, return the blended base price (no GST). */
function calcCustomPrice(credits) {
  let total = 0;
  let remaining = credits;
  // walk tiers low → high, billing each chunk at its tier rate
  for (const tier of CUSTOM_RATE_TIERS) {
    if (remaining <= 0) break;
    const tierCapacity = tier.max - tier.min + 1;
    const chunkStart   = Math.max(credits - remaining, tier.min - 1);
    const chunkInTier  = Math.min(remaining, tier.max - chunkStart);
    if (chunkInTier > 0) {
      total    += chunkInTier * tier.rate;
      remaining -= chunkInTier;
    }
  }
  return Math.round(total); // round to whole rupee
}

/** Derive the active tier label for the badge */
function activeRateLabel(credits) {
  for (let i = CUSTOM_RATE_TIERS.length - 1; i >= 0; i--) {
    if (credits >= CUSTOM_RATE_TIERS[i].min) return `₹${CUSTOM_RATE_TIERS[i].rate}/credit`;
  }
  return '';
}

function CustomAmountCard({ onBuy }) {
  const [credits, setCredits] = useState(200);
  const [inputVal, setInputVal] = useState('200');
  const [inputError, setInputError] = useState('');

  const basePrice  = calcCustomPrice(credits);
  const gstAmount  = Math.round(basePrice * 0.18);
  const total      = basePrice + gstAmount;

  // ── sync slider ↔ text input ──
  const applyValue = (raw) => {
    const n = parseInt(raw, 10);
    if (isNaN(n)) { setInputVal(raw); setInputError('Enter a number'); return; }
    if (n < CUSTOM_MIN) { setInputVal(raw); setInputError(`Minimum ${CUSTOM_MIN} credits`); return; }
    if (n > CUSTOM_MAX) { setInputVal(raw); setInputError(`Maximum ${CUSTOM_MAX.toLocaleString()} credits`); return; }
    setInputError('');
    setInputVal(String(n));
    setCredits(n);
  };

  const handleBuy = () => {
    onBuy({
      id:         'pack_custom',
      credits,
      price:      basePrice,
      gstAmount,
      totalAmount: total,
    });
  };

  return (
    <Card className="border-2 border-dashed border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 col-span-1 sm:col-span-2 lg:col-span-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md">
              <Sparkles size={22} className="text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Pick Your Own Amount</CardTitle>
              <CardDescription>Rate drops automatically as you buy more</CardDescription>
            </div>
          </div>
          <Badge variant="info">Custom</Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col sm:flex-row gap-6">
          {/* ── left: slider + input ── */}
          <div className="flex-1 space-y-4">
            {/* credits number input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-slate-700">Credits</label>
                <Badge variant="secondary">{activeRateLabel(credits)} marginal</Badge>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  inputMode="numeric"
                  value={inputVal}
                  onChange={(e) => applyValue(e.target.value)}
                  onBlur={() => applyValue(inputVal)}
                  className={cn(
                    'w-28 px-3 py-2 rounded-lg border-2 font-black text-xl text-center focus:outline-none transition-colors',
                    inputError ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-emerald-400'
                  )}
                />
                <span className="text-slate-400 font-semibold text-sm">credits</span>
              </div>
              {inputError && <p className="text-xs text-red-500 font-semibold mt-1">{inputError}</p>}
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
                  setInputError('');
                }}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>{CUSTOM_MIN}</span>
                <span>{CUSTOM_MAX.toLocaleString()}</span>
              </div>
            </div>

            {/* tier badges */}
            <div className="flex flex-wrap gap-2">
              {CUSTOM_RATE_TIERS.map((t) => (
                <span
                  key={t.min}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-full font-semibold border transition-colors',
                    credits >= t.min && credits <= t.max
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  )}
                >
                  {t.min === 1 ? '1' : t.min}–{t.max.toLocaleString()} → ₹{t.rate}
                </span>
              ))}
            </div>
          </div>

          {/* ── right: price summary + CTA ── */}
          <div className="sm:w-56 flex flex-col justify-between bg-white rounded-2xl border-2 border-slate-200 p-5">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Base</span>
                <span className="font-semibold text-slate-700">₹{basePrice.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">GST 18%</span>
                <span className="font-semibold text-slate-700">₹{gstAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="h-px bg-slate-200" />
              <div className="flex justify-between text-base">
                <span className="font-black text-slate-900">Total</span>
                <span className="font-black text-emerald-600">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              disabled={!!inputError || credits < CUSTOM_MIN}
              onClick={handleBuy}
              className="w-full mt-5"
            >
              <CreditCard size={16} /> Buy {credits.toLocaleString()} Credits
            </Button>
          </div>
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
    getMyPurchaseRequests,
  } = useCredits();

  // ── state ──
  const [packs, setPacks] = useState([]);
  const [balance, setBalance] = useState(user?.credits?.balance ?? 0);
  const [history, setHistory] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [myRequests, setMyRequests] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [selectedPack, setSelectedPack] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('packs'); // packs | history | requests

  // ── fetch ──
  const loadPacks = useCallback(async () => {
    try {
      const data = await getCreditPacks();
      setPacks(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load packs');
    }
  }, [getCreditPacks]);

  const loadBalance = useCallback(async () => {
    try { setBalance(await getBalance()); }
    catch { /* keep stale */ }
  }, [getBalance]);

  const loadHistory = useCallback(async (page = 1) => {
    try {
      const { transactions, pagination: pg } = await getCreditHistory(page);
      setHistory(transactions);
      setPagination(pg);
    } catch (err) {
      setError(err.message || 'Failed to load history');
    }
  }, [getCreditHistory]);

  const loadMyRequests = useCallback(async () => {
    try { setMyRequests(await getMyPurchaseRequests()); }
    catch { /* silent */ }
  }, [getMyPurchaseRequests]);

  useEffect(() => {
    loadPacks();
    loadBalance();
    loadHistory(1);
    loadMyRequests();
  }, [loadPacks, loadBalance, loadHistory, loadMyRequests]);

  // reload history when tab switches
  useEffect(() => {
    if (activeTab === 'history') loadHistory(historyPage);
    if (activeTab === 'requests') loadMyRequests();
  }, [activeTab]);

  // ── handlers ──
  const handlePurchase = (pack) => {
    setSelectedPack(pack);
    setShowModal(true);
  };

  const handleProofSubmit = async (proofData) => {
    try {
      await submitCreditProof(proofData);
      setShowModal(false);
      setSelectedPack(null);
      setMessage({ type: 'success', text: 'Payment proof submitted! Credits will be added within 24 hours.' });
      loadMyRequests();
    } catch (err) {
      throw err; // let modal handle display
    }
  };

  // ── status badge helper ──
  const statusBadge = (status) => {
    if (status === 'APPROVED') return <Badge variant="success"><CheckCircle2 size={12} /> Approved</Badge>;
    if (status === 'REJECTED') return <Badge variant="danger"><X size={12} /> Rejected</Badge>;
    return <Badge variant="warning"><Clock size={12} /> Pending</Badge>;
  };

  // ─────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-64px)] mx-auto">
      {/* Payment Modal */}
      {showModal && selectedPack && (
        <CreditPaymentModal
          pack={selectedPack}
          onClose={() => { setShowModal(false); setSelectedPack(null); }}
          onSubmitProof={handleProofSubmit}
        />
      )}

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-8">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-50 border-2 border-emerald-200 rounded-full px-4 py-2 mb-6 shadow-sm">
            <Zap size={16} className="text-emerald-600" /> Buy Credits
          </span>
          <h1 className="text-5xl sm:text-6xl font-black text-slate-900 leading-tight tracking-tighter mb-4">
            Power your <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">campaigns</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            Credits fuel every message you send. Top up anytime — no subscriptions needed.
          </p>
        </div>
      </section>

      {/* ── Balance Card ── */}
      <section className="max-w-6xl mx-auto px-6 pb-6">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-xl shadow-emerald-200/40 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <Zap size={28} className="text-white" />
            </div>
            <div>
              <p className="text-emerald-100 text-sm font-semibold">Your Balance</p>
              <p className="text-4xl font-black">{balance.toLocaleString('en-IN')} <span className="text-xl font-semibold text-emerald-200">credits</span></p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="md" onClick={loadBalance} className="border-white/30 text-white hover:bg-white/10">
              <RefreshCw size={16} /> Refresh
            </Button>
          </div>
        </div>
      </section>

      {/* ── Message banner ── */}
      {message.text && (
        <section className="max-w-6xl mx-auto px-6 pb-4">
          <div className={cn(
            'flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-semibold border-2 shadow-sm',
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-red-50 text-red-700 border-red-300'
          )}>
            {message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
            <span>{message.text}</span>
            <button onClick={() => setMessage({ type: '', text: '' })} className="ml-auto"><X size={16} /></button>
          </div>
        </section>
      )}

      {/* ── Tab Bar ── */}
      <section className="max-w-6xl mx-auto px-6 pb-4">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
          {[
            { key: 'packs', label: 'Buy Credits', icon: Sparkles },
            { key: 'history', label: 'History', icon: Clock },
            { key: 'requests', label: 'My Requests', icon: Shield },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all',
                activeTab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>
      </section>

      {/* ═══ TAB: PACKS ═══ */}
      {activeTab === 'packs' && (
        <section className="max-w-6xl mx-auto px-6 pb-20">
          {packs.length === 0 && loading ? (
            <div className="flex justify-center py-20"><Loader2 size={32} className="text-emerald-600 animate-spin" /></div>
          ) : packs.length === 0 ? (
            <Card className="p-12 text-center max-w-md mx-auto">
              <AlertCircle size={40} className="text-slate-400 mx-auto mb-3" />
              <p className="text-slate-500">No credit packs available right now.</p>
            </Card>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {packs.map((pack, i) => {
                  const isBestValue = pack.id === 'pack_1000';
                  const perCredit = (pack.price / pack.credits).toFixed(2);

                  return (
                    <Card
                      key={pack.id}
                      className={cn(
                        'relative transition-all duration-300 hover:shadow-lg',
                        isBestValue
                          ? 'border-2 border-emerald-500 shadow-lg shadow-emerald-100 scale-[1.03]'
                          : 'border border-slate-200 hover:border-emerald-300'
                      )}
                    >
                      {/* Best Value badge */}
                      {isBestValue && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                          <span className="inline-flex items-center gap-1.5 px-4 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-black rounded-full shadow-lg">
                            <TrendingUp size={13} /> Best Value
                          </span>
                        </div>
                      )}

                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center">
                            <Zap size={22} className="text-emerald-600" />
                          </div>
                          <Badge variant="secondary">₹{perCredit}/credit</Badge>
                        </div>
                        <CardTitle className="mt-3 text-2xl font-black">{pack.credits.toLocaleString('en-IN')}</CardTitle>
                        <CardDescription>credits</CardDescription>
                      </CardHeader>

                      <CardContent>
                        <div className="space-y-2 mb-5">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Base</span>
                            <span className="font-semibold text-slate-700">₹{pack.price.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">GST 18%</span>
                            <span className="font-semibold text-slate-700">₹{pack.gstAmount.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="h-px bg-slate-200" />
                          <div className="flex justify-between text-base">
                            <span className="font-black text-slate-900">Total</span>
                            <span className="font-black text-emerald-600">₹{pack.totalAmount.toLocaleString('en-IN')}</span>
                          </div>
                        </div>

                        <Button
                          variant={isBestValue ? 'primary' : 'default'}
                          size="md"
                          onClick={() => handlePurchase(pack)}
                          className="w-full"
                        >
                          <CreditCard size={16} /> Buy Now
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* ── Custom Amount Card (spans full width below presets) ── */}
                <CustomAmountCard onBuy={handlePurchase} />
              </div>

              {/* How credits work */}
              <Card className="mt-8 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Sparkles size={18} className="text-emerald-600" /> How Credits Work</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    {[
                      { icon: Zap, title: 'Buy a Pack', desc: 'Choose a preset or enter a custom amount, pay via UPI, upload your proof.' },
                      { icon: Clock, title: 'Quick Verification', desc: 'Our team verifies within 24 hours and adds credits.' },
                      { icon: ArrowUpRight, title: 'Send Campaigns', desc: 'Each message sent uses 1 credit from your balance.' },
                    ].map(({ icon: Icon, title, desc }) => (
                      <div key={title} className="flex gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                          <Icon size={18} className="text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
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

      {/* ═══ TAB: HISTORY ═══ */}
      {activeTab === 'history' && (
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>{pagination.total} total transactions</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-12">
                  <Clock size={36} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No transactions yet</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeader>Type</TableHeader>
                        <TableHeader>Amount</TableHeader>
                        <TableHeader>Balance After</TableHeader>
                        <TableHeader>Note</TableHeader>
                        <TableHeader>Date</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {history.map((txn) => {
                        const meta = getTxnMeta(txn.type);
                        const Icon = meta.icon;
                        const isCredit = ['PURCHASE', 'PLAN_REFILL', 'ADMIN_ADJUST'].includes(txn.type);

                        return (
                          <TableRow key={txn._id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', meta.bg)}>
                                  <Icon size={16} className={meta.color} />
                                </div>
                                <span className="font-semibold text-slate-800">{meta.label}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className={cn('font-bold', isCredit ? 'text-emerald-600' : 'text-red-500')}>
                                {isCredit ? '+' : '-'}{Math.abs(txn.amount).toLocaleString('en-IN')}
                              </span>
                            </TableCell>
                            <TableCell className="font-semibold text-slate-800">
                              {txn.balanceAfter?.toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell className="text-slate-500 text-xs max-w-xs truncate">
                              {txn.meta?.note || '—'}
                            </TableCell>
                            <TableCell className="text-slate-400 text-xs whitespace-nowrap">
                              {fmtDate(txn.createdAt)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-5">
                      <Button
                        variant="outline" size="sm"
                        disabled={historyPage <= 1}
                        onClick={() => { const p = historyPage - 1; setHistoryPage(p); loadHistory(p); }}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-slate-600 font-semibold">
                        {historyPage} / {pagination.totalPages}
                      </span>
                      <Button
                        variant="outline" size="sm"
                        disabled={historyPage >= pagination.totalPages}
                        onClick={() => { const p = historyPage + 1; setHistoryPage(p); loadHistory(p); }}
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

      {/* ═══ TAB: MY REQUESTS ═══ */}
      {activeTab === 'requests' && (
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <Card>
            <CardHeader>
              <CardTitle>My Purchase Requests</CardTitle>
              <CardDescription>Track the status of your UPI payments</CardDescription>
            </CardHeader>
            <CardContent>
              {myRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Shield size={36} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No purchase requests yet</p>
                  <Button variant="primary" size="sm" className="mt-4" onClick={() => setActiveTab('packs')}>
                    <CreditCard size={14} /> Buy Credits
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Credits</TableHeader>
                      <TableHeader>Amount</TableHeader>
                      <TableHeader>Txn ID</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <TableHeader>Date</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {myRequests.map((req) => (
                      <TableRow key={req._id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                              <Zap size={16} className="text-emerald-600" />
                            </div>
                            <span className="font-semibold">{req.packCredits?.toLocaleString('en-IN')} credits</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-800">₹{req.amount?.toLocaleString('en-IN')}</TableCell>
                        <TableCell className="font-mono text-xs text-slate-500">{req.transactionId}</TableCell>
                        <TableCell>{statusBadge(req.status)}</TableCell>
                        <TableCell className="text-slate-400 text-xs whitespace-nowrap">{fmtDate(req.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}