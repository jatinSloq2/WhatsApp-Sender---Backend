import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle2, Copy, Loader2 } from 'lucide-react';
import { useState } from 'react';

export function PaymentModal({ plan, onClose, onSubmitProof }) {
    const upiId = '7240440461@ybl';

    const [transactionId, setTransactionId] = useState('');
    const [paymentProof, setPaymentProof] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [qrLoaded, setQrLoaded] = useState(false);

    const gst = Math.round(plan.price * 0.18);
    const total = plan.price + gst;

    const upiLink = `upi://pay?pa=${upiId}&am=${total}&cu=INR`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
        upiLink
    )}`;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Only image files are allowed');
            return;
        }

        setPaymentProof(file);
        setPreviewUrl(URL.createObjectURL(file));
        setError('');
    };

    const handleSubmit = async () => {
        if (!paymentProof || !transactionId.trim()) {
            setError('Transaction ID and screenshot are required');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            await onSubmitProof({
                planId: plan._id,
                billingCycle: plan.billingCycle,
                amount: total,
                transactionId: transactionId.trim(),
                paymentProof,
            });
        } catch (err) {
            setError('Failed to submit payment proof');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Complete Payment</DialogTitle>
                    <DialogDescription>
                        {plan.name} · {plan.billingCycle}
                    </DialogDescription>
                </DialogHeader>

                {/* Error */}
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Amount */}
                <Card>
                    <CardContent className="pt-6 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span>Base amount</span>
                            <span>₹{plan.price}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>GST (18%)</span>
                            <span>₹{gst}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-emerald-600">
                            <span>Total</span>
                            <span>₹{total}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* QR Section */}
                <div className="text-center space-y-3">
                    <div className="flex justify-center">
                        {!qrLoaded && <Skeleton className="w-64 h-64 rounded-lg" />}
                        <img
                            src={qrCodeUrl}
                            alt="QR Code"
                            className={`w-64 h-64 ${!qrLoaded ? 'hidden' : ''}`}
                            onLoad={() => setQrLoaded(true)}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Scan using any UPI app
                    </p>
                </div>

                {/* UPI ID */}
                <div className="flex gap-2">
                    <Input value={upiId} readOnly />
                    <Button
                        variant="outline"
                        onClick={() => navigator.clipboard.writeText(upiId)}
                    >
                        <Copy size={16} />
                    </Button>
                </div>

                {/* Transaction ID */}
                <div className="space-y-1">
                    <Label>Transaction ID / UTR</Label>
                    <Input
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="Enter transaction ID"
                    />
                </div>

                {/* Upload */}
                <div className="space-y-2">
                    <Label>Payment Screenshot</Label>
                    <Input type="file" accept="image/*" onChange={handleFileChange} />
                    {previewUrl && (
                        <img
                            src={previewUrl}
                            className="w-40 rounded-md border"
                            alt="preview"
                        />
                    )}
                </div>

                {/* Submit */}
                <Button
                    className="w-full"
                    disabled={submitting}
                    onClick={handleSubmit}
                >
                    {submitting ? (
                        <>
                            <Loader2 className="animate-spin mr-2" size={16} />
                            Submitting
                        </>
                    ) : (
                        <>
                            <CheckCircle2 size={16} className="mr-2" />
                            Submit for Verification
                        </>
                    )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                    Payments are verified within 24 hours
                </p>
            </DialogContent>
        </Dialog>
    );
}