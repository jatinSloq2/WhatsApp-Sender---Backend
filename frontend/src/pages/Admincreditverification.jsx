import {
  AlertCircle,
  Check,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Shield,
  X,
  Zap,
  ExternalLink,
  Search,
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ─── shadcn-style primitives (same set as Credits.jsx) ─
function cn(...classes) { return classes.filter(Boolean).join(' '); }

const Card = ({ className, children, ...props }) => (
  <div className={cn('bg-white rounded-xl border border-slate-200 shadow-sm', className)} {...props}>{children}</div>
);
const CardHeader = ({ className, children }) => <div className={cn('p-6 pb-2', className)}>{children}</div>;
const CardContent = ({ className, children }) => <div className={cn('p-6 pt-0', className)}>{children}</div>;
const CardTitle = ({ className, children }) => <h3 className={cn('text-lg font-semibold text-slate-900', className)}>{children}</h3>;
const CardDescription = ({ className, children }) => <p className={cn('text-sm text-slate-500 mt-1', className)}>{children}</p>;

const Badge = ({ className, variant = 'default', children }) => {
  const v = { default:'bg-slate-100 text-slate-700', success:'bg-emerald-100 text-emerald-700', warning:'bg-amber-100 text-amber-700', danger:'bg-red-100 text-red-700', info:'bg-blue-100 text-blue-700' };
  return <span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full', v[variant], className)}>{children}</span>;
};

const Button = ({ className, variant='default', size='md', disabled, children, ...props }) => {
  const v = { default:'bg-slate-900 hover:bg-slate-800 text-white', primary:'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white', outline:'border-2 border-slate-200 bg-white hover:border-slate-300 text-slate-900', danger:'bg-red-600 hover:bg-red-700 text-white', ghost:'hover:bg-slate-100 text-slate-700' };
  const s = { sm:'px-3 py-1.5 text-xs', md:'px-5 py-2.5 text-sm', lg:'px-6 py-3 text-base' };
  return <button disabled={disabled} className={cn('inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed', v[variant], s[size], className)} {...props}>{children}</button>;
};

const Table = ({ children }) => <div className="w-full overflow-x-auto rounded-lg border border-slate-200"><table className="w-full text-sm">{children}</table></div>;
const TableHead = ({ children }) => <thead className="bg-slate-50 border-b border-slate-200">{children}</thead>;
const TableBody = ({ children }) => <tbody>{children}</tbody>;
const TableRow  = ({ className, children }) => <tr className={cn('border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors', className)}>{children}</tr>;
const TableHeader = ({ className, children }) => <th className={cn('px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider', className)}>{children}</th>;
const TableCell = ({ className, children }) => <td className={cn('px-4 py-3 text-slate-700', className)}>{children}</td>;

// ─── helpers ──────────────────────────────────────────
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });

