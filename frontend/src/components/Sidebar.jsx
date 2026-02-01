import {
    BarChart2,
    CreditCard,
    LayoutDashboard,
    Package,
    Send,
    Settings,
    User,
    Zap,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/campaigns', label: 'Campaigns', icon: Send },
    { to: '/plans', label: 'Plans', icon: Package },
    { to: '/credits', label: 'Credits', icon: Zap },
    { to: '/analytics', label: 'Analytics', icon: BarChart2 },
    { to: '/profile', label: 'Profile', icon: User },
    { to: '/billing', label: 'Billing', icon: CreditCard },
    { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
    return (
        <aside className="w-56 bg-white border-r border-gray-200 min-h-[calc(100vh-64px)] flex flex-col py-4 px-3">
            <nav className="flex flex-col gap-0.5">
                {navItems.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            [
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                                isActive
                                    ? 'bg-green-50 text-green-700'
                                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50',
                            ].join(' ')
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <Icon
                                    size={17}
                                    strokeWidth={isActive ? 2.2 : 1.8}
                                    className={isActive ? 'text-green-600' : 'text-gray-400'}
                                />
                                {label}
                                {/* Active indicator dot */}
                                {isActive && (
                                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500" />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}