import {
    LogOut,
    MessageSquare,
    Sparkles,
    ChevronDown,
    LayoutDashboard,
    Settings,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// shadcn/ui
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
        navigate("/");
    };

    const isPublicPage = ["/", "/login", "/signup", "/forgot-password"].includes(
        location.pathname
    );

    return (
        <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur border-b">
            <div
                className={`${isPublicPage ? "max-w-7xl mx-auto" : "w-full"
                    } h-16 px-6 flex items-center justify-between`}
            >
                {/* ── Brand ── */}
                <Link
                    to={user ? "/dashboard" : "/"}
                    className="flex items-center gap-3 group"
                >
                    <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center shadow-sm group-hover:bg-green-700 transition">
                        <MessageSquare className="w-5 h-5 text-white" />
                    </div>

                    <div className="flex flex-col leading-none">
                        <span className="text-lg font-bold tracking-tight text-gray-900">
                            Bulk<span className="text-green-600">Send</span>
                        </span>
                        <span className="text-[10px] text-gray-400 hidden sm:block">
                            Messaging & Chatbots
                        </span>
                    </div>
                </Link>

                {/* ── Right Section ── */}
                <div className="flex items-center gap-4">
                    {user ? (
                        <>
                            {/* Upgrade CTA */}
                            <button className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full bg-green-50 text-green-700 hover:bg-green-100 transition">
                                <Sparkles className="w-4 h-4" />
                                Upgrade
                            </button>

                            {/* User Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-2 rounded-full px-2 py-1.5 hover:bg-gray-100 transition outline-none">
                                        <div className="w-8 h-8 rounded-full bg-green-100 border border-green-300 flex items-center justify-center">
                                            <span className="text-sm font-semibold text-green-700">
                                                {user.name?.charAt(0).toUpperCase()}
                                            </span>
                                        </div>

                                        <span className="hidden sm:block text-sm font-medium text-gray-700">
                                            {user.name}
                                        </span>

                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                    </button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent
                                    align="end"
                                    className="w-48 rounded-xl"
                                >
                                    <DropdownMenuItem asChild>
                                        <Link
                                            to="/dashboard"
                                            className="flex items-center gap-2"
                                        >
                                            <LayoutDashboard className="w-4 h-4" />
                                            Dashboard
                                        </Link>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem asChild>
                                        <Link
                                            to="/settings"
                                            className="flex items-center gap-2"
                                        >
                                            <Settings className="w-4 h-4" />
                                            Settings
                                        </Link>
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem
                                        onClick={handleLogout}
                                        className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                                    >
                                        <LogOut className="w-4 h-4 mr-2" />
                                        Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="text-sm font-medium text-gray-600 hover:text-green-700 transition"
                            >
                                Login
                            </Link>

                            <Link
                                to="/signup"
                                className="text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition px-4 py-2 rounded-xl shadow-sm"
                            >
                                Get Started
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
