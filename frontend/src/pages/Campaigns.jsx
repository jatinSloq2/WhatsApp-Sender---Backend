import { useAuth } from "@/context/AuthContext";
import { useCampaign } from "@/context/CampaignContext";
import { useSession } from "@/context/SessionContext";
import { useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Image,
  Loader2,
  MessageSquare,
  RefreshCw,
  Send,
  Users,
  Video,
  X,
  XCircle,
  Zap
} from "lucide-react";

const Campaigns = () => {
  const { user } = useAuth();
  const { campaigns, loading, error, fetchCampaigns, sendMessage, sendBulkMessage, cancelCampaign } = useCampaign();
  const { sessions } = useSession();

  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("all");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Create Campaign Dialog
  const [createDialog, setCreateDialog] = useState(false);
  const [campaignType, setCampaignType] = useState("SINGLE");
  const [formData, setFormData] = useState({
    campaignName: "",
    receiver: "",
    numbers: "",
    text: "",
    caption: "",
    delay: "2000",
    sessionId: "", // Add sessionId to formData
  });
  const [mediaFile, setMediaFile] = useState(null);
  const [sending, setSending] = useState(false);

  // Cancel Dialog
  const [cancelDialog, setCancelDialog] = useState({ open: false, campaignId: null });
  const [cancelling, setCancelling] = useState(null);

  // Load campaigns on mount and when filters change
  useEffect(() => {
    loadCampaigns();
  }, [filterStatus, filterType, currentPage]);

  const loadCampaigns = async () => {
    try {
      const params = {
        page: currentPage,
        limit: 20,
        ...(filterStatus && filterStatus !== "ALL" && { status: filterStatus }),
        ...(filterType && filterType !== "ALL" && { type: filterType }),
      };
      const result = await fetchCampaigns(params);
      setTotalPages(result.pagination.totalPages);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle media file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setMessage({ type: "error", text: "File size must be less than 10MB" });
        return;
      }
      setMediaFile(file);
    }
  };

  // Handle campaign creation
  const handleCreateCampaign = async () => {
    console.log("Creating campaign with data:", formData, "Media file:", mediaFile);

    // Validation
    if (campaignType === "SINGLE" && !formData.receiver.trim()) {
      setMessage({ type: "error", text: "Receiver phone number is required" });
      return;
    }

    if (campaignType === "BULK" && !formData.numbers.trim()) {
      setMessage({ type: "error", text: "At least one phone number is required" });
      return;
    }

    if (!formData.text.trim() && !mediaFile) {
      setMessage({ type: "error", text: "Either text message or media file is required" });
      return;
    }

    // Check if session is selected
    if (!formData.sessionId) {
      setMessage({
        type: "error",
        text: "Please select a WhatsApp session"
      });
      return;
    }

    // Check if the selected session is connected
    const selectedSession = sessions.find((s) => s.sessionId === formData.sessionId);
    if (!selectedSession || selectedSession.status?.toUpperCase() !== "CONNECTED") {
      setMessage({
        type: "error",
        text: "Selected session is not connected. Please select a connected session or connect it first."
      });
      return;
    }

    setSending(true);
    setMessage({ type: "", text: "" });

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("campaignName", formData.campaignName || `Campaign ${Date.now()}`);
      formDataToSend.append("text", formData.text);
      formDataToSend.append("sessionId", formData.sessionId); // Add sessionId

      if (mediaFile) {
        formDataToSend.append("media", mediaFile);
        if (formData.caption) {
          formDataToSend.append("caption", formData.caption);
        }
      }

      if (campaignType === "SINGLE") {
        formDataToSend.append("receiver", formData.receiver);
        await sendMessage(formDataToSend);
        setMessage({
          type: "success",
          text: "Message sent successfully!"
        });
      } else {
        // Parse numbers (comma or newline separated)
        const numbersArray = formData.numbers
          .split(/[\n,]/)
          .map((n) => n.trim())
          .filter(Boolean);

        if (numbersArray.length === 0) {
          setMessage({ type: "error", text: "No valid phone numbers found" });
          return;
        }

        if (numbersArray.length > 1000) {
          setMessage({ type: "error", text: "Maximum 1000 numbers allowed per campaign" });
          return;
        }

        formDataToSend.append("numbers", JSON.stringify(numbersArray));
        formDataToSend.append("delay", formData.delay);

        await sendBulkMessage(formDataToSend);
        setMessage({
          type: "success",
          text: `Bulk campaign started! Sending to ${numbersArray.length} recipients.`
        });
      }

      // Reset form and close dialog
      setCreateDialog(false);
      resetForm();

    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSending(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      campaignName: "",
      receiver: "",
      numbers: "",
      text: "",
      caption: "",
      delay: "2000",
      sessionId: "", // Reset sessionId
    });
    setMediaFile(null);
    setCampaignType("SINGLE");
  };

  // Handle campaign cancellation
  const handleCancelCampaign = async (campaignId) => {
    setCancelling(campaignId);
    setMessage({ type: "", text: "" });

    try {
      await cancelCampaign(campaignId);
      setMessage({ type: "success", text: "Campaign cancelled successfully" });
      setCancelDialog({ open: false, campaignId: null });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setCancelling(null);
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusMap = {
      PENDING: { color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
      IN_PROGRESS: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: Loader2 },
      COMPLETED: { color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
      FAILED: { color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
      CANCELLED: { color: "bg-gray-100 text-gray-700 border-gray-200", icon: X },
    };

    const config = statusMap[status] || statusMap.PENDING;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} font-semibold`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  // Get media type icon
  const getMediaIcon = (mediaType) => {
    const iconMap = {
      image: Image,
      video: Video,
      audio: MessageSquare,
      document: FileText,
    };
    return iconMap[mediaType] || MessageSquare;
  };

  // Filter campaigns based on active tab
  const filteredCampaigns = campaigns.filter((campaign) => {
    if (activeTab === "all") return true;
    if (activeTab === "single") return campaign.type === "SINGLE";
    if (activeTab === "bulk") return campaign.type === "BULK";
    return true;
  });

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">

      {/* ══════════════ HERO ══════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center">
          <Badge className="inline-flex items-center gap-2 bg-white text-[#25D366] border border-[#25D366]/20 px-4 py-2 font-semibold text-sm mb-6 shadow-sm">
            <MessageSquare className="w-4 h-4" /> Campaign Management
          </Badge>

          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 tracking-tight leading-tight mb-4">
            Your Messaging
            <br />
            <span className="text-[#25D366]">Campaigns</span>
          </h1>

          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
            Create, manage, and track all your WhatsApp messaging campaigns in one place
          </p>

          <Button
            onClick={() => setCreateDialog(true)}
            className="bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold px-8 h-12 shadow-lg text-base"
          >
            <Send className="w-5 h-5 mr-2" />
            Create New Campaign
          </Button>
        </div>
      </section>

      {/* ══════════════ MESSAGE BANNER ══════════════ */}
      {message.text && (
        <section className="max-w-7xl mx-auto px-6 pb-6">
          <Alert
            className={`border-2 shadow-sm flex ${message.type === "success"
                ? "bg-green-50 border-green-200"
                : message.type === "info"
                  ? "bg-blue-50 border-blue-200"
                  : "bg-red-50 border-red-200"
              }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : message.type === "info" ? (
              <AlertCircle className="h-5 w-5 text-blue-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <AlertDescription
              className={`font-medium ${message.type === "success"
                  ? "text-green-700"
                  : message.type === "info"
                    ? "text-blue-700"
                    : "text-red-700"
                }`}
            >
              {message.text}
            </AlertDescription>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMessage({ type: "", text: "" })}
              className="ml-auto p-0 h-auto hover:bg-transparent"
            >
              <X size={16} />
            </Button>
          </Alert>
        </section>
      )}

      {/* ══════════════ STATS OVERVIEW ══════════════ */}
      <section className="max-w-7xl mx-auto px-6 pb-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              label: "Total Campaigns",
              value: campaigns.length,
              icon: MessageSquare,
              color: "bg-blue-50 text-blue-600",
            },
            {
              label: "Active",
              value: campaigns.filter((c) => c.status === "IN_PROGRESS").length,
              icon: Loader2,
              color: "bg-green-50 text-green-600",
            },
            {
              label: "Completed",
              value: campaigns.filter((c) => c.status === "COMPLETED").length,
              icon: CheckCircle2,
              color: "bg-purple-50 text-purple-600",
            },
            {
              label: "Credits Used",
              value: campaigns.reduce((sum, c) => sum + (c.credits?.totalCost || 0), 0),
              icon: Zap,
              color: "bg-amber-50 text-amber-600",
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-1">{label}</p>
                    <p className="text-3xl font-bold text-gray-900">{value.toLocaleString("en-IN")}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ══════════════ CAMPAIGNS TABLE ══════════════ */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="px-8 pt-8 pb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">All Campaigns</CardTitle>
                <CardDescription className="text-gray-600 mt-1">
                  View and manage your messaging campaigns
                </CardDescription>
              </div>
              <Button
                onClick={loadCampaigns}
                variant="outline"
                className="border border-gray-300 hover:border-[#25D366] font-medium"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 max-w-md">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="single">Single</TabsTrigger>
                <TabsTrigger value="bulk">Bulk</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Filters */}
            <div className="flex gap-4 mt-6">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="SINGLE">Single</SelectItem>
                  <SelectItem value="BULK">Bulk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            {loading && campaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-12 h-12 text-[#25D366] animate-spin mb-4" />
                <p className="text-gray-600 font-medium">Loading campaigns...</p>
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <MessageSquare className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium text-lg mb-2">No campaigns found</p>
                <p className="text-gray-500 text-sm mb-6">Create your first campaign to get started</p>
                <Button
                  onClick={() => setCreateDialog(true)}
                  className="bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Create Campaign
                </Button>
              </div>
            ) : (
              <>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 hover:bg-gray-50">
                        <TableHead className="font-semibold text-gray-900 py-4">Campaign</TableHead>
                        <TableHead className="font-semibold text-gray-900">Type</TableHead>
                        <TableHead className="font-semibold text-gray-900">Recipients</TableHead>
                        <TableHead className="font-semibold text-gray-900">Status</TableHead>
                        <TableHead className="font-semibold text-gray-900">Credits</TableHead>
                        <TableHead className="font-semibold text-gray-900">Date</TableHead>
                        <TableHead className="font-semibold text-gray-900 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCampaigns.map((campaign) => {
                        const MediaIcon = campaign.message?.hasMedia
                          ? getMediaIcon(campaign.message.mediaType)
                          : MessageSquare;

                        return (
                          <TableRow key={campaign._id} className="hover:bg-gray-50">
                            <TableCell className="py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                                  <MediaIcon className="w-5 h-5 text-[#25D366]" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{campaign.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {campaign.message?.text?.substring(0, 40)}
                                    {campaign.message?.text?.length > 40 ? "..." : ""}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-medium">
                                {campaign.type === "SINGLE" ? (
                                  <MessageSquare className="w-3 h-3 mr-1" />
                                ) : (
                                  <Users className="w-3 h-3 mr-1" />
                                )}
                                {campaign.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold text-gray-900">
                              {campaign.recipients?.total?.toLocaleString("en-IN") || 0}
                            </TableCell>
                            <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                            <TableCell className="font-semibold text-gray-900">
                              {campaign.credits?.totalCost?.toLocaleString("en-IN") || 0}
                            </TableCell>
                            <TableCell className="text-gray-600 font-medium">
                              {new Date(campaign.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </TableCell>
                            <TableCell className="text-right">
                              {["PENDING", "IN_PROGRESS"].includes(campaign.status) && (
                                <Button
                                  onClick={() => setCancelDialog({ open: true, campaignId: campaign._id })}
                                  variant="outline"
                                  size="sm"
                                  className="border border-red-300 text-red-700 hover:bg-red-50 font-medium"
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  Cancel
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <p className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        variant="outline"
                        size="sm"
                      >
                        Previous
                      </Button>
                      <Button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        variant="outline"
                        size="sm"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ══════════════ CREATE CAMPAIGN DIALOG ══════════════ */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Create New Campaign
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Send messages to single or multiple recipients
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Campaign Type */}
            <div>
              <label className="text-sm font-semibold text-gray-900 mb-2 block">
                Campaign Type
              </label>
              <Select value={campaignType} onValueChange={setCampaignType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SINGLE">Single Message</SelectItem>
                  <SelectItem value="BULK">Bulk Campaign</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Campaign Name */}
            <div>
              <label className="text-sm font-semibold text-gray-900 mb-2 block">
                Campaign Name (Optional)
              </label>
              <Input
                name="campaignName"
                placeholder="e.g., Summer Sale Promotion"
                value={formData.campaignName}
                onChange={handleInputChange}
              />
            </div>

            {/* WhatsApp Session Selection */}
            <div>
              <label className="text-sm font-semibold text-gray-900 mb-2 block">
                WhatsApp Session *
              </label>
              <Select
                value={formData.sessionId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, sessionId: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a WhatsApp session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.filter((s) => s.status?.toUpperCase() === "CONNECTED").length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                      No connected sessions available.
                      <br />
                      Please connect a session first.
                    </div>
                  ) : (
                    sessions
                      .filter((s) => s.status?.toUpperCase() === "CONNECTED")
                      .map((session) => (
                        <SelectItem key={session.sessionId} value={session.sessionId}>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="font-medium">{session.sessionId}</span>
                            {session.phone && (
                              <span className="text-xs text-gray-500">({session.phone})</span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Only connected sessions are shown. Session must be active to send messages.
              </p>
            </div>

            {/* Recipients */}
            {campaignType === "SINGLE" ? (
              <div>
                <label className="text-sm font-semibold text-gray-900 mb-2 block">
                  Receiver Phone Number *
                </label>
                <Input
                  name="receiver"
                  placeholder="e.g., 919876543210"
                  value={formData.receiver}
                  onChange={handleInputChange}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Include country code (e.g., 91 for India)
                </p>
              </div>
            ) : (
              <div>
                <label className="text-sm font-semibold text-gray-900 mb-2 block">
                  Phone Numbers * (Max 1000)
                </label>
                <Textarea
                  name="numbers"
                  placeholder="Enter phone numbers (one per line or comma separated)&#10;919876543210&#10;919876543211&#10;919876543212"
                  value={formData.numbers}
                  onChange={handleInputChange}
                  rows={6}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  One number per line or comma separated. Include country code.
                </p>
              </div>
            )}

            {/* Message Text */}
            <div>
              <label className="text-sm font-semibold text-gray-900 mb-2 block">
                Message Text *
              </label>
              <Textarea
                name="text"
                placeholder="Enter your message here..."
                value={formData.text}
                onChange={handleInputChange}
                rows={4}
              />
            </div>

            {/* Media Upload */}
            <div>
              <label className="text-sm font-semibold text-gray-900 mb-2 block">
                Attach Media (Optional)
              </label>
              <Input
                type="file"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                onChange={handleFileChange}
              />
              {mediaFile && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-green-700 font-medium">{mediaFile.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMediaFile(null)}
                    className="h-auto p-0 text-red-600 hover:text-red-700"
                  >
                    <X size={16} />
                  </Button>
                </div>
              )}
            </div>

            {/* Caption (if media) */}
            {mediaFile && (
              <div>
                <label className="text-sm font-semibold text-gray-900 mb-2 block">
                  Media Caption (Optional)
                </label>
                <Input
                  name="caption"
                  placeholder="Add a caption for your media"
                  value={formData.caption}
                  onChange={handleInputChange}
                />
              </div>
            )}

            {/* Delay (bulk only) */}
            {campaignType === "BULK" && (
              <div>
                <label className="text-sm font-semibold text-gray-900 mb-2 block">
                  Delay Between Messages (ms)
                </label>
                <Input
                  name="delay"
                  type="number"
                  min="1000"
                  max="10000"
                  value={formData.delay}
                  onChange={handleInputChange}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: 2000-5000ms to avoid blocking
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialog(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCampaign}
              disabled={sending}
              className="bg-[#25D366] hover:bg-[#20BD5A] text-white"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Campaign
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════ CANCEL CONFIRMATION DIALOG ══════════════ */}
      <Dialog
        open={cancelDialog.open}
        onOpenChange={(open) => setCancelDialog({ open, campaignId: null })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-red-600" />
              Cancel Campaign?
            </DialogTitle>
            <DialogDescription className="text-gray-600 pt-2">
              Are you sure you want to cancel this campaign? If credits were deducted, they will be refunded.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setCancelDialog({ open: false, campaignId: null })}
            >
              No, Keep It
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleCancelCampaign(cancelDialog.campaignId)}
              disabled={cancelling === cancelDialog.campaignId}
            >
              {cancelling === cancelDialog.campaignId ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Yes, Cancel Campaign"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Campaigns;