import { AlertCircle, Calendar, Check, CreditCard, ExternalLink, Loader2, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AdminPaymentVerification() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        loadPendingRequests();
    }, []);

    const loadPendingRequests = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API}/api/plans/pending-payments`, {
                credentials: 'include',
            });

            if (!res.ok) throw new Error('Failed to load requests');

            const data = await res.json();
            setRequests(data.data || []);
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (requestId, action) => {
        const reason = action === 'REJECT'
            ? prompt('Enter rejection reason:')
            : null;

        if (action === 'REJECT' && !reason) return;

        setProcessing(requestId);
        try {
            const res = await fetch(`${API}/api/plans/verify-payment/${requestId}`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, reason }),
            });

            if (!res.ok) throw new Error('Verification failed');

            const data = await res.json();
            setMessage({
                type: 'success',
                text: action === 'APPROVE' ? 'Payment approved!' : 'Payment rejected',
            });

            // Reload list
            await loadPendingRequests();
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setProcessing(null);
        }
    };

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

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <h1 className="text-4xl font-black text-slate-900 mb-2">Payment Verification</h1>
                <p className="text-slate-600 font-medium">
                    Review and approve pending payment requests
                </p>
            </div>

            {/* Message */}
            {message.text && (
                <div className="max-w-7xl mx-auto mb-6">
                    <div
                        className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-semibold border-2 ${message.type === 'success'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-red-50 text-red-700 border-red-300'
                            }`}
                    >
                        {message.type === 'success' ? <Check size={20} /> : <X size={20} />}
                        <span>{message.text}</span>
                    </div>
                </div>
            )}

            {/* Requests */}
            <div className="max-w-7xl mx-auto">
                {requests.length === 0 ? (
                    <div className="bg-white rounded-2xl border-2 border-slate-200 p-12 text-center">
                        <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">No Pending Requests</h2>
                        <p className="text-slate-600">All payment requests have been processed.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {requests.map((request) => (
                            <div
                                key={request._id}
                                className="bg-white rounded-2xl border-2 border-slate-200 p-6 hover:shadow-lg transition-shadow"
                            >
                                <div className="grid md:grid-cols-3 gap-6">
                                    {/* User & Plan Info */}
                                    <div>
                                        <h3 className="font-black text-lg text-slate-900 mb-4">Request Details</h3>

                                        <div className="space-y-3 text-sm">
                                            <div className="flex items-start gap-2">
                                                <User size={16} className="text-slate-400 mt-0.5" />
                                                <div>
                                                    <p className="font-semibold text-slate-900">{request.userId.name}</p>
                                                    <p className="text-slate-600">{request.userId.email}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-2">
                                                <CreditCard size={16} className="text-slate-400 mt-0.5" />
                                                <div>
                                                    <p className="font-semibold text-slate-900">
                                                        {request.planId.name} - {request.billingCycle}
                                                    </p>
                                                    <p className="text-emerald-600 font-bold">
                                                        {formatPrice(request.amount)}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        Base: {formatPrice(request.baseAmount)} + GST: {formatPrice(request.gstAmount)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-2">
                                                <Calendar size={16} className="text-slate-400 mt-0.5" />
                                                <div>
                                                    <p className="text-slate-600">Submitted</p>
                                                    <p className="font-semibold text-slate-900">{formatDate(request.createdAt)}</p>
                                                </div>
                                            </div>

                                            <div className="pt-2 border-t border-slate-200">
                                                <p className="text-xs text-slate-500 font-medium mb-1">Transaction ID</p>
                                                <p className="font-mono font-bold text-slate-900 text-sm break-all">
                                                    {request.transactionId}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payment Proof */}
                                    <div>
                                        <h3 className="font-black text-lg text-slate-900 mb-4">Payment Proof</h3>
                                        <div
                                            onClick={() => setSelectedImage(`${API}/${request.paymentProof}`)}
                                            className="relative aspect-[3/4] rounded-xl overflow-hidden border-2 border-slate-200 cursor-pointer hover:border-emerald-400 transition-colors group"
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
                                        <h3 className="font-black text-lg text-slate-900 mb-4">Actions</h3>
                                        <div className="space-y-3">
                                            <button
                                                onClick={() => handleVerify(request._id, 'APPROVE')}
                                                disabled={processing === request._id}
                                                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                                            >
                                                {processing === request._id ? (
                                                    <Loader2 size={20} className="animate-spin" />
                                                ) : (
                                                    <>
                                                        <Check size={20} />
                                                        Approve & Activate
                                                    </>
                                                )}
                                            </button>

                                            <button
                                                onClick={() => handleVerify(request._id, 'REJECT')}
                                                disabled={processing === request._id}
                                                className="w-full py-4 px-6 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                                            >
                                                {processing === request._id ? (
                                                    <Loader2 size={20} className="animate-spin" />
                                                ) : (
                                                    <>
                                                        <X size={20} />
                                                        Reject Payment
                                                    </>
                                                )}
                                            </button>

                                            <div className="pt-4 border-t border-slate-200">
                                                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                                    <strong>Approve:</strong> Activates subscription immediately and adds credits to user's account.
                                                </p>
                                                <p className="text-xs text-slate-600 font-medium leading-relaxed mt-2">
                                                    <strong>Reject:</strong> Sends notification to user. They can submit a new request.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Image Modal */}
            {selectedImage && (
                <div
                    onClick={() => setSelectedImage(null)}
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6"
                >
                    <div className="relative max-w-4xl max-h-full">
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl hover:bg-slate-100 transition-colors"
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