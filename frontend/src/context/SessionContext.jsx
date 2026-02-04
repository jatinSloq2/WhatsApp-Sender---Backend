import {
    createSessionApi,
    deleteSessionApi,
    getSessionStatusApi,
    listAllSessionsApi,
    listUserSessionsApi,
    reconnectSessionApi,
} from "@/services/session.api";
import { createContext, useContext, useState } from "react";

const SessionContext = createContext(null);

export const SessionProvider = ({ children }) => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleError = (err) => {
        setError(err?.response?.data?.message || "Something went wrong");
    };

    // ─────────────────────────────
    // FETCH ALL SESSIONS (admin)
    // ─────────────────────────────
    const fetchAllSessions = async () => {
        try {
            setLoading(true);
            const res = await listAllSessionsApi();
            setSessions(res.data.data);
        } catch (err) {
            handleError(err);
        } finally {
            setLoading(false);
        }
    };

    // ─────────────────────────────
    // FETCH USER SESSIONS
    // ─────────────────────────────
    const fetchUserSessions = async () => {
        try {
            setLoading(true);
            const res = await listUserSessionsApi();
            setSessions(res.data.data);
        } catch (err) {
            handleError(err);
        } finally {
            setLoading(false);
        }
    };

    // ─────────────────────────────
    // CREATE SESSION
    // ─────────────────────────────
    const createSession = async (sessionId) => {
        try {
            setLoading(true);
            const res = await createSessionApi(sessionId);

            // add or update session in state
            setSessions((prev) => {
                const exists = prev.find(s => s.sessionId === sessionId);
                if (exists) return prev;
                return [res.data.data, ...prev];
            });

            return res.data;
        } catch (err) {
            handleError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // ─────────────────────────────
    // GET SINGLE STATUS
    // ─────────────────────────────
    const getSessionStatus = async (sessionId) => {
        const res = await getSessionStatusApi(sessionId);
        setSessions((prev) =>
            prev.map((s) =>
                s.sessionId === sessionId
                    ? { ...s, status: res.data.status, phone: res.data.phone }
                    : s
            )
        );

        return res.data;
    };

    // ─────────────────────────────
    // RECONNECT SESSION
    // ─────────────────────────────
    const reconnectSession = async (sessionId) => {
        try {
            setLoading(true);
            const res = await reconnectSessionApi(sessionId);

            setSessions((prev) =>
                prev.map((s) =>
                    s.sessionId === sessionId
                        ? { ...s, status: res.data.data.status }
                        : s
                )
            );

            return res.data;
        } catch (err) {
            handleError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // ─────────────────────────────
    // DELETE SESSION
    // ─────────────────────────────
    const deleteSession = async (sessionId) => {
        try {
            setLoading(true);
            await deleteSessionApi(sessionId);

            setSessions((prev) =>
                prev.filter((s) => s.sessionId !== sessionId)
            );
        } catch (err) {
            handleError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return (
        <SessionContext.Provider
            value={{
                sessions,
                loading,
                error,
                fetchAllSessions,
                fetchUserSessions,
                createSession,
                getSessionStatus,
                reconnectSession,
                deleteSession,
            }}
        >
            {children}
        </SessionContext.Provider>
    );
};

export const useSession = () => {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error("useSession must be used inside SessionProvider");
    }
    return context;
};