// ─────────────────────────────────────────────────────
// MAIN ADMIN PAGE
// ─────────────────────────────────────────────────────
export default function AdminCreditVerification() {
  const { user } = useAuth();

  const [requests, setRequests]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState('');
  const [message, setMessage]     = useState({ type: '', text: '' });

  // ── selected request for detail / action ──
  const [selected, setSelected]   = useState(null);
  const [rejReason, setRejReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // ── fetch pending requests ──
  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/credits/pending-purchases`, { credentials: 'include' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed to fetch');
      }
      setRequests((await res.json()).data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  // ── approve / reject ──
  const handleAction = async (requestId, action) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/api/credits/verify-purchase/${requestId}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: rejReason || undefined }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Action failed');
      }
      setMessage({
        type: 'success',
        text: action === 'APPROVE'
          ? 'Credits approved and added to user balance.'
          : 'Request rejected.',
      });
      setSelected(null);
      setRejReason('');
      loadRequests(); // refresh
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // ── filtered list ──
  const filtered = requests.filter((r) =>
    search === '' ||
    r.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.userId?.email?.toLowerCase().includes(search.toLowerCase()) ||
    r.transactionId?.toLowerCase().includes(search.toLowerCase())
  );

  // ── guard ──
  if (user?.email !== 'jatinsingh098hp@gmail.com') {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="max-w-md w-full p-10 text-center">
          <AlertCircle size={40} className="text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
          <p className="text-slate-500 text-sm mt-1">Only admins can access this page.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Credit Verification</h1>
              <p className="text-sm text-slate-500">Approve or reject pending credit purchase requests</p>
            </div>
          </div>
          <Button variant="outline" size="md" onClick={loadRequests} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </Button>
        </div>

        {/* Message */}
        {message.text && (
          <div className={cn(
            'flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-semibold border-2 mb-5',
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-red-50 text-red-700 border-red-300'
          )}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{message.text}</span>
            <button onClick={() => setMessage({ type:'', text:'' })} className="ml-auto"><X size={16} /></button>
          </div>
        )}

        {/* Stats row */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Pending', count: requests.length, color: 'amber', icon: Zap },
            { label: 'Total ₹ Pending', count: `₹${requests.reduce((s, r) => s + (r.amount || 0), 0).toLocaleString('en-IN')}`, color: 'blue', icon: Zap },
            { label: 'Total Credits Pending', count: requests.reduce((s, r) => s + (r.packCredits || 0), 0).toLocaleString('en-IN'), color: 'emerald', icon: Zap },
          ].map(({ label, count, color, icon: Icon }) => (
            <Card key={label} className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">{label}</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{count}</p>
                </div>
                <div className={`w-10 h-10 bg-${color}-50 rounded-xl flex items-center justify-center`}>
                  <Icon size={20} className={`text-${color}-600`} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Search */}
        <Card className="mb-5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-100 rounded-lg">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or transaction ID…"
                className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Card className="border-red-200 bg-red-50 p-6 mb-5 flex items-center gap-3">
            <AlertCircle size={20} className="text-red-600" />
            <p className="text-red-700 text-sm font-semibold">{error}</p>
          </Card>
        )}

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Requests</CardTitle>
            <CardDescription>{filtered.length} request{filtered.length !== 1 ? 's' : ''} found</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 size={28} className="text-emerald-600 animate-spin" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 size={36} className="text-emerald-400 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">All clear — no pending requests.</p>
              </div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>User</TableHeader>
                    <TableHeader>Credits</TableHeader>
                    <TableHeader>Amount</TableHeader>
                    <TableHeader>Txn ID</TableHeader>
                    <TableHeader>Proof</TableHeader>
                    <TableHeader>Submitted</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((req) => (
                    <TableRow key={req._id} className={selected?._id === req._id ? 'bg-emerald-50' : ''}>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-slate-800">{req.userId?.name || '—'}</p>
                          <p className="text-xs text-slate-400">{req.userId?.email || '—'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                            <Zap size={14} className="text-emerald-600" />
                          </div>
                          <span className="font-bold">{req.packCredits?.toLocaleString('en-IN')}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-emerald-600">₹{req.amount?.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-500">{req.transactionId}</TableCell>
                      <TableCell>
                        {req.paymentProof ? (
                          <a
                            href={`${API}/${req.paymentProof}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-semibold"
                          >
                            View <ExternalLink size={12} />
                          </a>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-slate-400 whitespace-nowrap">{fmtDate(req.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="primary" size="sm" onClick={() => handleAction(req._id, 'APPROVE')} disabled={actionLoading}>
                            {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            Approve
                          </Button>
                          <Button
                            variant="ghost" size="sm"
                            className="text-slate-500 hover:text-red-600"
                            onClick={() => setSelected(selected?._id === req._id ? null : req)}
                            disabled={actionLoading}
                          >
                            <X size={14} /> Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Rejection reason inline panel */}
            {selected && (
              <div className="mt-4 p-5 bg-red-50 border-2 border-red-200 rounded-xl">
                <p className="text-sm font-bold text-red-900 mb-3">
                  Rejecting request for <span className="font-black">{selected.userId?.name}</span> ({selected.packCredits?.toLocaleString('en-IN')} credits)
                </p>
                <input
                  type="text"
                  value={rejReason}
                  onChange={(e) => setRejReason(e.target.value)}
                  placeholder="Optional: reason for rejection"
                  className="w-full px-4 py-2.5 bg-white border-2 border-red-300 rounded-lg text-sm focus:border-red-500 focus:outline-none mb-3"
                />
                <div className="flex gap-3">
                  <Button variant="danger" size="sm" onClick={() => handleAction(selected._id, 'REJECT')} disabled={actionLoading}>
                    {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />} Confirm Reject
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setSelected(null); setRejReason(''); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}