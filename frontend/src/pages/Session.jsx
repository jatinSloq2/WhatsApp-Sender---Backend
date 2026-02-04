import { useEffect, useRef, useState } from "react";
import { useSession } from "@/context/SessionContext";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

const POLL_INTERVAL = 3000;

const Session = () => {
  const {
    sessions,
    loading,
    error,
    fetchUserSessions,
    createSession,
    getSessionStatus,
    reconnectSession,
    deleteSession,
  } = useSession();

  const [sessionId, setSessionId] = useState("");
  const [activeSession, setActiveSession] = useState(null);
  const [qr, setQr] = useState(null);
  const pollingRef = useRef(null);

  // ─────────────────────────────
  // POLLING
  // ─────────────────────────────
  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const startPolling = (id) => {
    stopPolling();

    pollingRef.current = setInterval(async () => {
      try {
        const res = await getSessionStatus(id);

        if (res.status === "qr_ready" && res.qr) {
          setQr(res.qr);
        }

        if (res.status === "CONNECTED") {
          setQr(null);
          stopPolling();
        }
      } catch {
        stopPolling();
      }
    }, POLL_INTERVAL);
  };

  // ─────────────────────────────
  // ACTIONS
  // ─────────────────────────────
  const handleCreate = async () => {
    if (!sessionId) return;

    const res = await createSession(sessionId);
    const session = res.data;

    setActiveSession(session);
    if (session.qr) setQr(session.qr);

    startPolling(session.sessionId);
    setSessionId("");
  };

  const handleReconnect = async (id) => {
    const res = await reconnectSession(id);
    setActiveSession({ sessionId: id, status: res.data.status });
    startPolling(id);
  };

  const handleDisconnect = async (id) => {
    await deleteSession(id);
    if (activeSession?.sessionId === id) {
      setActiveSession(null);
      setQr(null);
      stopPolling();
    }
  };

  // ─────────────────────────────
  // INIT
  // ─────────────────────────────
  useEffect(() => {
    fetchUserSessions();
    return () => stopPolling();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">

      {/* HEADER */}
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Sessions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Input
            placeholder="Enter session id"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
          />
          <Button onClick={handleCreate} disabled={loading}>
            Create Session
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ACTIVE SESSION */}
      {activeSession && (
        <Card>
          <CardHeader>
            <CardTitle>Active Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{activeSession.sessionId}</p>
                <Badge variant="outline">
                  {sessions.find(s => s.sessionId === activeSession.sessionId)?.status
                    || activeSession.status}
                </Badge>
              </div>

              <Button
                variant="destructive"
                onClick={() => handleDisconnect(activeSession.sessionId)}
              >
                Disconnect
              </Button>
            </div>

            {qr && (
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  Scan QR in WhatsApp
                </p>
                <img
                  src={qr}
                  alt="QR"
                  className="w-60 h-60 border rounded"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* SESSION LIST */}
      <Card>
        <CardHeader>
          <CardTitle>Your Sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No sessions created yet.
            </p>
          )}

          {sessions.map((s) => (
            <div
              key={s.sessionId}
              className="flex items-center justify-between border rounded p-3"
            >
              <div className="space-y-1">
                <p className="font-medium">{s.sessionId}</p>
                <Badge
                  variant={
                    s.status === "CONNECTED"
                      ? "default"
                      : s.status === "DISCONNECTED"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {s.status}
                </Badge>
              </div>

              <div className="flex gap-2">
                {s.status === "DISCONNECTED" && (
                  <Button
                    variant="secondary"
                    onClick={() => handleReconnect(s.sessionId)}
                  >
                    Reconnect
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => setActiveSession(s)}
                >
                  Open
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => handleDisconnect(s.sessionId)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Session;
