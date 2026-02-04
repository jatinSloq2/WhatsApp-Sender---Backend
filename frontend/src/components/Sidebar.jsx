import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    BarChart2,
    BluetoothConnectedIcon,
    ChevronRight,
    CreditCard,
    Crown,
    LayoutDashboard,
    Menu,
    Package,
    Send,
    Settings,
    Shield,
    Sparkles,
    User,
    Users,
    Zap,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ADMIN_EMAILS = ['jatinsingh098hp@gmail.com'];

const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'main' },
    { to: '/session', label: 'Session', icon: BluetoothConnectedIcon, category: 'main' },
    { to: '/campaigns', label: 'Campaigns', icon: Send, category: 'main' },
    { to: '/plans', label: 'Plans', icon: Package, category: 'main' },
    { to: '/credits', label: 'Credits', icon: Zap, category: 'main', badge: 'New' },
    { to: '/analytics', label: 'Analytics', icon: BarChart2, category: 'insights' },
    { to: '/billing', label: 'Billing', icon: CreditCard, category: 'insights' },
    { to: '/profile', label: 'Profile', icon: User, category: 'settings' },
    { to: '/settings', label: 'Settings', icon: Settings, category: 'settings' },
    {
        to: '/admin/verification',
        label: 'Payment Verification',
        icon: Shield,
        adminOnly: true,
        category: 'admin',
    },
    {
        to: '/admin/users',
        label: 'User Management',
        icon: Users,
        adminOnly: true,
        category: 'admin',
    },
];

