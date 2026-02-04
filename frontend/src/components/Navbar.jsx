import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Bell,
    ChevronDown,
    CreditCard,
    LayoutDashboard,
    LogOut,
    MessageSquare,
    Settings,
    Sparkles,
    User,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MobileSidebarTrigger } from './Sidebar';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const isPublicPage = ['/login', '/signup', '/forgot-password'].includes(
        location.pathname
    );

    const isHomePage = location.pathname === '/';

    // Get user plan info for badge
    const userPlan = user?.subscription?.planId?.name || 'FREE';
    const isActivePlan = user?.subscription?.isActive || false;
    const isPaidPlan = userPlan !== 'FREE' && user?.subscription?.isActive;

    return (
        <nav className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
            <div
                className={`${isPublicPage || isHomePage ? 'w-full' : 'w-full'
                    } h-16 px-6 flex items-center justify-between gap-4`}
            >
                {/* ── Left Section: Mobile Menu + Brand ── */}
                <div className="flex items-center gap-3">
                    {/* Mobile Sidebar Trigger - only show when user is logged in and not on public pages */}
                    {user && !isPublicPage && !isHomePage && <MobileSidebarTrigger />}

                    {/* Brand */}
                    <Link
                        to={user ? '/dashboard' : '/'}
                        className="flex items-center gap-3 group flex-shrink-0"
                    >
                        <div className="w-10 h-10 rounded-xl bg-[#25D366] flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                            <MessageSquare className="w-6 h-6 text-white" strokeWidth={2.5} />
                        </div>

                        <div className="flex flex-col leading-none">
                            <span className="text-xl font-bold tracking-tight text-gray-900">
                                WhatsBot
                            </span>
                            <span className="text-[10px] font-medium text-gray-500 hidden sm:block uppercase tracking-wide">
                                WhatsApp Platform
                            </span>
                        </div>
                    </Link>
                </div>

                {/* ── Right Section ── */}
                <div className="flex items-center gap-3">
                    {user ? (
                        <>
                            {/* Notifications - Hidden on small screens */}
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="hidden sm:flex relative w-10 h-10 hover:bg-gray-100"
                                        >
                                            <Bell className="w-5 h-5 text-gray-600" />
                                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#25D366] rounded-full border-2 border-white"></span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Notifications</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            {/* Upgrade CTA - Hidden on medium and smaller screens */}
                            {userPlan !== 'ENTERPRISE' && userPlan !== 'MASTER' && isActivePlan && (
                                <Link to="/plans">
                                    <Button className="hidden xl:flex items-center gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white font-medium shadow-sm h-9">
                                        <Sparkles className="w-4 h-4" />
                                        Upgrade Plan
                                    </Button>
                                </Link>
                            )}

                            {/* Vertical separator - Hidden on small screens */}
                            <div className="h-8 w-px bg-gray-200 hidden md:block" />

                            {/* User Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="flex items-center gap-2 px-2 sm:px-3 py-2 h-auto hover:bg-gray-100 border border-transparent hover:border-gray-200"
                                    >
                                        <div className="w-9 h-9 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center">
                                            <span className="text-sm font-bold text-[#25D366]">
                                                {user.name?.charAt(0).toUpperCase()}
                                            </span>
                                        </div>

                                        <div className="hidden md:flex flex-col items-start leading-none">
                                            <span className="text-sm font-semibold text-gray-900 max-w-[120px] truncate">
                                                {user.name}
                                            </span>
                                            <span className="text-xs text-gray-500 font-medium max-w-[120px] truncate">
                                                {user.email}
                                            </span>
                                        </div>

                                        <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent
                                    align="end"
                                    className="w-64 border border-gray-200 shadow-lg p-2"
                                >
                                    <DropdownMenuLabel className="px-3 py-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center">
                                                <span className="text-lg font-bold text-[#25D366]">
                                                    {user.name?.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-900 truncate">
                                                    {user.name}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>
                                    </DropdownMenuLabel>

                                    <DropdownMenuSeparator className="bg-gray-200" />

                                    <DropdownMenuItem asChild>
                                        <Link
                                            to="/dashboard"
                                            className="flex items-center gap-3 px-3 py-2.5 cursor-pointer font-medium"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                                <LayoutDashboard className="w-4 h-4 text-gray-600" />
                                            </div>
                                            Dashboard
                                        </Link>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem asChild>
                                        <Link
                                            to="/profile"
                                            className="flex items-center gap-3 px-3 py-2.5 cursor-pointer font-medium"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                                <User className="w-4 h-4 text-gray-600" />
                                            </div>
                                            Profile
                                        </Link>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem asChild>
                                        <Link
                                            to="/billing"
                                            className="flex items-center gap-3 px-3 py-2.5 cursor-pointer font-medium"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                                <CreditCard className="w-4 h-4 text-gray-600" />
                                            </div>
                                            Billing
                                            {isPaidPlan && (
                                                <Badge className="ml-auto bg-purple-50 text-purple-700 border-purple-200 font-semibold text-xs">
                                                    {userPlan}
                                                </Badge>
                                            )}
                                        </Link>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem asChild>
                                        <Link
                                            to="/settings"
                                            className="flex items-center gap-3 px-3 py-2.5 cursor-pointer font-medium"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                                <Settings className="w-4 h-4 text-gray-600" />
                                            </div>
                                            Settings
                                        </Link>
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator className="bg-gray-200" />

                                    <DropdownMenuItem
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer font-semibold text-red-600 focus:text-red-700 focus:bg-red-50"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                                            <LogOut className="w-4 h-4 text-red-600" />
                                        </div>
                                        Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <>
                            <Link to="/login">
                                <Button
                                    variant="ghost"
                                    className="font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                                >
                                    Login
                                </Button>
                            </Link>

                            <Link to="/signup">
                                <Button className="bg-[#25D366] hover:bg-[#20BD5A] text-white font-medium shadow-sm">
                                    <span className="hidden sm:inline">Get Started</span>
                                    <span className="sm:hidden">Sign Up</span>
                                </Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}