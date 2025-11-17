// src/pages/UPIPayment.tsx  (or wherever your file lives)
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import QRCode from "qrcode.react"; // install: npm i qrcode.react (optional)
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Smartphone, QrCode as QrIcon, Copy, CheckCircle2 } from "lucide-react";


type PaymentState = { name: string; amount: string | number };

const UPIPayment: React.FC = () => {
  // ui state
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [payPage, setPayPage] = useState<any>(null);

  // hooks
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // env
  const API_BASE = import.meta.env.VITE_API_BASE

  // typed state from navigation
  const state = (location.state as PaymentState | undefined) ?? undefined;

  // local copies of name/amount for use in UI/requests
  const name = state?.name ?? "";
  const amount = state?.amount ?? 0;

  // guard: redirect if no input
  useEffect(() => {
    if (!state || !state.name || !state.amount) {
      toast({
        title: "Invalid Access",
        description: "Please start from the payment page",
        variant: "destructive",
      });
      // small delay so user can see toast (optional)
      setTimeout(() => navigate("/"), 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run only once on mount

  // UPI fallback
  const upiId = "merchant@upi";
  const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent("Merchant")}&am=${amount}&cu=INR`;

  const handleCopyUPI = async () => {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      toast({ title: "Copied!", description: "UPI ID copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback copy
      const el = document.createElement("textarea");
      el.value = upiId;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      toast({ title: "Copied (fallback)!", description: "UPI ID copied using fallback" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // create payment (calls your backend)
  const createPayment = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/api/create-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, amount }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Create payment failed");

      setOrderId(data.orderId ?? null);
      setPayPage(data.phonepe ?? null);

      // If phonepe returns a redirect URL, open it (per docs you may embed iframe instead)
      if (data.phonepe?.redirectUrl) {
        window.open(data.phonepe.redirectUrl, "_blank");
      } else if (data.phonepe?.iframeHtml) {
        // you can render iframeHtml in a modal if needed
        // For now, just notify user
        toast({ title: "Payment started", description: "Complete payment in the opened PhonePe window" });
      } else {
        toast({ title: "Payment initiated", description: "Follow the instructions to complete payment" });
      }
    } catch (err: any) {
      toast({ title: "Payment error", description: err.message ?? "Could not start payment", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  // verify payment via your backend order-status endpoint
  const verifyPayment = async () => {
    if (!orderId) {
      toast({ title: "No order to verify", description: "Start payment first", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/api/payment-status/${orderId}`);
      const body = await res.json();

      // inspect response shape from your backend/PhonePe
      const status = body?.data?.payload?.state || body?.data?.status || body?.data?.order?.status || body?.status;
      if (status === "SUCCESS" || status === "completed" || status === "COMPLETED") {
        navigate("/success", {
          state: {
            name,
            amount,
            transactionId: body?.data?.payload?.transactionId || orderId,
            date: new Date().toLocaleString(),
          },
        });
      } else {
        toast({ title: "Payment not completed", description: `Status: ${status ?? "UNKNOWN"}` });
      }
    } catch (err: any) {
      toast({ title: "Verify failed", description: err.message ?? "Try again", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  // Render
  return (
    <div className="min-h-screen bg-gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4 shadow-elegant">
            <Smartphone className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">UPI Payment</h1>
          <p className="text-muted-foreground">Complete your payment via UPI / PhonePe</p>
        </div>

        <Card className="shadow-card border-border/50 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-150">
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
            <CardDescription>Scan QR or use UPI ID to pay. Or use PhonePe checkout below.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-semibold">{name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-semibold text-lg">₹{Number(amount).toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-background border-2 border-border rounded-lg p-6">
              <div className="flex flex-col items-center space-y-4">
                {/* render a real QR if qrcode.react installed, otherwise you can show an icon */}
                <p className="text-sm text-muted-foreground">Scan with any UPI app</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground text-center">Or use UPI ID</p>
              <div className="flex gap-2">
                <div className="flex-1 bg-muted px-4 py-2 rounded-md font-mono text-sm">{upiId}</div>
                <Button variant="outline" size="sm" onClick={handleCopyUPI} className="gap-2">
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <Button onClick={createPayment} disabled={isProcessing} className="w-full bg-gradient-primary" size="lg">
                {isProcessing ? "Processing..." : "Pay with PhonePe"}
              </Button>

              <Button onClick={verifyPayment} disabled={isProcessing || !orderId} variant="outline" className="w-full" size="lg">
                Verify Payment
              </Button>

              <div className="text-center">
                <Button variant="link" onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground">
                  Back to Payment Form
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UPIPayment;
