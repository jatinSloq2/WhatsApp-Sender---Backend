import { createContext, useCallback, useContext, useState } from 'react';
import { useAuth } from './AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PlansContext = createContext(null);

export const usePlans = () => {
  const context = useContext(PlansContext);
  if (!context) {
    throw new Error('usePlans must be used within PlansProvider');
  }
  return context;
};

export const PlansProvider = ({ children }) => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);

  // ─── Get All Plans ────────────────────────────────────
  const getPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/plans`, {
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || 'Failed to fetch plans');
      }

      const body = await res.json();
      return body.data;
    } catch (error) {
      console.error('Error fetching plans:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Get Single Plan ──────────────────────────────────
  const getPlan = useCallback(async (planId) => {
    if (!planId) {
      throw new Error('Plan ID is required');
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/plans/${planId}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || 'Failed to fetch plan');
      }

      const body = await res.json();
      return body.data;
    } catch (error) {
      console.error('Error fetching plan:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Subscribe to Plan ────────────────────────────────
  const subscribeToPlan = useCallback(
    async (planId, billingCycle) => {
      if (!planId || !billingCycle) {
        throw new Error('Plan ID and billing cycle are required');
      }

      setLoading(true);
      try {
        const res = await fetch(`${API}/api/plans/subscribe`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId, billingCycle }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error?.message || 'Subscription failed');
        }

        const body = await res.json();

        // Update user context with new subscription data
        if (setUser && user) {
          setUser({
            ...user,
            subscription: body.data.subscription,
            credits: { 
              ...user.credits, 
              balance: body.data.creditsBalance 
            },
          });
        }

        return body.data;
      } catch (error) {
        console.error('Error subscribing to plan:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [user, setUser]
  );

  // ─── Cancel Subscription ──────────────────────────────
  const cancelSubscription = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/plans/cancel`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || 'Cancellation failed');
      }

      const body = await res.json();

      // Update user context with cancelled subscription
      if (setUser && user) {
        setUser({
          ...user,
          subscription: { 
            ...user.subscription, 
            isActive: false 
          },
        });
      }

      return body.data;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user, setUser]);

  const value = {
    loading,
    getPlans,
    getPlan,
    subscribeToPlan,
    cancelSubscription,
  };

  return (
    <PlansContext.Provider value={value}>
      {children}
    </PlansContext.Provider>
  );
};