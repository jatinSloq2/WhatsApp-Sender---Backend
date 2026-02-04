import {
    AlertCircle,
    Calendar,
    Check,
    CheckCircle2,
    CreditCard,
    ExternalLink,
    History,
    Loader2,
    RefreshCw,
    Search,
    Shield,
    User,
    X,
    Zap
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ═══════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════

function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}

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

    const [activeTab, setActiveTab] = useState('payments-pending');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Payment requests state
    const [pendingPayments, setPendingPayments] = useState([]);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [paymentProcessing, setPaymentProcessing] = useState(null);

    // Credit requests state
    const [pendingCredits, setPendingCredits] = useState([]);
    const [creditHistory, setCreditHistory] = useState([]);
    const [selectedCredit, setSelectedCredit] = useState(null);
    const [creditProcessing, setCreditProcessing] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    // Search
    const [searchQuery, setSearchQuery] = useState('');

    // Image modal
    const [selectedImage, setSelectedImage] = useState(null);

    // ─────────────────────────────────────────────────────────────
    // Load Payment Requests (Pending)
    // ─────────────────────────────────────────────────────────────
    const loadPendingPayments = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API}/api/plans/pending-payments`, {
                credentials: 'include',
            });

            if (!res.ok) throw new Error('Failed to load payment requests');

            const data = await res.json();
            setPendingPayments(data.data || []);
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    }, []);

    // ─────────────────────────────────────────────────────────────
    // Load Payment History (Approved + Rejected)
    // ─────────────────────────────────────────────────────────────
    const loadPaymentHistory = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API}/api/plans/payment-history`, {
                credentials: 'include',
            });

            if (!res.ok) throw new Error('Failed to load payment history');

            const data = await res.json();
            setPaymentHistory(data.data || []);
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    }, []);

    // ─────────────────────────────────────────────────────────────
    // Load Credit Requests (Pending)
    // ─────────────────────────────────────────────────────────────
    const loadPendingCredits = useCallback(async () => {
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
            setPendingCredits(data.data || []);
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    }, []);

    // ─────────────────────────────────────────────────────────────
    // Load Credit History (Approved + Rejected)
    // ─────────────────────────────────────────────────────────────
    const loadCreditHistory = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API}/api/credits/purchase-history`, {
                credentials: 'include',
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error?.message || 'Failed to load credit history');
            }

            const data = await res.json();
            setCreditHistory(data.data || []);
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

            await loadPendingPayments();
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
            await loadPendingCredits();
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
        switch (activeTab) {
            case 'payments-pending':
                loadPendingPayments();
                break;
            case 'payments-history':
                loadPaymentHistory();
                break;
            case 'credits-pending':
                loadPendingCredits();
                break;
            case 'credits-history':
                loadCreditHistory();
                break;
            default:
                break;
        }
    }, [activeTab, loadPendingPayments, loadPaymentHistory, loadPendingCredits, loadCreditHistory]);

    // ─────────────────────────────────────────────────────────────
    // Filtered requests based on search
    // ─────────────────────────────────────────────────────────────
    const filterRequests = (requests) => {
        if (!searchQuery) return requests;
        return requests.filter(
            (r) =>
                r.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.userId?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.transactionId?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    const filteredPendingPayments = filterRequests(pendingPayments);
    const filteredPaymentHistory = filterRequests(paymentHistory);
    const filteredPendingCredits = filterRequests(pendingCredits);
    const filteredCreditHistory = filterRequests(creditHistory);

    // ─────────────────────────────────────────────────────────────
    // Status Badge Component
    // ─────────────────────────────────────────────────────────────
    const StatusBadge = ({ status }) => {
        if (status === 'APPROVED') {
            return (
                <Badge className="bg-green-100 text-green-700 border-green-300 font-bold">
                    <CheckCircle2 size={14} className="mr-1" /> Approved
                </Badge>
            );
        }
        if (status === 'REJECTED') {
            return (
                <Badge className="bg-red-100 text-red-700 border-red-300 font-bold">
                    <X size={14} className="mr-1" /> Rejected
                </Badge>
            );
        }
        return (
            <Badge className="bg-amber-100 text-amber-700 border-amber-300 font-bold">
                <AlertCircle size={14} className="mr-1" /> Pending
            </Badge>
        );
    };

    // ─────────────────────────────────────────────────────────────
    // Access Control
    // ─────────────────────────────────────────────────────────────
    if (user?.email !== 'jatinsingh098hp@gmail.com') {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <Card className="max-w-md w-full p-10 text-center border-2 border-red-300 rounded-2xl">
                    <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
                    <p className="text-slate-600">
                        Only admins can access this page.
                    </p>
                </Card>
            </div>
        );
    }

    const currentRefresh = () => {
        switch (activeTab) {
            case 'payments-pending':
                loadPendingPayments();
                break;
            case 'payments-history':
                loadPaymentHistory();
                break;
            case 'credits-pending':
                loadPendingCredits();
                break;
            case 'credits-history':
                loadCreditHistory();
                break;
            default:
                break;
        }
    };

    return (
        <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50">
            <div className="max-w-7xl mx-auto p-6">
                {/* ═══════════════════════════════════════════════════════ */}
                {/* Header */}
                {/* ═══════════════════════════════════════════════════════ */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg border-2 border-green-700">
                            <Shield size={28} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900">
                                Admin Verification
                            </h1>
                            <p className="text-sm text-slate-600 font-medium">
                                Manage pending payment and credit purchase requests
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 rounded-xl hover:border-green-600 font-semibold"
                        onClick={currentRefresh}
                        disabled={loading}
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </Button>
                </div>

                {/* ═══════════════════════════════════════════════════════ */}
                {/* Message Alert */}
                {/* ═══════════════════════════════════════════════════════ */}
                {message.text && (
                    <Alert
                        className={`mb-6 rounded-xl border-2 flex items-center justify-between ${message.type === 'success'
                            ? 'bg-green-50 border-green-300'
                            : 'bg-red-50 border-red-300'
                            }`}
                    >
                        <div className="flex w-full">
                            <div className="flex items-center gap-2 w-full">
                                {message.type === 'success' ? (
                                    <CheckCircle2 size={18} className="text-green-600" />
                                ) : (
                                    <AlertCircle size={18} className="text-red-600" />
                                )}
                                <span
                                    className={`font-semibold ${message.type === 'success'
                                        ? 'text-green-700'
                                        : 'text-red-700'
                                        }`}
                                >
                                    {message.text}
                                </span>
                            </div>
                            <button
                                onClick={() => setMessage({ type: '', text: '' })}
                                className="hover:bg-gray-200 rounded-lg p-1 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </Alert>
                )}

                {/* ═══════════════════════════════════════════════════════ */}
                {/* Tabs */}
                {/* ═══════════════════════════════════════════════════════ */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-6 bg-white border-2 border-gray-200 p-6 rounded-xl">
                        <TabsTrigger value="payments-pending" className="flex items-center gap-2 p-4">
                            <CreditCard size={16} />
                            Pending Payments
                            {pendingPayments.length > 0 && (
                                <Badge className="bg-amber-100 text-amber-700 border-amber-300 ml-1">
                                    {pendingPayments.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="payments-history" className="flex items-center gap-2 p-4">
                            <History size={16} />
                            Payment History
                        </TabsTrigger>
                        <TabsTrigger value="credits-pending" className="flex items-center gap-2 p-4">
                            <Zap size={16} />
                            Pending Credits
                            {pendingCredits.length > 0 && (
                                <Badge className="bg-amber-100 text-amber-700 border-amber-300 ml-1">
                                    {pendingCredits.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="credits-history" className="flex items-center gap-2 p-4">
                            <History size={16} />
                            Credit History
                        </TabsTrigger>
                    </TabsList>

                    {/* Search Bar - shown for all tabs */}
                    <Card className="mb-6 border-2 border-gray-200 rounded-xl">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3 px-4 py-3 bg-gray-100 rounded-xl">
                                <Search size={20} className="text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by name, email, or transaction ID…"
                                    className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* PAYMENTS - PENDING TAB */}
                    <TabsContent value="payments-pending">
                        {/* Stats */}
                        <div className="grid sm:grid-cols-3 gap-4 mb-6">
                            <Card className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500 font-semibold uppercase">
                                            Pending
                                        </p>
                                        <p className="text-2xl font-black text-slate-900 mt-1">
                                            {pendingPayments.length}
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
                                                pendingPayments.reduce(
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
                                                new Set(pendingPayments.map((r) => r.userId?._id))
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

                        {/* Requests List */}
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 size={32} className="text-green-600 animate-spin" />
                            </div>
                        ) : filteredPendingPayments.length === 0 ? (
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
                                {filteredPendingPayments.map((request) => (
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
                                                                {request.userId?.name || '—'}
                                                            </p>
                                                            <p className="text-slate-600">
                                                                {request.userId?.email || '—'}
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
                                                                {request.planId?.name || '—'} - {request.billingCycle || '—'}
                                                            </p>
                                                            <p className="text-green-600 font-bold">
                                                                {formatPrice(request.amount || 0)}
                                                            </p>
                                                            <p className="text-xs text-slate-500">
                                                                Base: {formatPrice(request.baseAmount || 0)} + GST:{' '}
                                                                {formatPrice(request.gstAmount || 0)}
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
                                                            {request.transactionId || '—'}
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
                                                                <ExternalLink className="text-white" size={32} />
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-center text-slate-500 mt-2 font-medium">
                                                            Click to view full size
                                                        </p>
                                                    </>
                                                ) : (
                                                    <div className="aspect-[3/4] rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center">
                                                        <p className="text-slate-400 text-sm">No proof uploaded</p>
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

                    {/* PAYMENTS - HISTORY TAB */}
                    <TabsContent value="payments-history">
                        {loading ? (
                            <div className="flex justify-center py-20">
                                <Loader2 size={40} className="text-green-600 animate-spin" />
                            </div>
                        ) : filteredPaymentHistory.length === 0 ? (
                            <Card className="p-16 text-center border-2 border-gray-200 rounded-2xl">
                                <History size={56} className="text-gray-300 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                                    No Payment History
                                </h2>
                                <p className="text-slate-600">
                                    Processed payment requests will appear here.
                                </p>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {filteredPaymentHistory.map((request) => (
                                    <Card
                                        key={request._id}
                                        className="p-6 border-2 border-gray-200 rounded-2xl hover:shadow-lg transition-shadow"
                                    >
                                        <div className="grid md:grid-cols-4 gap-6">
                                            {/* User Info */}
                                            <div>
                                                <h3 className="font-black text-base text-slate-900 mb-3">
                                                    User Details
                                                </h3>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex items-start gap-2">
                                                        <User size={16} className="text-slate-400 mt-0.5" />
                                                        <div>
                                                            <p className="font-semibold text-slate-900">
                                                                {request.userId?.name || '—'}
                                                            </p>
                                                            <p className="text-slate-600 text-xs">
                                                                {request.userId?.email || '—'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Plan & Amount */}
                                            <div>
                                                <h3 className="font-black text-base text-slate-900 mb-3">
                                                    Plan Details
                                                </h3>
                                                <div className="space-y-2 text-sm">
                                                    <p className="font-bold text-slate-900">
                                                        {request.planId?.name || '—'} - {request.billingCycle || '—'}
                                                    </p>
                                                    <p className="text-green-600 font-bold text-lg">
                                                        {formatPrice(request.amount || 0)}
                                                    </p>
                                                    <p className="text-xs text-slate-500 font-mono">
                                                        TXN: {request.transactionId || '—'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Dates & Status */}
                                            <div>
                                                <h3 className="font-black text-base text-slate-900 mb-3">
                                                    Status & Timeline
                                                </h3>
                                                <div className="space-y-2 text-sm">
                                                    <StatusBadge status={request.status} />
                                                    <div className="flex items-start gap-2">
                                                        <Calendar size={14} className="text-slate-400 mt-0.5" />
                                                        <div className="text-xs">
                                                            <p className="text-slate-500">Submitted</p>
                                                            <p className="font-semibold text-slate-700">
                                                                {formatDate(request.createdAt)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {request.verifiedAt && (
                                                        <div className="flex items-start gap-2">
                                                            <Calendar size={14} className="text-slate-400 mt-0.5" />
                                                            <div className="text-xs">
                                                                <p className="text-slate-500">Verified</p>
                                                                <p className="font-semibold text-slate-700">
                                                                    {formatDate(request.verifiedAt)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions/Reason */}
                                            <div>
                                                {request.status === 'REJECTED' && request.rejectionReason && (
                                                    <>
                                                        <h3 className="font-black text-base text-slate-900 mb-3">
                                                            Rejection Reason
                                                        </h3>
                                                        <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl">
                                                            <p className="text-sm text-red-700 font-medium">
                                                                {request.rejectionReason}
                                                            </p>
                                                        </div>
                                                    </>
                                                )}
                                                {request.paymentProof && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full mt-3"
                                                        onClick={() =>
                                                            setSelectedImage(`${API}/${request.paymentProof}`)
                                                        }
                                                    >
                                                        <ExternalLink size={14} className="mr-2" />
                                                        View Proof
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* CREDITS - PENDING TAB */}
                    <TabsContent value="credits-pending">
                        {/* Stats */}
                        <div className="grid sm:grid-cols-3 gap-4 mb-6">
                            <Card className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500 font-semibold uppercase">
                                            Pending
                                        </p>
                                        <p className="text-2xl font-black text-slate-900 mt-1">
                                            {pendingCredits.length}
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
                                                pendingCredits.reduce(
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
                                            {pendingCredits
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

                        {/* Requests List */}
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 size={32} className="text-green-600 animate-spin" />
                            </div>
                        ) : filteredPendingCredits.length === 0 ? (
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
                                    {filteredPendingCredits.map((request) => (
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
                                                                    ) || '0'}{' '}
                                                                    Credits
                                                                </p>
                                                                <p className="text-green-600 font-bold">
                                                                    {formatPrice(request.amount || 0)}
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
                                                                {request.transactionId || '—'}
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
                                                    {selectedCredit.userId?.name || 'Unknown User'}
                                                </span>{' '}
                                                ({selectedCredit.packCredits?.toLocaleString('en-IN') || '0'}{' '}
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

                    {/* CREDITS - HISTORY TAB */}
                    <TabsContent value="credits-history">
                        {loading ? (
                            <div className="flex justify-center py-20">
                                <Loader2 size={40} className="text-green-600 animate-spin" />
                            </div>
                        ) : filteredCreditHistory.length === 0 ? (
                            <Card className="p-16 text-center border-2 border-gray-200 rounded-2xl">
                                <History size={56} className="text-gray-300 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                                    No Credit History
                                </h2>
                                <p className="text-slate-600">
                                    Processed credit requests will appear here.
                                </p>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {filteredCreditHistory.map((request) => (
                                    <Card
                                        key={request._id}
                                        className="p-6 border-2 border-gray-200 rounded-2xl hover:shadow-lg transition-shadow"
                                    >
                                        <div className="grid md:grid-cols-4 gap-6">
                                            {/* User Info */}
                                            <div>
                                                <h3 className="font-black text-base text-slate-900 mb-3">
                                                    User Details
                                                </h3>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex items-start gap-2">
                                                        <User size={16} className="text-slate-400 mt-0.5" />
                                                        <div>
                                                            <p className="font-semibold text-slate-900">
                                                                {request.userId?.name || '—'}
                                                            </p>
                                                            <p className="text-slate-600 text-xs">
                                                                {request.userId?.email || '—'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Credits & Amount */}
                                            <div>
                                                <h3 className="font-black text-base text-slate-900 mb-3">
                                                    Credit Details
                                                </h3>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Zap size={16} className="text-green-600" />
                                                        <p className="font-bold text-slate-900">
                                                            {request.packCredits?.toLocaleString('en-IN') || '0'} Credits
                                                        </p>
                                                    </div>
                                                    <p className="text-green-600 font-bold text-lg">
                                                        {formatPrice(request.amount || 0)}
                                                    </p>
                                                    <p className="text-xs text-slate-500 font-mono">
                                                        TXN: {request.transactionId || '—'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Dates & Status */}
                                            <div>
                                                <h3 className="font-black text-base text-slate-900 mb-3">
                                                    Status & Timeline
                                                </h3>
                                                <div className="space-y-2 text-sm">
                                                    <StatusBadge status={request.status} />
                                                    <div className="flex items-start gap-2">
                                                        <Calendar size={14} className="text-slate-400 mt-0.5" />
                                                        <div className="text-xs">
                                                            <p className="text-slate-500">Submitted</p>
                                                            <p className="font-semibold text-slate-700">
                                                                {formatDate(request.createdAt)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {request.verifiedAt && (
                                                        <div className="flex items-start gap-2">
                                                            <Calendar size={14} className="text-slate-400 mt-0.5" />
                                                            <div className="text-xs">
                                                                <p className="text-slate-500">Verified</p>
                                                                <p className="font-semibold text-slate-700">
                                                                    {formatDate(request.verifiedAt)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions/Reason */}
                                            <div>
                                                {request.status === 'REJECTED' && request.rejectionReason && (
                                                    <>
                                                        <h3 className="font-black text-base text-slate-900 mb-3">
                                                            Rejection Reason
                                                        </h3>
                                                        <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl">
                                                            <p className="text-sm text-red-700 font-medium">
                                                                {request.rejectionReason}
                                                            </p>
                                                        </div>
                                                    </>
                                                )}
                                                {request.paymentProof && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full mt-3"
                                                        onClick={() =>
                                                            setSelectedImage(`${API}/${request.paymentProof}`)
                                                        }
                                                    >
                                                        <ExternalLink size={14} className="mr-2" />
                                                        View Proof
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
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
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6 cursor-pointer"
                >
                    <div className="relative max-w-5xl max-h-full">
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-2xl hover:bg-gray-100 transition-colors z-10"
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