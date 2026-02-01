import { LogOut, MessageSquare } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    // Pages that use the full-width public nav (no sidebar context)
    const isPublicPage = ['/', '/login', '/signup'].includes(location.pathname);

    return (
        <nav className="w-full bg-white border-b border-gray-200 sticky top-0 z-40">
            <div className={`${isPublicPage ? 'max-w-6xl mx-auto' : ''} flex items-center justify-between h-16 px-6`}>

                {/* ── Logo ── */}
                <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
                    <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center shadow-sm group-hover:bg-green-700 transition-colors">
                        <MessageSquare size={17} color="#fff" strokeWidth={2.5} />
                    </div>
                    <span className="text-lg font-bold text-gray-900 tracking-tight">
                        Bulk<span className="text-green-600">Send</span>
                    </span>
                </Link>

                {/* ── Right side ── */}
                <div className="flex items-center gap-4">
                    {user ? (
                        <>
                            {/* User avatar + name */}
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-green-300 flex items-center justify-center">
                                    <span className="text-sm font-semibold text-green-700">
                                        {user.name?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                                    {user.name}
                                </span>
                            </div>

                            {/* Logout */}
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50"
                            >
                                <LogOut size={15} strokeWidth={2} />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="text-sm font-medium text-gray-600 hover:text-green-700 transition-colors px-3 py-1.5"
                            >
                                Login
                            </Link>
                            <Link
                                to="/signup"
                                className="text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors px-4 py-1.75 rounded-lg shadow-sm"
                            >
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}