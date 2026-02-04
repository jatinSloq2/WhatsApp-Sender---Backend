import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    CreditCard,
    History,
    Loader2,
    Minus,
    Plus,
    RefreshCw,
    Search,
    Shield,
    TrendingUp,
    User,
    Users,
    X,
    Zap
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ═══════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════

const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const formatDateTime = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

export default function AdminUserManagement() {
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Users data
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [userDetails, setUserDetails] = useState(null);

    // Plans for assignment
    const [plans, setPlans] = useState([]);

    // Modal states
    const [showAddCredits, setShowAddCredits] = useState(false);
    const [showDeductCredits, setShowDeductCredits] = useState(false);
    const [showAssignPlan, setShowAssignPlan] = useState(false);

    // Form states
    const [creditAmount, setCreditAmount] = useState('');
    const [creditNote, setCreditNote] = useState('');
    const [selectedPlan, setSelectedPlan] = useState('');
    const [selectedBillingCycle, setSelectedBillingCycle] = useState('');
    const [planNote, setPlanNote] = useState('');
    const [processing, setProcessing] = useState(false);

    // ─────────────────────────────────────────────────────────────
    // Load Stats
    // ─────────────────────────────────────────────────────────────
    const loadStats = useCallback(async () => {
        try {
            const res = await fetch(`${API}/api/admin/stats`, {
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Failed to load stats');
            const data = await res.json();
            setStats(data.data);
        } catch (error) {
            console.error('Stats error:', error);
        }
    }, []);

    // ─────────────────────────────────────────────────────────────
    // Load Users
    // ─────────────────────────────────────────────────────────────
    const loadUsers = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(
                `${API}/api/admin/users?search=${searchQuery}&limit=100`,
                { credentials: 'include' }
            );
            if (!res.ok) throw new Error('Failed to load users');
            const data = await res.json();
            setUsers(data.data || []);
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    // ─────────────────────────────────────────────────────────────
    // Load Plans
    // ─────────────────────────────────────────────────────────────
    const loadPlans = useCallback(async () => {
        try {
            const res = await fetch(`${API}/api/plans`, { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to load plans');
            const data = await res.json();
            setPlans(data.data || []);
        } catch (error) {
            console.error('Plans error:', error);
        }
    }, []);

    // ─────────────────────────────────────────────────────────────
    // Load User Details
    // ─────────────────────────────────────────────────────────────
    const loadUserDetails = async (userId) => {
        try {
            const res = await fetch(`${API}/api/admin/users/${userId}`, {
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Failed to load user details');
            const data = await res.json();
            setUserDetails(data.data);
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        }
    };

    // ─────────────────────────────────────────────────────────────
    // Add Credits
    // ─────────────────────────────────────────────────────────────
    const handleAddCredits = async () => {
        if (!creditAmount || creditAmount <= 0) {
            setMessage({ type: 'error', text: 'Please enter a valid amount' });
            return;
        }

        setProcessing(true);
        try {
            const res = await fetch(
                `${API}/api/admin/users/${selectedUser._id}/add-credits`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount: parseInt(creditAmount),
                        note: creditNote || 'Credits added manually by admin',
                    }),
                }
            );

            if (!res.ok) throw new Error('Failed to add credits');

            const data = await res.json();
            setMessage({ type: 'success', text: data.message });
            setShowAddCredits(false);
            setCreditAmount('');
            setCreditNote('');
            loadUsers();
            if (selectedUser) loadUserDetails(selectedUser._id);
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setProcessing(false);
        }
    };

    // ─────────────────────────────────────────────────────────────
    // Deduct Credits
    // ─────────────────────────────────────────────────────────────
    const handleDeductCredits = async () => {
        if (!creditAmount || creditAmount <= 0) {
            setMessage({ type: 'error', text: 'Please enter a valid amount' });
            return;
        }

        setProcessing(true);
        try {
            const res = await fetch(
                `${API}/api/admin/users/${selectedUser._id}/deduct-credits`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount: parseInt(creditAmount),
                        note: creditNote || 'Credits deducted manually by admin',
                    }),
                }
            );

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error?.message || 'Failed to deduct credits');
            }

            const data = await res.json();
            setMessage({ type: 'success', text: data.message });
            setShowDeductCredits(false);
            setCreditAmount('');
            setCreditNote('');
            loadUsers();
            if (selectedUser) loadUserDetails(selectedUser._id);
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setProcessing(false);
        }
    };

    // ─────────────────────────────────────────────────────────────
    // Assign Plan
    // ─────────────────────────────────────────────────────────────
    const handleAssignPlan = async () => {
        if (!selectedPlan || !selectedBillingCycle) {
            setMessage({ type: 'error', text: 'Please select a plan and billing cycle' });
            return;
        }

        setProcessing(true);
        try {
            const res = await fetch(
                `${API}/api/admin/users/${selectedUser._id}/assign-plan`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        planId: selectedPlan,
                        billingCycle: selectedBillingCycle,
                        note: planNote || 'Plan assigned manually by admin',
                    }),
                }
            );

            if (!res.ok) throw new Error('Failed to assign plan');

            const data = await res.json();
            setMessage({ type: 'success', text: data.message });
            setShowAssignPlan(false);
            setSelectedPlan('');
            setSelectedBillingCycle('');
            setPlanNote('');
            loadUsers();
            if (selectedUser) loadUserDetails(selectedUser._id);
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setProcessing(false);
        }
    };

    // ─────────────────────────────────────────────────────────────
    // Initial Load
    // ─────────────────────────────────────────────────────────────
    useEffect(() => {
        loadStats();
        loadUsers();
        loadPlans();
    }, [loadStats, loadUsers, loadPlans]);

    // ─────────────────────────────────────────────────────────────
    // Access Control
    // ─────────────────────────────────────────────────────────────
    if (user?.email !== 'jatinsingh098hp@gmail.com') {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <Card className="max-w-md w-full p-10 text-center border-2 border-red-300 rounded-2xl">
                    <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
                    <p className="text-slate-600">Only admins can access this page.</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg border-2 border-purple-700">
                            <Users size={28} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900">
                                User Management
                            </h1>
                            <p className="text-sm text-slate-600 font-medium">
                                Manage users, credits, and subscriptions
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 rounded-xl hover:border-purple-600 font-semibold"
                        onClick={() => {
                            loadStats();
                            loadUsers();
                        }}
                        disabled={loading}
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </Button>
                </div>

                {/* Message Alert */}
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

                {/* Stats Cards */}
                {stats && (
                    <div className="grid sm:grid-cols-4 gap-4 mb-6">
                        <Card className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-500 font-semibold uppercase">
                                        Total Users
                                    </p>
                                    <p className="text-2xl font-black text-slate-900 mt-1">
                                        {stats.totalUsers}
                                    </p>
                                </div>
                                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                                    <Users size={20} className="text-blue-600" />
                                </div>
                            </div>
                        </Card>
                        <Card className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-500 font-semibold uppercase">
                                        Active Subs
                                    </p>
                                    <p className="text-2xl font-black text-slate-900 mt-1">
                                        {stats.activeSubscriptions}
                                    </p>
                                </div>
                                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                                    <CheckCircle2 size={20} className="text-green-600" />
                                </div>
                            </div>
                        </Card>
                        <Card className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-500 font-semibold uppercase">
                                        Total Credits
                                    </p>
                                    <p className="text-2xl font-black text-slate-900 mt-1">
                                        {stats.totalCreditsInCirculation.toLocaleString('en-IN')}
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
                                        New Today
                                    </p>
                                    <p className="text-2xl font-black text-slate-900 mt-1">
                                        {stats.usersCreatedToday}
                                    </p>
                                </div>
                                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                                    <TrendingUp size={20} className="text-purple-600" />
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Search Bar */}
                <Card className="mb-6 border-2 border-gray-200 rounded-xl">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3 px-4 py-3 bg-gray-100 rounded-xl">
                            <Search size={20} className="text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name or email…"
                                className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Users Table */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 size={32} className="text-purple-600 animate-spin" />
                    </div>
                ) : users.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Users size={48} className="text-gray-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">No Users Found</h2>
                        <p className="text-slate-600">Try adjusting your search criteria.</p>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {users.map((usr) => (
                            <Card
                                key={usr._id}
                                className="p-6 border-2 border-gray-200 rounded-2xl hover:shadow-lg transition-shadow"
                            >
                                <div className="grid md:grid-cols-5 gap-6">
                                    {/* User Info */}
                                    <div>
                                        <h3 className="font-black text-base text-slate-900 mb-3">
                                            User Info
                                        </h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-start gap-2">
                                                <User size={16} className="text-slate-400 mt-0.5" />
                                                <div>
                                                    <p className="font-semibold text-slate-900">
                                                        {usr.name}
                                                    </p>
                                                    <p className="text-slate-600 text-xs">{usr.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Shield size={14} className="text-slate-400" />
                                                <Badge
                                                    className={
                                                        usr.role === 'ADMIN'
                                                            ? 'bg-purple-100 text-purple-700'
                                                            : 'bg-blue-100 text-blue-700'
                                                    }
                                                >
                                                    {usr.role}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <Calendar size={12} />
                                                Joined {formatDate(usr.createdAt)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Credits */}
                                    <div>
                                        <h3 className="font-black text-base text-slate-900 mb-3">
                                            Credits
                                        </h3>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Zap size={20} className="text-amber-500" />
                                            <span className="text-2xl font-black text-slate-900">
                                                {usr.credits?.balance?.toLocaleString('en-IN') || 0}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            Last refilled:{' '}
                                            {usr.credits?.lastRefilled
                                                ? formatDate(usr.credits.lastRefilled)
                                                : 'Never'}
                                        </p>
                                    </div>

                                    {/* Subscription */}
                                    <div>
                                        <h3 className="font-black text-base text-slate-900 mb-3">
                                            Subscription
                                        </h3>
                                        {usr.subscription?.isActive ? (
                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2
                                                        size={14}
                                                        className="text-green-600"
                                                    />
                                                    <span className="font-semibold text-slate-900">
                                                        {usr.subscription.planId?.name || 'Unknown'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-600">
                                                    {usr.subscription.billingCycle}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    Expires: {formatDate(usr.subscription.expiresAt)}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <X size={14} />
                                                <span className="text-sm">No active plan</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Quick Stats */}
                                    <div>
                                        <h3 className="font-black text-base text-slate-900 mb-3">
                                            Activity
                                        </h3>
                                        <div className="space-y-2 text-xs text-slate-600">
                                            <p>
                                                Campaigns:{' '}
                                                <span className="font-bold text-slate-900">
                                                    {usr.campaignsUsedThisMonth || 0}
                                                </span>
                                            </p>
                                            {usr.lastLogin && (
                                                <p>Last login: {formatDate(usr.lastLogin)}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div>
                                        <h3 className="font-black text-base text-slate-900 mb-3">
                                            Actions
                                        </h3>
                                        <div className="space-y-2">
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                className="w-full text-xs"
                                                onClick={() => {
                                                    setSelectedUser(usr);
                                                    setShowAddCredits(true);
                                                }}
                                            >
                                                <Plus size={14} />
                                                Add Credits
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full text-xs"
                                                onClick={() => {
                                                    setSelectedUser(usr);
                                                    setShowDeductCredits(true);
                                                }}
                                            >
                                                <Minus size={14} />
                                                Deduct Credits
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full text-xs"
                                                onClick={() => {
                                                    setSelectedUser(usr);
                                                    setShowAssignPlan(true);
                                                }}
                                            >
                                                <CreditCard size={14} />
                                                Assign Plan
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-full text-xs"
                                                onClick={() => {
                                                    setSelectedUser(usr);
                                                    loadUserDetails(usr._id);
                                                }}
                                            >
                                                <History size={14} />
                                                View History
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Add Credits Modal */}
                {showAddCredits && selectedUser && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
                        <Card className="max-w-md w-full p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-black text-slate-900">
                                    Add Credits to {selectedUser.name}
                                </h2>
                                <button
                                    onClick={() => setShowAddCredits(false)}
                                    className="hover:bg-gray-100 rounded-lg p-2"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Credits Amount
                                    </label>
                                    <input
                                        type="number"
                                        value={creditAmount}
                                        onChange={(e) => setCreditAmount(e.target.value)}
                                        placeholder="Enter credits to add"
                                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Note (Optional)
                                    </label>
                                    <textarea
                                        value={creditNote}
                                        onChange={(e) => setCreditNote(e.target.value)}
                                        placeholder="Reason for adding credits"
                                        rows={3}
                                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none resize-none"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        variant="primary"
                                        className="flex-1"
                                        onClick={handleAddCredits}
                                        disabled={processing}
                                    >
                                        {processing ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <>
                                                <Plus size={18} />
                                                Add Credits
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowAddCredits(false)}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Deduct Credits Modal */}
                {showDeductCredits && selectedUser && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
                        <Card className="max-w-md w-full p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-black text-slate-900">
                                    Deduct Credits from {selectedUser.name}
                                </h2>
                                <button
                                    onClick={() => setShowDeductCredits(false)}
                                    className="hover:bg-gray-100 rounded-lg p-2"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="mb-4 p-3 bg-amber-50 border-2 border-amber-200 rounded-xl">
                                <p className="text-sm text-amber-800">
                                    Current Balance:{' '}
                                    <span className="font-bold">
                                        {selectedUser.credits?.balance || 0}
                                    </span>{' '}
                                    credits
                                </p>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Credits Amount
                                    </label>
                                    <input
                                        type="number"
                                        value={creditAmount}
                                        onChange={(e) => setCreditAmount(e.target.value)}
                                        placeholder="Enter credits to deduct"
                                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-red-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Note (Optional)
                                    </label>
                                    <textarea
                                        value={creditNote}
                                        onChange={(e) => setCreditNote(e.target.value)}
                                        placeholder="Reason for deducting credits"
                                        rows={3}
                                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-red-500 focus:outline-none resize-none"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        variant="danger"
                                        className="flex-1"
                                        onClick={handleDeductCredits}
                                        disabled={processing}
                                    >
                                        {processing ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <>
                                                <Minus size={18} />
                                                Deduct Credits
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowDeductCredits(false)}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Assign Plan Modal */}
                {showAssignPlan && selectedUser && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
                        <Card className="max-w-md w-full p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-black text-slate-900">
                                    Assign Plan to {selectedUser.name}
                                </h2>
                                <button
                                    onClick={() => setShowAssignPlan(false)}
                                    className="hover:bg-gray-100 rounded-lg p-2"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Select Plan
                                    </label>
                                    <select
                                        value={selectedPlan}
                                        onChange={(e) => setSelectedPlan(e.target.value)}
                                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                                    >
                                        <option value="">Choose a plan...</option>
                                        {plans.map((plan) => (
                                            <option key={plan._id} value={plan._id}>
                                                {plan.name} - ₹{plan.price} (
                                                {plan.creditsIncluded || 'Unlimited'} credits)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Billing Cycle
                                    </label>
                                    <select
                                        value={selectedBillingCycle}
                                        onChange={(e) => setSelectedBillingCycle(e.target.value)}
                                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                                    >
                                        <option value="">Choose billing cycle...</option>
                                        <option value="MONTHLY">Monthly</option>
                                        <option value="YEARLY">Yearly</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Note (Optional)
                                    </label>
                                    <textarea
                                        value={planNote}
                                        onChange={(e) => setPlanNote(e.target.value)}
                                        placeholder="Reason for assigning plan"
                                        rows={3}
                                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none resize-none"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        variant="primary"
                                        className="flex-1"
                                        onClick={handleAssignPlan}
                                        disabled={processing}
                                    >
                                        {processing ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <>
                                                <CreditCard size={18} />
                                                Assign Plan
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowAssignPlan(false)}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* User Details Modal */}
                {userDetails && selectedUser && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6 overflow-y-auto">
                        <Card className="max-w-2xl w-full p-6 my-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-black text-slate-900">
                                    Transaction History - {selectedUser.name}
                                </h2>
                                <button
                                    onClick={() => {
                                        setUserDetails(null);
                                        setSelectedUser(null);
                                    }}
                                    className="hover:bg-gray-100 rounded-lg p-2"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {userDetails.recentTransactions?.length > 0 ? (
                                    userDetails.recentTransactions.map((txn) => (
                                        <div
                                            key={txn._id}
                                            className="p-4 border-2 border-gray-200 rounded-xl"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <Badge
                                                    className={
                                                        txn.type === 'ADMIN_MANUAL'
                                                            ? 'bg-purple-100 text-purple-700'
                                                            : txn.type === 'PURCHASE'
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : 'bg-green-100 text-green-700'
                                                    }
                                                >
                                                    {txn.type}
                                                </Badge>
                                                <span
                                                    className={`font-bold text-lg ${txn.amount > 0
                                                        ? 'text-green-600'
                                                        : 'text-red-600'
                                                        }`}
                                                >
                                                    {txn.amount > 0 ? '+' : ''}
                                                    {txn.amount}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600 mb-1">
                                                {txn.meta?.note || 'No note'}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {formatDateTime(txn.createdAt)} • Balance after:{' '}
                                                {txn.balanceAfter}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-slate-500 py-8">
                                        No transactions found
                                    </p>
                                )}
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}