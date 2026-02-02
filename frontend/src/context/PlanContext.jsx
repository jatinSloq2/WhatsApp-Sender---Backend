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

  // ─── Submit Payment Proof (Manual Subscription) ───────
  const submitPaymentProof = useCallback(
    async (proofData) => {
      const { planId, billingCycle, amount, transactionId, paymentProof, isFree } = proofData;

      if (!planId || !billingCycle) {
        throw new Error('Plan ID and billing cycle are required');
      }

      setLoading(true);
      try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('planId', planId);
        formData.append('billingCycle', billingCycle);

        // For paid plans, add payment details
        if (!isFree) {
          if (!amount || !transactionId || !paymentProof) {
            throw new Error('Amount, transaction ID, and payment proof are required for paid plans');
          }
          formData.append('amount', amount.toString());
          formData.append('transactionId', transactionId);
          formData.append('paymentProof', paymentProof);
        } else {
          // For free plans
          formData.append('isFree', 'true');
        }

        console.log('Submitting to API:', `${API}/api/plans/subscribe-manual`);
        console.log('FormData contents:', {
          planId,
          billingCycle,
          amount,
          transactionId,
          isFree,
          hasFile: !!paymentProof
        });

        const res = await fetch(`${API}/api/plans/subscribe-manual`, {
          method: 'POST',
          credentials: 'include',
          // DON'T set Content-Type header - browser will set it with boundary for multipart/form-data
          body: formData,
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error?.message || error.message || 'Payment submission failed');
        }

        const body = await res.json();

        // Update user context if subscription was activated (free plan)
        if (body.data?.subscription && setUser && user) {
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
        console.error('Error submitting payment proof:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [user, setUser]
  );

  // ─── Get My Payment Requests ──────────────────────────
  const getMyPaymentRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/plans/my-payment-requests`, {
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || 'Failed to fetch payment requests');
      }

      const body = await res.json();
      return body.data;
    } catch (error) {
      console.error('Error fetching payment requests:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

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
    submitPaymentProof,
    getMyPaymentRequests,
    cancelSubscription,
  };

  return (
    <PlansContext.Provider value={value}>
      {children}
    </PlansContext.Provider>
  );
};