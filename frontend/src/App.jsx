import { Route, Routes } from 'react-router-dom';

import Navbar from './components/Navbar';
import { ProtectedRoute, PublicRoute } from './components/RouteGuards';
import Sidebar from './components/Sidebar';

// Public pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Authenticated pages
import Analytics from './pages/Analytics';
import Billing from './pages/Billing';
import Campaigns from './pages/Campaigns';
import Credits from './pages/Credits';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgetPassword';
import Plans from './pages/Plans';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import VerifyOTP from './pages/VerifyOtp';

export default function App() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Top navbar — always visible */}
      <Navbar />

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

        {/* ── Protected routes (with sidebar) ── */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div className="flex flex-1">
                <Sidebar />
                <Dashboard />
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/campaigns"
          element={
            <ProtectedRoute>
              <div className="flex flex-1">
                <Sidebar />
                <Campaigns />
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/plans"
          element={
            <ProtectedRoute>
              <div className="flex flex-1">
                <Sidebar />
                <Plans />
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/credits"
          element={
            <ProtectedRoute>
              <div className="flex flex-1">
                <Sidebar />
                <Credits />
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <div className="flex flex-1">
                <Sidebar />
                <Analytics />
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <div className="flex flex-1">
                <Sidebar />
                <Profile />
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing"
          element={
            <ProtectedRoute>
              <div className="flex flex-1">
                <Sidebar />
                <Billing />
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <div className="flex flex-1">
                <Sidebar />
                <Settings />
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}