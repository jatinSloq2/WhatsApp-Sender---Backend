import { createContext, useCallback, useContext, useState } from 'react';
import { useAuth } from './AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PlansContext = createContext(null);

export const usePlans = () => useContext(PlansContext);

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

            const body = await res.json();
            if (!res.ok) throw new Error(body.error?.message || 'Failed to fetch plans');

            return body.data;
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    // ─── Get Single Plan ──────────────────────────────────
    const getPlan = useCallback(async (planId) => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/plans/${planId}`, {
                credentials: 'include',
            });

            const body = await res.json();
            if (!res.ok) throw new Error(body.error?.message || 'Failed to fetch plan');

            return body.data;
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    // ─── Subscribe to Plan ────────────────────────────────
    const subscribeToPlan = useCallback(async (planId, billingCycle) => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/plans/subscribe`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId, billingCycle }),
            });

            const body = await res.json();
            if (!res.ok) throw new Error(body.error?.message || 'Subscription failed');

            // Update user context with new subscription data
            if (setUser && user) {
                setUser({
                    ...user,
                    subscription: body.data.subscription,
                    credits: { ...user.credits, balance: body.data.creditsBalance },
                });
            }

            return body.data;
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    }, [user, setUser]);

    // ─── Cancel Subscription ──────────────────────────────
    const cancelSubscription = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/plans/cancel`, {
                method: 'POST',
                credentials: 'include',
            });

            const body = await res.json();
            if (!res.ok) throw new Error(body.error?.message || 'Cancellation failed');

            // Update user context with cancelled subscription
            if (setUser && user) {
                setUser({
                    ...user,
                    subscription: { ...user.subscription, isActive: false },
                });
            }

            return body.data;
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    }, [user, setUser]);

    return (
        <PlansContext.Provider
            value={{
                loading,
                getPlans,
                getPlan,
                subscribeToPlan,
                cancelSubscription,
            }}
        >
            {children}
        </PlansContext.Provider>
    );
};