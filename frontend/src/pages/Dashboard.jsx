import { Send, TrendingUp, Users, Zap } from 'lucide-react';
import PageShell from '../components/PageShell';
import { useAuth } from '../context/AuthContext';

const stats = [
    { label: 'Campaigns Sent', value: '—', icon: Send, color: 'green' },
    { label: 'Credits Balance', value: '—', icon: Zap, color: 'green' },
    { label: 'Delivery Rate', value: '—', icon: TrendingUp, color: 'green' },
    { label: 'Total Recipients', value: '—', icon: Users, color: 'green' },
];

export default function Dashboard() {
    const { user } = useAuth();

    return (
        <PageShell
            title={`Welcome back, ${user?.name?.split(' ')[0] || 'User'} 👋`}
            subtitle="Here's an overview of your account"
        >
            {/* Stat cards row */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stagger">
                {stats.map(({ label, value, icon: Icon }) => (
                    <div
                        key={label}
                        className="animate-fadeIn bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-sm transition-shadow"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
                            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                                <Icon size={15} className="text-green-600" strokeWidth={2} />
                            </div>
                        </div>
                        <span className="text-2xl font-bold text-gray-900">{value}</span>
                    </div>
                ))}
            </div>

            {/* Placeholder for charts / recent activity */}
            <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-gray-200 border-dashed">
                <div className="text-center">
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <span className="text-green-600 text-lg">⟳</span>
                    </div>
                    <p className="text-sm font-medium text-gray-500">Activity & charts coming soon</p>
                    <p className="text-xs text-gray-400 mt-0.5">This section is under construction</p>
                </div>
            </div>
        </PageShell>
    );
}