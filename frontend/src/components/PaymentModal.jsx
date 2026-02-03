import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
    AlertCircle,
    CheckCircle2,
    Copy,
    CreditCard,
    Loader2,
    QrCode,
    Upload,
} from "lucide-react";
import { useState } from "react";


export function PaymentModal({ item, onClose, onSubmitProof, extraPayload = {} }) {
    const UPI_ID = import.meta.env.VITE_UPI_ID;

    const [copied, setCopied] = useState(false);
    const [paymentProof, setProof] = useState(null);
    const [transactionId, setTxnId] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [previewUrl, setPreviewUrl] = useState("");
    const [error, setError] = useState("");
    const [qrLoaded, setQrLoaded] = useState(false);

    const { name, baseAmount, gstAmount, totalAmount, subtitle } = item;

    const upiLink = `upi://pay?pa=${UPI_ID}&pn=BulkSend&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(name)}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(upiLink)}`;

    /* ── helpers ── */
    const copyToClipboard = () => {
        navigator.clipboard.writeText(UPI_ID);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { setError("File must be under 5 MB"); return; }
        if (!file.type.startsWith("image/")) { setError("Only image files are allowed"); return; }
        setProof(file);
        setPreviewUrl(URL.createObjectURL(file));
        setError("");
    };

    const handleSubmit = async () => {
        setError("");
        if (!paymentProof) { setError("Please upload a payment screenshot"); return; }
        if (!transactionId.trim()) { setError("Please enter your Transaction / UTR ID"); return; }
        if (transactionId.trim().length < 10) { setError("Transaction ID looks too short — double-check it"); return; }

        setSubmitting(true);
        try {
            await onSubmitProof({
                transactionId: transactionId.trim(),
                paymentProof,
                amount: totalAmount,
                ...extraPayload,
            });
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || "Submission failed — please try again");
        } finally {
            setSubmitting(false);
        }
    };

    /* ── render ── */
    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-3xl border-0 p-0 shadow-2xl [&>button.absolute]:hidden">
                {/* ── gradient header ── */}
                <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 rounded-t-3xl">
                    <DialogHeader className="p-0 space-y-1">
                        <DialogTitle className="text-2xl font-black text-white leading-tight">
                            Complete Payment
                        </DialogTitle>
                        <DialogDescription className="text-green-100 text-sm font-semibold">
                            {subtitle || name}
                        </DialogDescription>
                    </DialogHeader>
                    {/* custom close — replaces the default X */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white"
                    >
                        ✕
                    </button>
                </div>

                {/* ── body ── */}
                <div className="p-6 space-y-5">

                    {/* error */}
                    {error && (
                        <Alert variant="destructive" className="bg-red-50 border-2 border-red-300 rounded-xl">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <AlertDescription className="text-red-700 font-medium">{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* ── amount breakdown ── */}
                    <Card className="bg-gray-50 border-2 border-gray-300 rounded-2xl shadow-none">
                        <CardContent className="pt-5 pb-5 px-5">
                            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2 mb-3">
                                <CreditCard size={18} className="text-green-600" /> Payment Breakdown
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Base Amount</span>
                                    <span className="font-semibold text-gray-800">₹{baseAmount.toLocaleString("en-IN")}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">GST (18%)</span>
                                    <span className="font-semibold text-gray-800">₹{gstAmount.toLocaleString("en-IN")}</span>
                                </div>
                                <div className="border-t-2 border-gray-300 pt-2 mt-2 flex justify-between text-base">
                                    <span className="font-black text-gray-800">Total</span>
                                    <span className="font-black text-green-600">₹{totalAmount.toLocaleString("en-IN")}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── QR code ── */}
                    <Card className="bg-gradient-to-br from-green-50 to-teal-50 border-2 border-green-300 rounded-2xl shadow-none">
                        <CardContent className="pt-6 pb-5 px-5 text-center">
                            <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                <QrCode size={28} className="text-white" />
                            </div>
                            <h3 className="font-bold text-gray-800 mb-1">Scan QR Code to Pay</h3>
                            <p className="text-gray-500 text-xs mb-4 font-medium">Open any UPI app and scan</p>

                            <div className="bg-white rounded-2xl p-4 inline-block shadow-md border-2 border-gray-200">
                                {!qrLoaded && <Skeleton className="w-56 h-56 rounded-lg" />}
                                <img
                                    src={qrCodeUrl}
                                    alt="UPI QR"
                                    className={`w-56 h-56 ${!qrLoaded ? "hidden" : ""}`}
                                    onLoad={() => setQrLoaded(true)}
                                />
                            </div>

                            <p className="text-xs text-gray-400 mt-3 font-medium">
                                Google Pay · PhonePe · Paytm · BHIM & all UPI apps
                            </p>
                        </CardContent>
                    </Card>

                    {/* ── UPI ID copy row ── */}
                    <Card className="bg-blue-50 border-2 border-blue-200 rounded-2xl shadow-none">
                        <CardContent className="pt-5 pb-5 px-5">
                            <h3 className="font-bold text-gray-800 text-sm mb-3">Or Pay Using UPI ID</h3>
                            <div className="flex items-center gap-3">
                                <Input
                                    value={UPI_ID}
                                    readOnly
                                    className="flex-1 border-2 border-blue-300 rounded-xl font-mono font-bold text-gray-800 bg-white focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-blue-300"
                                />
                                <Button
                                    variant="default"
                                    onClick={copyToClipboard}
                                    className={`px-4 rounded-xl font-semibold text-sm transition-all ${copied
                                        ? "bg-green-100 text-green-700 border-2 border-green-300 hover:bg-green-100"
                                        : "bg-blue-600 hover:bg-blue-700 text-white"
                                        }`}
                                >
                                    {copied
                                        ? <><CheckCircle2 size={15} className="mr-1.5" /> Copied!</>
                                        : <><Copy size={15} className="mr-1.5" /> Copy</>
                                    }
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 font-medium">
                                Amount: <span className="font-black text-green-600">₹{totalAmount.toLocaleString("en-IN")}</span>
                            </p>
                        </CardContent>
                    </Card>

                    {/* ── upload proof section ── */}
                    <Card className="bg-amber-50 border-2 border-amber-300 rounded-2xl shadow-none">
                        <CardContent className="pt-5 pb-5 px-5">
                            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2 mb-4">
                                <Upload size={18} className="text-amber-600" /> Upload Payment Proof
                            </h3>

                            {/* transaction ID */}
                            <div className="mb-4 space-y-1.5">
                                <Label className="text-sm font-semibold text-gray-800">
                                    Transaction ID / UTR <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="text"
                                    value={transactionId}
                                    onChange={(e) => { setTxnId(e.target.value); setError(""); }}
                                    placeholder="12-digit transaction ID"
                                    className="border-2 border-amber-300 rounded-xl bg-white focus-visible:ring-2 focus-visible:ring-green-200 focus-visible:border-green-600 focus-visible:ring-offset-0"
                                />
                                <p className="text-xs text-gray-500">Find this in your payment app after the transaction</p>
                            </div>

                            {/* screenshot upload */}
                            <div className="mb-4 space-y-1.5">
                                <Label className="text-sm font-semibold text-gray-800">
                                    Payment Screenshot <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="pm-proof-upload"
                                />
                                <label
                                    htmlFor="pm-proof-upload"
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-dashed border-amber-300 rounded-xl font-medium text-gray-600 hover:border-green-600 hover:text-green-600 cursor-pointer transition-all"
                                >
                                    <Upload size={18} />
                                    {paymentProof ? paymentProof.name : "Choose screenshot (max 5 MB)"}
                                </label>
                            </div>

                            {/* preview */}
                            {previewUrl && (
                                <div className="mb-4 space-y-1.5">
                                    <Label className="text-sm font-semibold text-gray-800">Preview</Label>
                                    <img
                                        src={previewUrl}
                                        alt="Proof preview"
                                        className="w-full max-w-xs rounded-xl border-2 border-amber-300 shadow-sm"
                                    />
                                </div>
                            )}

                            {/* submit */}
                            <Button
                                onClick={handleSubmit}
                                disabled={submitting || !paymentProof || !transactionId.trim()}
                                className={`w-full rounded-xl font-bold text-base shadow-md transition-all ${submitting || !paymentProof || !transactionId.trim()
                                    ? "bg-gray-200 text-gray-400 hover:bg-gray-200 shadow-none cursor-not-allowed"
                                    : "bg-green-600 hover:bg-green-700 text-white shadow-green-200"
                                    }`}
                            >
                                {submitting
                                    ? <><Loader2 size={20} className="animate-spin mr-2" /> Submitting…</>
                                    : <><CheckCircle2 size={20} className="mr-2" /> Submit for Verification</>
                                }
                            </Button>

                            <p className="text-xs text-gray-500 mt-3 text-center font-medium">
                                Verification within 24 hours · confirmation email on approval
                            </p>
                        </CardContent>
                    </Card>

                    {/* ── instructions ── */}
                    <Card className="bg-gray-50 border-2 border-gray-300 rounded-2xl shadow-none">
                        <CardContent className="pt-5 pb-5 px-5">
                            <h4 className="font-bold text-gray-800 text-sm mb-3">Payment Instructions</h4>
                            <ol className="space-y-2 text-xs text-gray-600 font-medium">
                                {[
                                    "Scan the QR code or copy the UPI ID",
                                    `Pay exactly ₹${totalAmount.toLocaleString("en-IN")}`,
                                    "Take a screenshot of the successful payment",
                                    "Upload the screenshot and enter your transaction ID above",
                                    "We'll verify and credit your account within 24 hours",
                                ].map((step, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <span className="font-black text-green-600 flex-shrink-0">{i + 1}.</span>
                                        <span>{step}</span>
                                    </li>
                                ))}
                            </ol>
                        </CardContent>
                    </Card>

                </div>
            </DialogContent>
        </Dialog>
    );
}