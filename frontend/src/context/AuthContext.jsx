import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);   // true until first hydration attempt

  // ─── Hydrate on mount (restore session from cookie) ──
  const hydrate = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',   // sends cookies automatically
      });
      if (res.ok) {
        const { data } = await res.json();
        setUser(data);
      }
    } catch {
      // no valid session — that's fine
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { hydrate(); }, [hydrate]);

  // ─── Register ─────────────────────────────────────
  const register = async (name, email, password) => {
    const res = await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error?.message || 'Registration failed');
    setUser(body.data);
    return body.data;
  };

  // ─── Login ────────────────────────────────────────
  const login = async (email, password) => {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error?.message || 'Login failed');
    setUser(body.data);
    return body.data;
  };

  // ─── Logout ───────────────────────────────────────
  const logout = async () => {
    await fetch(`${API}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, hydrate }}>
      {children}
    </AuthContext.Provider>
  );
};