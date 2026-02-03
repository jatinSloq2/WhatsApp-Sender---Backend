import {
    AlertCircle,
    Calendar,
    Check,
    CheckCircle2,
    CreditCard,
    ExternalLink,
    Loader2,
    RefreshCw,
    Search,
    Shield,
    User,
    X,
    Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Alert,
} from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
    Card, CardContent,
} from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';


const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ═══════════════════════════════════════════════════════════════
// shadcn-style UI Components
// ═══════════════════════════════════════════════════════════════

function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}

// ═══════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════

const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(price);
};

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

export default function AdminVerification() {
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState('payments');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Payment requests state
    const [paymentRequests, setPaymentRequests] = useState([]);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [paymentProcessing, setPaymentProcessing] = useState(null);

    // Credit requests state
    const [creditRequests, setCreditRequests] = useState([]);
    const [selectedCredit, setSelectedCredit] = useState(null);
    const [creditProcessing, setCreditProcessing] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    // Search
    const [searchQuery, setSearchQuery] = useState('');

    // Image modal
    const [selectedImage, setSelectedImage] = useState(null);

    // ─────────────────────────────────────────────────────────────
    // Load Payment Requests
    // ─────────────────────────────────────────────────────────────
    const loadPaymentRequests = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API}/api/plans/pending-payments`, {
                credentials: 'include',
            });

            if (!res.ok) throw new Error('Failed to load payment requests');

            const data = await res.json();
            setPaymentRequests(data.data || []);
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    }, []);

    // ─────────────────────────────────────────────────────────────
    // Load Credit Requests
    // ─────────────────────────────────────────────────────────────
    const loadCreditRequests = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API}/api/credits/pending-purchases`, {
                credentials: 'include',
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error?.message || 'Failed to load credit requests');
            }

            const data = await res.json();
            setCreditRequests(data.data || []);
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    }, []);

    // ─────────────────────────────────────────────────────────────
    // Handle Payment Action
    // ─────────────────────────────────────────────────────────────
    const handlePaymentAction = async (requestId, action) => {
        const reason =
            action === 'REJECT' ? prompt('Enter rejection reason:') : null;

        if (action === 'REJECT' && !reason) return;

        setPaymentProcessing(requestId);
        try {
            const res = await fetch(`${API}/api/plans/verify-payment/${requestId}`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, reason }),
            });

            if (!res.ok) throw new Error('Verification failed');

            setMessage({
                type: 'success',
                text:
                    action === 'APPROVE' ? 'Payment approved!' : 'Payment rejected',
            });

            await loadPaymentRequests();
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setPaymentProcessing(null);
        }
    };

    // ─────────────────────────────────────────────────────────────
    // Handle Credit Action
    // ─────────────────────────────────────────────────────────────
    const handleCreditAction = async (requestId, action) => {
        setCreditProcessing(true);
        try {
            const res = await fetch(
                `${API}/api/credits/verify-purchase/${requestId}`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action,
                        reason: rejectionReason || undefined,
                    }),
                }
            );

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error?.message || 'Action failed');
            }

            setMessage({
                type: 'success',
                text:
                    action === 'APPROVE'
                        ? 'Credits approved and added to user balance.'
                        : 'Request rejected.',
            });

            setSelectedCredit(null);
            setRejectionReason('');
            await loadCreditRequests();
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setCreditProcessing(false);
        }
    };

    // ─────────────────────────────────────────────────────────────
    // Load data based on active tab
    // ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (activeTab === 'payments') {
            loadPaymentRequests();
        } else {
            loadCreditRequests();
        }
    }, [activeTab, loadPaymentRequests, loadCreditRequests]);

    // ─────────────────────────────────────────────────────────────
    // Filtered requests based on search
    // ─────────────────────────────────────────────────────────────
    const filteredPayments = paymentRequests.filter(
        (r) =>
            searchQuery === '' ||
            r.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.userId?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.transactionId?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredCredits = creditRequests.filter(
        (r) =>
            searchQuery === '' ||
            r.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.userId?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.transactionId?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // ─────────────────────────────────────────────────────────────
    // Access Control
    // ─────────────────────────────────────────────────────────────
    if (user?.email !== 'jatinsingh098hp@gmail.com') {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <Card className="max-w-md w-full p-10 text-center">
                    <AlertCircle size={40} className="text-red-500 mx-auto mb-3" />
                    <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
                    <p className="text-slate-500 text-sm mt-1">
                        Only admins can access this page.
                    </p>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="max-w-7xl mx-auto p-6">
                {/* ═══════════════════════════════════════════════════════ */}
                {/* Header */}
                {/* ═══════════════════════════════════════════════════════ */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <Shield size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900">
                                Admin Verification
                            </h1>
                            <p className="text-sm text-slate-500">
                                Manage pending payment and credit purchase requests
                            </p>
                        </div>
                    </div>
                    <Button
                    className={"p-2"}
                        variant="outline"
                        size="md"
                        onClick={
                            activeTab === 'payments'
                                ? loadPaymentRequests
                                : loadCreditRequests
                        }
                        disabled={loading}
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </Button>
                </div>

                {/* ═══════════════════════════════════════════════════════ */}
                {/* Message Alert */}
                {/* ═══════════════════════════════════════════════════════ */}
                {message.text && (
                    <Alert
                        variant={message.type === 'success' ? 'success' : 'error'}
                        className="mb-6"
                    >
                        {message.type === 'success' ? (
                            <CheckCircle2 size={18} />
                        ) : (
                            <AlertCircle size={18} />
                        )}
                        <span>{message.text}</span>
                        <button
                            onClick={() => setMessage({ type: '', text: '' })}
                            className="ml-auto"
                        >
                            <X size={16} />
                        </button>
                    </Alert>
                )}

                {/* ═══════════════════════════════════════════════════════ */}
                {/* Tabs */}
                {/* ═══════════════════════════════════════════════════════ */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="payments">
                            <CreditCard size={16} />
                            Payment Verification
                            {paymentRequests.length > 0 && (
                                <Badge variant="warning" className="ml-2">
                                    {paymentRequests.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="credits">
                            <Zap size={16} />
                            Credit Verification
                            {creditRequests.length > 0 && (
                                <Badge variant="warning" className="ml-2">
                                    {creditRequests.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    {/* ───────────────────────────────────────────────────── */}
                    {/* Payment Verification Tab */}
                    {/* ───────────────────────────────────────────────────── */}
                    <TabsContent value="payments" activeValue={activeTab}>
                        {/* Stats */}
                        <div className="grid sm:grid-cols-3 gap-4 mb-6">
                            <Card className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500 font-semibold uppercase">
                                            Pending
                                        </p>
                                        <p className="text-2xl font-black text-slate-900 mt-1">
                                            {paymentRequests.length}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                                        <CreditCard size={20} className="text-amber-600" />
                                    </div>
                                </div>
                            </Card>
                            <Card className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500 font-semibold uppercase">
                                            Total Amount
                                        </p>
                                        <p className="text-2xl font-black text-slate-900 mt-1">
                                            {formatPrice(
                                                paymentRequests.reduce(
                                                    (sum, r) => sum + (r.amount || 0),
                                                    0
                                                )
                                            )}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                                        <Zap size={20} className="text-blue-600" />
                                    </div>
                                </div>
                            </Card>
                            <Card className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500 font-semibold uppercase">
                                            Users Waiting
                                        </p>
                                        <p className="text-2xl font-black text-slate-900 mt-1">
                                            {
                                                new Set(paymentRequests.map((r) => r.userId?._id))
                                                    .size
                                            }
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                                        <User size={20} className="text-green-600" />
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Search */}
                        <Card className="mb-6">
                            <CardContent className="pt-4">
                                <div className="flex items-center gap-3 px-4 py-2 bg-slate-100 rounded-lg">
                                    <Search size={18} className="text-slate-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search by name, email, or transaction ID…"
                                        className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Requests List */}
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 size={32} className="text-green-600 animate-spin" />
                            </div>
                        ) : filteredPayments.length === 0 ? (
                            <Card className="p-12 text-center">
                                <CheckCircle2 size={48} className="text-green-400 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                                    No Pending Requests
                                </h2>
                                <p className="text-slate-600">
                                    All payment requests have been processed.
                                </p>
                            </Card>
                        ) : (
                            <div className="grid gap-6">
                                {filteredPayments.map((request) => (
                                    <Card
                                        key={request._id}
                                        className="p-6 hover:shadow-lg transition-shadow"
                                    >
                                        <div className="grid md:grid-cols-3 gap-6">
                                            {/* User & Plan Info */}
                                            <div>
                                                <h3 className="font-black text-lg text-slate-900 mb-4">
                                                    Request Details
                                                </h3>

                                                <div className="space-y-3 text-sm">
                                                    <div className="flex items-start gap-2">
                                                        <User
                                                            size={16}
                                                            className="text-slate-400 mt-0.5"
                                                        />
                                                        <div>
                                                            <p className="font-semibold text-slate-900">
                                                                {request.userId.name}
                                                            </p>
                                                            <p className="text-slate-600">
                                                                {request.userId.email}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-start gap-2">
                                                        <CreditCard
                                                            size={16}
                                                            className="text-slate-400 mt-0.5"
                                                        />
                                                        <div>
                                                            <p className="font-semibold text-slate-900">
                                                                {request.planId.name} - {request.billingCycle}
                                                            </p>
                                                            <p className="text-green-600 font-bold">
                                                                {formatPrice(request.amount)}
                                                            </p>
                                                            <p className="text-xs text-slate-500">
                                                                Base: {formatPrice(request.baseAmount)} + GST:{' '}
                                                                {formatPrice(request.gstAmount)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-start gap-2">
                                                        <Calendar
                                                            size={16}
                                                            className="text-slate-400 mt-0.5"
                                                        />
                                                        <div>
                                                            <p className="text-slate-600">Submitted</p>
                                                            <p className="font-semibold text-slate-900">
                                                                {formatDate(request.createdAt)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="pt-2 border-t border-slate-200">
                                                        <p className="text-xs text-slate-500 font-medium mb-1">
                                                            Transaction ID
                                                        </p>
                                                        <p className="font-mono font-bold text-slate-900 text-sm break-all">
                                                            {request.transactionId}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Payment Proof */}
                                            <div>
                                                <h3 className="font-black text-lg text-slate-900 mb-4">
                                                    Payment Proof
                                                </h3>
                                                <div
                                                    onClick={() =>
                                                        setSelectedImage(
                                                            `${API}/${request.paymentProof}`
                                                        )
                                                    }
                                                    className="relative aspect-[3/4] rounded-xl overflow-hidden border-2 border-slate-200 cursor-pointer hover:border-green-400 transition-colors group"
                                                >
                                                    <img
                                                        src={`${API}/${request.paymentProof}`}
                                                        alt="Payment proof"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <ExternalLink className="text-white" size={32} />
                                                    </div>
                                                </div>
                                                <p className="text-xs text-center text-slate-500 mt-2 font-medium">
                                                    Click to view full size
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            <div>
                                                <h3 className="font-black text-lg text-slate-900 mb-4">
                                                    Actions
                                                </h3>
                                                <div className="space-y-3">
                                                    <Button
                                                        variant="primary"
                                                        size="lg"
                                                        className="w-full"
                                                        onClick={() =>
                                                            handlePaymentAction(request._id, 'APPROVE')
                                                        }
                                                        disabled={paymentProcessing === request._id}
                                                    >
                                                        {paymentProcessing === request._id ? (
                                                            <Loader2 size={20} className="animate-spin" />
                                                        ) : (
                                                            <>
                                                                <Check size={20} />
                                                                Approve & Activate
                                                            </>
                                                        )}
                                                    </Button>

                                                    <Button
                                                        variant="danger"
                                                        size="lg"
                                                        className="w-full"
                                                        onClick={() =>
                                                            handlePaymentAction(request._id, 'REJECT')
                                                        }
                                                        disabled={paymentProcessing === request._id}
                                                    >
                                                        {paymentProcessing === request._id ? (
                                                            <Loader2 size={20} className="animate-spin" />
                                                        ) : (
                                                            <>
                                                                <X size={20} />
                                                                Reject Payment
                                                            </>
                                                        )}
                                                    </Button>

                                                    <div className="pt-4 border-t border-slate-200">
                                                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                                            <strong>Approve:</strong> Activates subscription
                                                            immediately and adds credits to user's account.
                                                        </p>
                                                        <p className="text-xs text-slate-600 font-medium leading-relaxed mt-2">
                                                            <strong>Reject:</strong> Sends notification to
                                                            user. They can submit a new request.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* ───────────────────────────────────────────────────── */}
                    {/* Credit Verification Tab */}
                    {/* ───────────────────────────────────────────────────── */}
                    <TabsContent value="credits" activeValue={activeTab}>
                        {/* Stats */}
                        <div className="grid sm:grid-cols-3 gap-4 mb-6">
                            <Card className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500 font-semibold uppercase">
                                            Pending
                                        </p>
                                        <p className="text-2xl font-black text-slate-900 mt-1">
                                            {creditRequests.length}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                                        <Zap size={20} className="text-amber-600" />
                                    </div>
                                </div>
                            </Card>
                            <Card className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500 font-semibold uppercase">
                                            Total ₹ Pending
                                        </p>
                                        <p className="text-2xl font-black text-slate-900 mt-1">
                                            {formatPrice(
                                                creditRequests.reduce(
                                                    (sum, r) => sum + (r.amount || 0),
                                                    0
                                                )
                                            )}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                                        <Zap size={20} className="text-blue-600" />
                                    </div>
                                </div>
                            </Card>
                            <Card className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500 font-semibold uppercase">
                                            Credits Pending
                                        </p>
                                        <p className="text-2xl font-black text-slate-900 mt-1">
                                            {creditRequests
                                                .reduce((sum, r) => sum + (r.packCredits || 0), 0)
                                                .toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                                        <Zap size={20} className="text-green-600" />
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Search */}
                        <Card className="mb-6">
                            <CardContent className="pt-4">
                                <div className="flex items-center gap-3 px-4 py-2 bg-slate-100 rounded-lg">
                                    <Search size={18} className="text-slate-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search by name, email, or transaction ID…"
                                        className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Requests List */}
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 size={32} className="text-green-600 animate-spin" />
                            </div>
                        ) : filteredCredits.length === 0 ? (
                            <Card className="p-12 text-center">
                                <CheckCircle2 size={48} className="text-green-400 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                                    No Pending Requests
                                </h2>
                                <p className="text-slate-600">
                                    All credit requests have been processed.
                                </p>
                            </Card>
                        ) : (
                            <>
                                <div className="grid gap-6">
                                    {filteredCredits.map((request) => (
                                        <Card
                                            key={request._id}
                                            className={cn(
                                                'p-6 hover:shadow-lg transition-shadow',
                                                selectedCredit?._id === request._id &&
                                                'ring-2 ring-green-500'
                                            )}
                                        >
                                            <div className="grid md:grid-cols-3 gap-6">
                                                {/* User Info */}
                                                <div>
                                                    <h3 className="font-black text-lg text-slate-900 mb-4">
                                                        Request Details
                                                    </h3>
                                                    <div className="space-y-3 text-sm">
                                                        <div className="flex items-start gap-2">
                                                            <User
                                                                size={16}
                                                                className="text-slate-400 mt-0.5"
                                                            />
                                                            <div>
                                                                <p className="font-semibold text-slate-900">
                                                                    {request.userId?.name || '—'}
                                                                </p>
                                                                <p className="text-slate-600">
                                                                    {request.userId?.email || '—'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-start gap-2">
                                                            <Zap
                                                                size={16}
                                                                className="text-slate-400 mt-0.5"
                                                            />
                                                            <div>
                                                                <p className="font-semibold text-slate-900">
                                                                    {request.packCredits?.toLocaleString(
                                                                        'en-IN'
                                                                    )}{' '}
                                                                    Credits
                                                                </p>
                                                                <p className="text-green-600 font-bold">
                                                                    {formatPrice(request.amount)}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-start gap-2">
                                                            <Calendar
                                                                size={16}
                                                                className="text-slate-400 mt-0.5"
                                                            />
                                                            <div>
                                                                <p className="text-slate-600">Submitted</p>
                                                                <p className="font-semibold text-slate-900">
                                                                    {formatDate(request.createdAt)}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="pt-2 border-t border-slate-200">
                                                            <p className="text-xs text-slate-500 font-medium mb-1">
                                                                Transaction ID
                                                            </p>
                                                            <p className="font-mono font-bold text-slate-900 text-sm break-all">
                                                                {request.transactionId}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Payment Proof */}
                                                <div>
                                                    <h3 className="font-black text-lg text-slate-900 mb-4">
                                                        Payment Proof
                                                    </h3>
                                                    {request.paymentProof ? (
                                                        <>
                                                            <div
                                                                onClick={() =>
                                                                    setSelectedImage(
                                                                        `${API}/${request.paymentProof}`
                                                                    )
                                                                }
                                                                className="relative aspect-[3/4] rounded-xl overflow-hidden border-2 border-slate-200 cursor-pointer hover:border-green-400 transition-colors group"
                                                            >
                                                                <img
                                                                    src={`${API}/${request.paymentProof}`}
                                                                    alt="Payment proof"
                                                                    className="w-full h-full object-cover"
                                                                />
                                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                    <ExternalLink
                                                                        className="text-white"
                                                                        size={32}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <p className="text-xs text-center text-slate-500 mt-2 font-medium">
                                                                Click to view full size
                                                            </p>
                                                        </>
                                                    ) : (
                                                        <div className="aspect-[3/4] rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center">
                                                            <p className="text-slate-400 text-sm">
                                                                No proof uploaded
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div>
                                                    <h3 className="font-black text-lg text-slate-900 mb-4">
                                                        Actions
                                                    </h3>
                                                    <div className="space-y-3">
                                                        <Button
                                                            variant="primary"
                                                            size="lg"
                                                            className="w-full"
                                                            onClick={() =>
                                                                handleCreditAction(request._id, 'APPROVE')
                                                            }
                                                            disabled={creditProcessing}
                                                        >
                                                            {creditProcessing ? (
                                                                <Loader2 size={20} className="animate-spin" />
                                                            ) : (
                                                                <>
                                                                    <Check size={20} />
                                                                    Approve & Add Credits
                                                                </>
                                                            )}
                                                        </Button>

                                                        <Button
                                                            variant="ghost"
                                                            size="lg"
                                                            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() =>
                                                                setSelectedCredit(
                                                                    selectedCredit?._id === request._id
                                                                        ? null
                                                                        : request
                                                                )
                                                            }
                                                            disabled={creditProcessing}
                                                        >
                                                            <X size={20} />
                                                            Reject Request
                                                        </Button>

                                                        <div className="pt-4 border-t border-slate-200">
                                                            <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                                                <strong>Approve:</strong> Credits will be added
                                                                to user's balance immediately.
                                                            </p>
                                                            <p className="text-xs text-slate-600 font-medium leading-relaxed mt-2">
                                                                <strong>Reject:</strong> User will be notified
                                                                and can submit a new request.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>

                                {/* Rejection Panel */}
                                {selectedCredit && (
                                    <Card className="mt-6 border-2 border-red-200 bg-red-50">
                                        <CardContent className="pt-6">
                                            <p className="text-sm font-bold text-red-900 mb-3">
                                                Rejecting request for{' '}
                                                <span className="font-black">
                                                    {selectedCredit.userId?.name}
                                                </span>{' '}
                                                ({selectedCredit.packCredits?.toLocaleString('en-IN')}{' '}
                                                credits)
                                            </p>
                                            <input
                                                type="text"
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                placeholder="Optional: reason for rejection"
                                                className="w-full px-4 py-2.5 bg-white border-2 border-red-300 rounded-lg text-sm focus:border-red-500 focus:outline-none mb-3"
                                            />
                                            <div className="flex gap-3">
                                                <Button
                                                    variant="danger"
                                                    size="md"
                                                    onClick={() =>
                                                        handleCreditAction(selectedCredit._id, 'REJECT')
                                                    }
                                                    disabled={creditProcessing}
                                                >
                                                    {creditProcessing ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : (
                                                        <X size={14} />
                                                    )}
                                                    Confirm Reject
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="md"
                                                    onClick={() => {
                                                        setSelectedCredit(null);
                                                        setRejectionReason('');
                                                    }}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* Image Modal */}
            {/* ═══════════════════════════════════════════════════════ */}
            {selectedImage && (
                <div
                    onClick={() => setSelectedImage(null)}
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6"
                >
                    <div className="relative max-w-4xl max-h-full">
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl hover:bg-slate-100 transition-colors z-10"
                        >
                            <X size={24} />
                        </button>
                        <img
                            src={selectedImage}
                            alt="Payment proof full size"
                            className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}