// Reusable sidebar content component
function SidebarContent({ onLinkClick, showBranding = false }) {
    const { user } = useAuth();

    const visibleItems = navItems.filter((item) => {
        if (!item.adminOnly) return true;
        return ADMIN_EMAILS.includes(user?.email);
    });

    // Group items by category
    const mainItems = visibleItems.filter((item) => item.category === 'main');
    const insightItems = visibleItems.filter((item) => item.category === 'insights');
    const settingItems = visibleItems.filter((item) => item.category === 'settings');
    const adminItems = visibleItems.filter((item) => item.category === 'admin');

    // Get user's current plan name and credits
    const currentPlanName = user?.subscription?.planId?.name || 'FREE';
    const isActivePlan = user?.subscription?.isActive || false;
    const currentCredits = user?.credits?.balance || 0;

    const NavSection = ({ title, items }) => (
        <div className="mb-6">
            {title && (
                <h3 className="px-3 mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                    {title}
                </h3>
            )}
            <nav className="flex flex-col gap-1">
                {items.map(({ to, label, icon: Icon, badge }) => (
                    <TooltipProvider key={to} delayDuration={300}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <NavLink
                                    to={to}
                                    onClick={onLinkClick}
                                    className={({ isActive }) =>
                                        [
                                            'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                                            isActive
                                                ? 'bg-gradient-to-r from-green-50 to-teal-50 text-green-700 shadow-sm border-2 border-green-200'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-2 border-transparent',
                                        ].join(' ')
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            <div
                                                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                                                    isActive
                                                        ? 'bg-white border-2 border-green-300 shadow-sm'
                                                        : 'bg-gray-100 border-2 border-gray-200 group-hover:bg-white group-hover:border-green-200'
                                                }`}
                                            >
                                                <Icon
                                                    size={18}
                                                    strokeWidth={isActive ? 2.5 : 2}
                                                    className={
                                                        isActive
                                                            ? 'text-green-600'
                                                            : 'text-gray-500 group-hover:text-green-600'
                                                    }
                                                />
                                            </div>
                                            <span className="flex-1">{label}</span>
                                            {badge && (
                                                <Badge className="bg-green-100 text-green-700 border-green-300 text-xs px-2 py-0 font-bold">
                                                    {badge}
                                                </Badge>
                                            )}
                                            {isActive && (
                                                <ChevronRight
                                                    size={16}
                                                    className="text-green-600"
                                                    strokeWidth={3}
                                                />
                                            )}
                                        </>
                                    )}
                                </NavLink>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                <p>{label}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ))}
            </nav>
        </div>
    );

    return (
        <div className="h-full overflow-y-auto scrollbar-hide">
            {/* App Branding Header - Only visible in mobile sidebar */}
            {showBranding && (
                <div className="px-4 pt-6 pb-4 border-b-2 border-gray-200 bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-teal-600 flex items-center justify-center shadow-md border-2 border-green-700">
                            <Send className="w-5 h-5 text-white" strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="text-xl font-black tracking-tight text-gray-900">
                                Bulk<span className="text-green-600">Send</span>
                            </span>
                            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                                Messaging Platform
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation Sections - Scrollable */}
            <div className="py-6 px-4">
                <NavSection items={mainItems} />

                {insightItems.length > 0 && (
                    <>
                        <Separator className="my-4 bg-gray-200" />
                        <NavSection title="Insights" items={insightItems} />
                    </>
                )}

                {settingItems.length > 0 && (
                    <>
                        <Separator className="my-4 bg-gray-200" />
                        <NavSection title="Settings" items={settingItems} />
                    </>
                )}

                {adminItems.length > 0 && (
                    <>
                        <Separator className="my-4 bg-gray-200" />
                        <NavSection title="Admin" items={adminItems} />
                    </>
                )}
            </div>

            {/* Plan & Credits Section - Scrollable */}
            <div className="px-4 pb-6 pt-4 border-t-2 border-gray-200 space-y-3">
                {/* Current Plan Card */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-white border-2 border-purple-300 flex items-center justify-center">
                            <Crown className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                                Current Plan
                            </p>
                            <div className="flex items-center gap-2">
                                <p className="text-lg font-black text-purple-700 truncate">
                                    {currentPlanName}
                                </p>
                                {isActivePlan && (
                                    <Badge className="bg-green-100 text-green-700 border-green-300 text-xs px-1.5 py-0 font-bold">
                                        Active
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                    {currentPlanName !== 'ENTERPRISE' && currentPlanName !== 'MASTER' && (
                        <NavLink to="/plans" onClick={onLinkClick}>
                            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-sm py-2.5 rounded-xl transition-all shadow-sm">
                                <Sparkles className="w-4 h-4 mr-2" />
                                Upgrade Plan
                            </Button>
                        </NavLink>
                    )}
                </div>

                {/* Credits Card */}
                {currentPlanName !== 'MASTER' && (
                    <div className="bg-gradient-to-br from-green-50 to-teal-50 border-2 border-green-200 rounded-2xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-white border-2 border-green-300 flex items-center justify-center">
                                <Zap className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                                    Credits
                                </p>
                                <p className="text-lg font-black text-green-700 truncate">
                                    {currentCredits.toLocaleString('en-IN')}
                                </p>
                            </div>
                        </div>

                        <NavLink to="/credits" onClick={onLinkClick}>
                            <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-sm py-2.5 rounded-xl transition-all shadow-sm">
                                Buy More Credits
                            </Button>
                        </NavLink>
                    </div>
                )}
            </div>
        </div>
    );
}

// Mobile menu button component (to be used in navbar)
export function MobileSidebarTrigger() {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden w-10 h-10 rounded-xl hover:bg-gray-100 transition-all"
                >
                    <Menu className="w-5 h-5 text-gray-600" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 border-r-2 border-gray-200">
                <SidebarContent onLinkClick={() => setOpen(false)} showBranding={true} />
            </SheetContent>
        </Sheet>
    );
}

// Desktop sidebar component
export default function Sidebar() {
    const location = useLocation();

    // Don't show sidebar on public pages
    const publicPages = ['/', '/login', '/signup', '/forgot-password', '/verify-otp'];
    if (
        publicPages.includes(location.pathname) ||
        location.pathname.startsWith('/reset-password')
    ) {
        return null;
    }

    return (
        <aside className="hidden lg:flex w-64 bg-white border-r-2 border-gray-200 h-[calc(100vh-64px)] sticky top-16 overflow-hidden">
            <SidebarContent onLinkClick={() => {}} showBranding={false} />
        </aside>
    );
}