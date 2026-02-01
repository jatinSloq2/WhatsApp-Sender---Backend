import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Shows a full-screen spinner while auth state is being hydrated
const Spinner = () => (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
    </div>
);

// ─── Wraps pages that require login ───────────────────
export const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <Spinner />;
    if (!user) return <Navigate to="/login" replace />;
    return children;
};

// ─── Wraps pages that should only be seen when logged out ─
export const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <Spinner />;
    if (user) return <Navigate to="/dashboard" replace />;
    return children;
};