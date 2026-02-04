import { Route, Routes } from 'react-router-dom';

import Navbar from './components/Navbar';
import { AdminRoute, ProtectedRoute, PublicRoute } from './components/RouteGuards';
import Sidebar from './components/Sidebar';

// Public pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Authenticated pages
import AdminVerification from './pages/AdminPaymentVerification';
import Analytics from './pages/Analytics';
import Billing from './pages/Billing';
import Campaigns from './pages/Campaigns';
import Credits from './pages/Credits';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgetPassword';
import Plans from './pages/Plans';
import Profile from './pages/Profile';
import ResetPassword from './pages/Resetpassword';
import Settings from './pages/Settings';
import VerifyOTP from './pages/VerifyOtp';
import AdminUserManagement from './pages/AdminUserManagement';
import Session from './pages/Session';

export default function App() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Top navbar — always visible */}
      <Navbar />

      <div className="flex flex-1">
        {/* Sidebar - only shows on desktop for protected routes */}
        <Sidebar />

        {/* Main content area */}
        <main className="flex-1 overflow-x-hidden">
          <Routes>
            {/* ── Public routes (no sidebar) ── */}
            <Route path="/" element={<Home />} />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <Signup />
                </PublicRoute>
              }
            />
            <Route
              path="/verify-otp"
              element={
                <PublicRoute>
                  <VerifyOTP />
                </PublicRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              }
            />
            <Route
              path="/reset-password/:token"
              element={
                <PublicRoute>
                  <ResetPassword />
                </PublicRoute>
              }
            />

            {/* ── Admin routes (with sidebar on desktop, mobile menu on mobile) ── */}
            <Route
              path="/admin/verification"
              element={
                <AdminRoute>
                  <AdminVerification />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <AdminUserManagement />
                </AdminRoute>
              }
            />

            {/* ── Protected routes (with sidebar on desktop, mobile menu on mobile) ── */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/session"
              element={
                <ProtectedRoute>
                  <Session />
                </ProtectedRoute>
              }
            />
            <Route
              path="/campaigns"
              element={
                <ProtectedRoute>
                  <Campaigns />
                </ProtectedRoute>
              }
            />
            <Route
              path="/plans"
              element={
                <ProtectedRoute>
                  <Plans />
                </ProtectedRoute>
              }
            />
            <Route
              path="/credits"
              element={
                <ProtectedRoute>
                  <Credits />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/billing"
              element={
                <ProtectedRoute>
                  <Billing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}