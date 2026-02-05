import { useEffect, useRef, useState } from "react";
import { useSession } from "@/context/SessionContext";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessageSquare,
  QrCode,
  RefreshCw,
  Shield,
  Smartphone,
  Trash2,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";

const POLL_INTERVAL = 3000;
const POLL_DURATION = 2 * 60 * 1000; // 2 minutes

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
  const [message, setMessage] = useState({ type: "", text: "" });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, sessionId: null });
  const [deletingSession, setDeletingSession] = useState(null);
  const [reconnectingSession, setReconnectingSession] = useState(null);
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
    const startTime = Date.now();

    pollingRef.current = setInterval(async () => {
      try {
        const elapsed = Date.now() - startTime;

        if (elapsed >= POLL_DURATION) {
          stopPolling();
          handleDisconnect(id);
          return;
        }

        const res = await getSessionStatus(id);
        const status = res.status?.toUpperCase();

        if (status === "QR_READY" && res.qr) {
          setQr(res.qr);
        }

        if (status === "CONNECTED") {
          setQr(null);
          stopPolling();
          setMessage({ type: "success", text: "WhatsApp session connected successfully!" });
        }
      } catch {
        // Ignore errors during polling
      }
    }, POLL_INTERVAL);
  };

  // ─────────────────────────────
  // ACTIONS
  // ─────────────────────────────
  const handleCreate = async () => {
    if (!sessionId.trim()) {
      setMessage({ type: "error", text: "Please enter a session ID" });
      return;
    }

    setMessage({ type: "", text: "" });
    try {
      const res = await createSession(sessionId);
      const session = res.data;

      setActiveSession(session);
      if (session.qr) setQr(session.qr);

      startPolling(session.sessionId);
      setSessionId("");
      setMessage({ type: "success", text: `Session "${session.sessionId}" created successfully!` });
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to create session" });
    }
  };

  const handleReconnect = async (id) => {
    setMessage({ type: "", text: "" });
    setReconnectingSession(id);
    try {
      const res = await reconnectSession(id);
      setActiveSession({ sessionId: id, status: res.data.status });
      startPolling(id);
      setMessage({ type: "info", text: "Reconnecting session... Scan QR code in WhatsApp" });
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to reconnect session" });
    } finally {
      setReconnectingSession(null);
    }
  };

  const handleDisconnect = async (id) => {
    setDeleteDialog({ open: false, sessionId: null });
    setMessage({ type: "", text: "" });
    setDeletingSession(id);
    try {
      await deleteSession(id);
      if (activeSession?.sessionId === id) {
        setActiveSession(null);
        setQr(null);
        stopPolling();
      }
      setMessage({ type: "success", text: "Session deleted successfully" });
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to delete session" });
    } finally {
      setDeletingSession(null);
    }
  };

  const openDeleteDialog = (id) => {
    setDeleteDialog({ open: true, sessionId: id });
  };

  // ─────────────────────────────
  // INIT
  // ─────────────────────────────
  useEffect(() => {
    fetchUserSessions();
    return () => stopPolling();
  }, []);

  // ─────────────────────────────
  // STATUS BADGE HELPER
  // ─────────────────────────────
  const getStatusBadge = (status) => {
    const statusUpper = status?.toUpperCase();
    
    switch (statusUpper) {
      case "CONNECTED":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200 font-semibold">
            <Wifi className="w-3 h-3 mr-1" /> Connected
          </Badge>
        );
      case "DISCONNECTED":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200 font-semibold">
            <WifiOff className="w-3 h-3 mr-1" /> Disconnected
          </Badge>
        );
      case "QR_READY":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-semibold">
            <QrCode className="w-3 h-3 mr-1" /> QR Ready
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border border-gray-300 font-semibold">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">
      
      {/* ══════════════ HERO ══════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center">
          <Badge className="inline-flex items-center gap-2 bg-white text-[#25D366] border border-[#25D366]/20 px-4 py-2 font-semibold text-sm mb-6 shadow-sm">
            <MessageSquare className="w-4 h-4" /> WhatsApp Session Management
          </Badge>

          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 tracking-tight leading-tight mb-4">
            Manage Your
            <br />
            <span className="text-[#25D366]">WhatsApp Sessions</span>
          </h1>

          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Create, connect, and manage multiple WhatsApp sessions for your bulk messaging campaigns.
          </p>
        </div>
      </section>

      {/* ══════════════ MESSAGE BANNER ══════════════ */}
      {message.text && (
        <section className="max-w-7xl mx-auto px-6 pb-6">
          <Alert
            variant={message.type === "error" ? "destructive" : "default"}
            className={`border shadow-sm ${
              message.type === "success"
                ? "bg-green-50 border-green-200"
                : message.type === "info"
                ? "bg-blue-50 border-blue-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : message.type === "info" ? (
              <AlertCircle className="h-4 w-4 text-blue-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription
              className={`font-medium ${
                message.type === "success"
                  ? "text-green-700"
                  : message.type === "info"
                  ? "text-blue-700"
                  : "text-red-700"
              }`}
            >
              {message.text}
            </AlertDescription>
          </Alert>
        </section>
      )}

      {/* ══════════════ CREATE SESSION ══════════════ */}
      <section className="max-w-7xl mx-auto px-6 pb-8">
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="px-8 pt-8 pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Smartphone className="w-6 h-6 text-[#25D366]" />
              Create New Session
            </CardTitle>
            <CardDescription className="text-gray-600">
              Enter a unique session ID to create a new WhatsApp connection
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="flex gap-4">
              <Input
                placeholder="e.g., my-whatsapp-session"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleCreate()}
                className="flex-1 border-gray-300 focus:border-[#25D366] focus:ring-[#25D366] font-medium h-11"
              />
              <Button
                onClick={handleCreate}
                disabled={loading || !sessionId.trim()}
                className="bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold px-8 shadow-sm h-11"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Create Session
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ══════════════ ACTIVE SESSION QR ══════════════ */}
      {activeSession && qr && (
        <section className="max-w-7xl mx-auto px-6 pb-8">
          <Card className="bg-blue-50 border border-blue-200 shadow-sm">
            <CardHeader className="px-8 pt-8 pb-4 text-center">
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
                <QrCode className="w-6 h-6 text-blue-600" />
                Scan QR Code
              </CardTitle>
              <CardDescription className="text-gray-700 font-medium">
                Open WhatsApp on your phone → Settings → Linked Devices → Link a Device
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className="flex flex-col items-center gap-4">
                <div className="bg-white p-6 rounded-xl border-2 border-blue-300 shadow-lg">
                  <img
                    src={qr}
                    alt="WhatsApp QR Code"
                    className="w-64 h-64"
                  />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-900 mb-1">Session: {activeSession.sessionId}</p>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-semibold">
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Waiting for scan...
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* ══════════════ HOW IT WORKS ══════════════ */}
      <section className="max-w-7xl mx-auto px-6 pb-12">
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="px-8 pt-8 pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900 text-center">
              How Sessions Work
            </CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Smartphone,
                  step: "01",
                  title: "Create Session",
                  desc: "Enter a unique session ID and click create. A QR code will be generated instantly.",
                },
                {
                  icon: QrCode,
                  step: "02",
                  title: "Scan QR Code",
                  desc: "Open WhatsApp on your phone and scan the QR code to link your device securely.",
                },
                {
                  icon: Wifi,
                  step: "03",
                  title: "Start Messaging",
                  desc: "Once connected, use this session for bulk messaging campaigns. Monitor status in real-time.",
                },
              ].map(({ icon: Icon, step, title, desc }) => (
                <div key={step} className="text-center">
                  <div className="relative mb-6">
                    <div className="mx-auto w-20 h-20 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center shadow-sm">
                      <Icon className="w-9 h-9 text-[#25D366]" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {step}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ══════════════ SESSIONS TABLE ══════════════ */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="px-8 pt-8 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-[#25D366]" />
                  Your Sessions
                </CardTitle>
                <CardDescription className="text-gray-600 mt-1">
                  Manage all your WhatsApp sessions in one place
                </CardDescription>
              </div>
              <Button
                onClick={fetchUserSessions}
                variant="outline"
                className="border border-gray-300 hover:border-[#25D366] font-medium"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            {loading && sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-12 h-12 text-[#25D366] animate-spin mb-4" />
                <p className="text-gray-600 font-medium">Loading sessions...</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <MessageSquare className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium text-lg mb-2">No sessions yet</p>
                <p className="text-gray-500 text-sm">Create your first WhatsApp session to get started</p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="font-semibold text-gray-900 py-4">Session ID</TableHead>
                      <TableHead className="font-semibold text-gray-900">Status</TableHead>
                      <TableHead className="font-semibold text-gray-900">Created</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => (
                      <TableRow key={session.sessionId} className="hover:bg-gray-50">
                        <TableCell className="font-semibold text-gray-900 py-4">
                          {session.sessionId}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(session.status)}
                        </TableCell>
                        <TableCell className="text-gray-600 font-medium">
                          {session.createdAt
                            ? new Date(session.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {session.status?.toUpperCase() === "DISCONNECTED" && (
                              <Button
                                onClick={() => handleReconnect(session.sessionId)}
                                disabled={reconnectingSession === session.sessionId}
                                variant="outline"
                                size="sm"
                                className="border border-blue-300 text-blue-700 hover:bg-blue-50 font-medium"
                              >
                                {reconnectingSession === session.sessionId ? (
                                  <>
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    Reconnecting...
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="w-3 h-3 mr-1" />
                                    Reconnect
                                  </>
                                )}
                              </Button>
                            )}
                            <Button
                              onClick={() => openDeleteDialog(session.sessionId)}
                              disabled={deletingSession === session.sessionId}
                              variant="destructive"
                              size="sm"
                              className="bg-red-600 hover:bg-red-700 font-medium"
                            >
                              {deletingSession === session.sessionId ? (
                                <>
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  Delete
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ══════════════ SECURITY INFO ══════════════ */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <Card className="bg-[#25D366] border-0 shadow-lg text-white">
          <CardContent className="px-8 py-10">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-3">Secure & Reliable</h2>
              <p className="text-white/90 text-lg max-w-2xl mx-auto">
                Your WhatsApp sessions are protected with enterprise-grade security
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Shield, text: "End-to-End Encrypted" },
                { icon: Wifi, text: "99.9% Uptime" },
                { icon: CheckCircle2, text: "Auto-Reconnect" },
              ].map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 text-center"
                >
                  <Icon className="w-10 h-10 mx-auto mb-3" />
                  <p className="font-medium text-base">{text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ══════════════ DELETE CONFIRMATION DIALOG ══════════════ */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, sessionId: null })}>
        <DialogContent className="sm:max-w-md border border-red-300">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-red-600" />
              Delete Session?
            </DialogTitle>
            <DialogDescription className="text-gray-600 pt-2">
              Are you sure you want to delete this session? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-red-50 border border-red-200 p-4 my-4">
            <p className="text-sm font-medium text-red-900 mb-1">
              Session ID: <span className="font-bold">{deleteDialog.sessionId}</span>
            </p>
            <p className="text-xs text-red-700">
              This will permanently disconnect and remove this WhatsApp session.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, sessionId: null })}
              className="border border-gray-300 font-medium"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => handleDisconnect(deleteDialog.sessionId)}
              disabled={deletingSession === deleteDialog.sessionId}
              className="bg-red-600 hover:bg-red-700 font-semibold"
            >
              {deletingSession === deleteDialog.sessionId ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Session
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Session;