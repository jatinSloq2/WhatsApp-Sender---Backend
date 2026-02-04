import { createContext, useCallback, useContext, useState } from 'react';
import { useAuth } from './AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CreditsContext = createContext(null);

export const useCredits = () => {
  const context = useContext(CreditsContext);
  if (!context) throw new Error('useCredits must be used within CreditsProvider');
  return context;
};

export const CreditsProvider = ({ children }) => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);

  // ─── List all credit packs ────────────────────────
  const getCreditPacks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/credits/packs`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed to fetch credit packs');
      }
      return (await res.json()).data;
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Get current balance ──────────────────────────
  const getBalance = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/credits/balance`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed to fetch balance');
      }
      return (await res.json()).data.creditsBalance;
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Paginated transaction history ────────────────
  const getCreditHistory = useCallback(async (page = 1, limit = 20) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API}/api/credits/history?page=${page}&limit=${limit}`,
        { credentials: 'include' }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed to fetch history');
      }
      const body = await res.json();
      return { transactions: body.data, pagination: body.pagination };
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Submit UPI payment proof for a credit pack ──
  const submitCreditProof = useCallback(
    async ({ packId, amount, transactionId, paymentProof, credits }) => {
      if (!packId || !amount || !transactionId || !paymentProof || !credits)
        throw new Error('packId, amount, transactionId, paymentProof, and credits are required');

      setLoading(true);
      try {
        const formData = new FormData();
        formData.append('packId', packId);
        formData.append('credits', credits);
        formData.append('amount', amount.toString());
        formData.append('transactionId', transactionId);
        formData.append('paymentProof', paymentProof);

        const res = await fetch(`${API}/api/credits/buy-manual`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error?.message || err.message || 'Payment submission failed');
        }

        return (await res.json()).data;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ─── My own purchase requests (for status tracking) ─
  const getMyPurchaseRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/credits/my-purchase-requests`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed to fetch purchase requests');
      }
      return (await res.json()).data;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <CreditsContext.Provider
      value={{
        loading,
        getCreditPacks,
        getBalance,
        getCreditHistory,
        submitCreditProof,
        getMyPurchaseRequests,
      }}
    >
      {children}
    </CreditsContext.Provider>
  );
};