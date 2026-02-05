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

export default function AdminUserManagement() {
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [userDetails, setUserDetails] = useState(null);

    const [plans, setPlans] = useState([]);

    const [showAddCredits, setShowAddCredits] = useState(false);
    const [showDeductCredits, setShowDeductCredits] = useState(false);
    const [showAssignPlan, setShowAssignPlan] = useState(false);

    const [creditAmount, setCreditAmount] = useState('');
    const [creditNote, setCreditNote] = useState('');
    const [selectedPlan, setSelectedPlan] = useState('');
    const [selectedBillingCycle, setSelectedBillingCycle] = useState('');
    const [planNote, setPlanNote] = useState('');
    const [processing, setProcessing] = useState(false);

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

    useEffect(() => {
        loadStats();
        loadUsers();
        loadPlans();
    }, [loadStats, loadUsers, loadPlans]);

    if (user?.email !== 'jatinsingh098hp@gmail.com') {
        return (
            <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
                <Card className="max-w-md w-full p-10 text-center border border-red-200 shadow-sm">
                    <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600">Only admins can access this page.</p>
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
                        <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                            <Users size={28} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                            <p className="text-sm text-gray-600 font-medium">
                                Manage users, credits, and subscriptions
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:border-[#25D366] font-medium"
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
                        className={`mb-6 border shadow-sm flex items-center justify-between ${message.type === 'success'
                                ? 'bg-green-50 border-green-200'
                                : 'bg-red-50 border-red-200'
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
                                    className={`font-medium ${message.type === 'success'
                                            ? 'text-green-700'
                                            : 'text-red-700'
                                        }`}
                                >
                                    {message.text}
                                </span>
                            </div>
                            <button
                                onClick={() => setMessage({ type: '', text: '' })}
                                className="hover:bg-gray-100 rounded-lg p-1 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </Alert>
                )}

                {/* Stats Cards */}
                {stats && (
                    <div className="grid sm:grid-cols-4 gap-4 mb-6">
                        <Card className="p-5 bg-white border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-600 font-medium uppercase">
                                        Total Users
                                    </p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">
                                        {stats.totalUsers}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center">
                                    <Users size={22} className="text-blue-600" />
                                </div>
                            </div>
                        </Card>
                        <Card className="p-5 bg-white border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-600 font-medium uppercase">
                                        Active Subs
                                    </p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">
                                        {stats.activeSubscriptions}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center">
                                    <CheckCircle2 size={22} className="text-green-600" />
                                </div>
                            </div>
                        </Card>
                        <Card className="p-5 bg-white border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-600 font-medium uppercase">
                                        Total Credits
                                    </p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">
                                        {stats.totalCreditsInCirculation.toLocaleString('en-IN')}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center">
                                    <Zap size={22} className="text-amber-600" />
                                </div>
                            </div>
                        </Card>
                        <Card className="p-5 bg-white border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-600 font-medium uppercase">
                                        New Today
                                    </p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">
                                        {stats.usersCreatedToday}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-center">
                                    <TrendingUp size={22} className="text-purple-600" />
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Search Bar */}
                <Card className="mb-6 border border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200">
                            <Search size={20} className="text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name or email…"
                                className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none font-medium"
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
                    <Card className="p-12 text-center bg-white border border-gray-200 shadow-sm">
                        <Users size={48} className="text-gray-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Users Found</h2>
                        <p className="text-gray-600">Try adjusting your search criteria.</p>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {users.map((usr) => (
                            <Card
                                key={usr._id}
                                className="p-6 border border-gray-200 hover:shadow-md transition-shadow bg-white"
                            >
                                <div className="grid md:grid-cols-5 gap-6">
                                    {/* User Info */}
                                    <div>
                                        <h3 className="font-bold text-base text-gray-900 mb-3">
                                            User Info
                                        </h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-start gap-2">
                                                <User size={16} className="text-gray-400 mt-0.5" />
                                                <div>
                                                    <p className="font-semibold text-gray-900">
                                                        {usr.name}
                                                    </p>
                                                    <p className="text-gray-600 text-xs">{usr.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Shield size={14} className="text-gray-400" />
                                                <Badge
                                                    className={
                                                        usr.role === 'ADMIN'
                                                            ? 'bg-purple-100 text-purple-700 border-purple-200'
                                                            : 'bg-blue-100 text-blue-700 border-blue-200'
                                                    }
                                                >
                                                    {usr.role}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <Calendar size={12} />
                                                Joined {formatDate(usr.createdAt)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Credits */}
                                    <div>
                                        <h3 className="font-bold text-base text-gray-900 mb-3">
                                            Credits
                                        </h3>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Zap size={20} className="text-[#25D366]" />
                                            <span className="text-2xl font-bold text-gray-900">
                                                {usr.credits?.balance?.toLocaleString('en-IN') || 0}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Last refilled:{' '}
                                            {usr.credits?.lastRefilled
                                                ? formatDate(usr.credits.lastRefilled)
                                                : 'Never'}
                                        </p>
                                    </div>

                                    {/* Subscription */}
                                    <div>
                                        <h3 className="font-bold text-base text-gray-900 mb-3">
                                            Subscription
                                        </h3>
                                        {usr.subscription?.isActive ? (
                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2
                                                        size={14}
                                                        className="text-green-600"
                                                    />
                                                    <span className="font-semibold text-gray-900">
                                                        {usr.subscription.planId?.name || 'Unknown'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-600">
                                                    {usr.subscription.billingCycle}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Expires: {formatDate(usr.subscription.expiresAt)}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <X size={14} />
                                                <span className="text-sm">No active plan</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Quick Stats */}
                                    <div>
                                        <h3 className="font-bold text-base text-gray-900 mb-3">
                                            Activity
                                        </h3>
                                        <div className="space-y-2 text-xs text-gray-600">
                                            <p>
                                                Campaigns:{' '}
                                                <span className="font-bold text-gray-900">
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
                                        <h3 className="font-bold text-base text-gray-900 mb-3">
                                            Actions
                                        </h3>
                                        <div className="space-y-2">
                                            <Button
                                                size="sm"
                                                className="w-full text-xs bg-[#25D366] hover:bg-[#20BD5A] text-white font-medium"
                                                onClick={() => {
                                                    setSelectedUser(usr);
                                                    setShowAddCredits(true);
                                                }}
                                            >
                                                <Plus size={14} className="mr-1" />
                                                Add Credits
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full text-xs border-gray-300 hover:border-red-500 hover:text-red-600 font-medium"
                                                onClick={() => {
                                                    setSelectedUser(usr);
                                                    setShowDeductCredits(true);
                                                }}
                                            >
                                                <Minus size={14} className="mr-1" />
                                                Deduct Credits
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full text-xs border-gray-300 hover:border-purple-500 hover:text-purple-600 font-medium"
                                                onClick={() => {
                                                    setSelectedUser(usr);
                                                    setShowAssignPlan(true);
                                                }}
                                            >
                                                <CreditCard size={14} className="mr-1" />
                                                Assign Plan
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-full text-xs hover:bg-gray-100 font-medium"
                                                onClick={() => {
                                                    setSelectedUser(usr);
                                                    loadUserDetails(usr._id);
                                                }}
                                            >
                                                <History size={14} className="mr-1" />
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
                        <Card className="max-w-md w-full p-6 bg-white border border-gray-200 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900">
                                    Add Credits to {selectedUser.name}
                                </h2>
                                <button
                                    onClick={() => setShowAddCredits(false)}
                                    className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">
                                        Credits Amount
                                    </label>
                                    <input
                                        type="number"
                                        value={creditAmount}
                                        onChange={(e) => setCreditAmount(e.target.value)}
                                        placeholder="Enter credits to add"
                                        className="w-full px-4 py-2.5 border border-gray-300 focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">
                                        Note (Optional)
                                    </label>
                                    <textarea
                                        value={creditNote}
                                        onChange={(e) => setCreditNote(e.target.value)}
                                        placeholder="Reason for adding credits"
                                        rows={3}
                                        className="w-full px-4 py-2.5 border border-gray-300 focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 focus:outline-none resize-none"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        className="flex-1 bg-[#25D366] hover:bg-[#20BD5A] text-white font-medium"
                                        onClick={handleAddCredits}
                                        disabled={processing}
                                    >
                                        {processing ? (
                                            <Loader2 size={18} className="animate-spin mr-2" />
                                        ) : (
                                            <Plus size={18} className="mr-2" />
                                        )}
                                        Add Credits
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowAddCredits(false)}
                                        className="border-gray-300"
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
                        <Card className="max-w-md w-full p-6 bg-white border border-gray-200 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900">
                                    Deduct Credits from {selectedUser.name}
                                </h2>
                                <button
                                    onClick={() => setShowDeductCredits(false)}
                                    className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="mb-4 p-3 bg-amber-50 border border-amber-200">
                                <p className="text-sm text-amber-900 font-medium">
                                    Current Balance:{' '}
                                    <span className="font-bold">
                                        {selectedUser.credits?.balance || 0}
                                    </span>{' '}
                                    credits
                                </p>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">
                                        Credits Amount
                                    </label>
                                    <input
                                        type="number"
                                        value={creditAmount}
                                        onChange={(e) => setCreditAmount(e.target.value)}
                                        placeholder="Enter credits to deduct"
                                        className="w-full px-4 py-2.5 border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">
                                        Note (Optional)
                                    </label>
                                    <textarea
                                        value={creditNote}
                                        onChange={(e) => setCreditNote(e.target.value)}
                                        placeholder="Reason for deducting credits"
                                        rows={3}
                                        className="w-full px-4 py-2.5 border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none resize-none"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium"
                                        onClick={handleDeductCredits}
                                        disabled={processing}
                                    >
                                        {processing ? (
                                            <Loader2 size={18} className="animate-spin mr-2" />
                                        ) : (
                                            <Minus size={18} className="mr-2" />
                                        )}
                                        Deduct Credits
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowDeductCredits(false)}
                                        className="border-gray-300"
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
                        <Card className="max-w-md w-full p-6 bg-white border border-gray-200 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900">
                                    Assign Plan to {selectedUser.name}
                                </h2>
                                <button
                                    onClick={() => setShowAssignPlan(false)}
                                    className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">
                                        Select Plan
                                    </label>
                                    <select
                                        value={selectedPlan}
                                        onChange={(e) => setSelectedPlan(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 focus:outline-none"
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
                                    <label className="block text-sm font-medium text-gray-900 mb-2">
                                        Billing Cycle
                                    </label>
                                    <select
                                        value={selectedBillingCycle}
                                        onChange={(e) => setSelectedBillingCycle(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 focus:outline-none"
                                    >
                                        <option value="">Choose billing cycle...</option>
                                        <option value="MONTHLY">Monthly</option>
                                        <option value="YEARLY">Yearly</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">
                                        Note (Optional)
                                    </label>
                                    <textarea
                                        value={planNote}
                                        onChange={(e) => setPlanNote(e.target.value)}
                                        placeholder="Reason for assigning plan"
                                        rows={3}
                                        className="w-full px-4 py-2.5 border border-gray-300 focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 focus:outline-none resize-none"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        className="flex-1 bg-[#25D366] hover:bg-[#20BD5A] text-white font-medium"
                                        onClick={handleAssignPlan}
                                        disabled={processing}
                                    >
                                        {processing ? (
                                            <Loader2 size={18} className="animate-spin mr-2" />
                                        ) : (
                                            <CreditCard size={18} className="mr-2" />
                                        )}
                                        Assign Plan
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowAssignPlan(false)}
                                        className="border-gray-300"
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
                        <Card className="max-w-2xl w-full p-6 my-6 bg-white border border-gray-200 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900">
                                    Transaction History - {selectedUser.name}
                                </h2>
                                <button
                                    onClick={() => {
                                        setUserDetails(null);
                                        setSelectedUser(null);
                                    }}
                                    className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {userDetails.recentTransactions?.length > 0 ? (
                                    userDetails.recentTransactions.map((txn) => (
                                        <div
                                            key={txn._id}
                                            className="p-4 border border-gray-200 bg-gray-50"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <Badge
                                                    className={
                                                        txn.type === 'ADMIN_MANUAL'
                                                            ? 'bg-purple-100 text-purple-700 border-purple-200'
                                                            : txn.type === 'PURCHASE'
                                                                ? 'bg-blue-100 text-blue-700 border-blue-200'
                                                                : 'bg-green-100 text-green-700 border-green-200'
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
                                            <p className="text-sm text-gray-700 mb-1 font-medium">
                                                {txn.meta?.note || 'No note'}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formatDateTime(txn.createdAt)} • Balance after:{' '}
                                                {txn.balanceAfter}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-500 py-8">
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