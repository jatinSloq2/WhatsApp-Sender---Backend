import { createContext, useCallback, useContext, useState } from 'react';
import { useAuth } from './AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const UserContext = createContext(null);

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const { user: authUser, setUser: setAuthUser } = useAuth();
  const [loading, setLoading] = useState(false);

  // ─── Get Profile ──────────────────────────────────────
  const getProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/user/me`, {
        method: 'GET',
        credentials: 'include',
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || 'Failed to fetch profile');

      // Update the auth user state with full profile data
      if (setAuthUser) {
        setAuthUser(body.data);
      }
      return body.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setAuthUser]);

  // ─── Update Profile ───────────────────────────────────
  const updateProfile = useCallback(async (updates) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/user/me`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || 'Failed to update profile');

      // Update the auth user state with updated profile data
      if (setAuthUser) {
        setAuthUser(body.data);
      }
      return body.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setAuthUser]);

  // ─── Update Password ──────────────────────────────────
  const updatePassword = useCallback(async (currentPassword, newPassword) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/user/update-password`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || 'Failed to update password');

      return body;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Get Subscription Status ──────────────────────────
  const getSubscriptionStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/user/subscription`, {
        method: 'GET',
        credentials: 'include',
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || 'Failed to fetch subscription');

      return body.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <UserContext.Provider
      value={{
        user: authUser,
        loading,
        getProfile,
        updateProfile,
        updatePassword,
        getSubscriptionStatus,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};