import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Smartphone, QrCode as QrIcon, Copy, CheckCircle2 } from "lucide-react";



const UPIPayment = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [payPage, setPayPage] = useState<any>(null); // paypage token/url returned by server
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const { name, amount } = (location.state as any) || {};

  useEffect(() => {
    if (!name || !amount) {
      toast({
        title: "Invalid Access",
        description: "Please start from the payment page",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [name, amount, navigate, toast]);

  // keep existing fallback UPI info
  const upiId = "merchant@upi";
  const upiLink = `upi://pay?pa=${upiId}&pn=Merchant&am=${amount}&cu=INR`;

  const handleCopyUPI = async () => {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      toast({ title: "Copied!", description: "UPI ID copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = upiId;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      toast({ title: "Copied (fallback)!" });
    }
  };

  // NEW: create payment on server and open phonepe paypage
  const createPayment = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, amount }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Create payment failed");

      setOrderId(data.orderId);
      setPayPage(data.phonepe); // store phonepe response (token/url)

      // If PhonePe returns an iframe URL / token, open it as instructed in docs
      // Example: if data.phonepe.payUrl exists:
      if (data.phonepe?.redirectUrl) {
        // open in new window/tab or embed iframe per doc guidance
        window.open(data.phonepe.redirectUrl, "_blank");
      } else if (data.phonepe?.iframeHtml) {
        // optionally render iframe in modal (not shown here)
      }

      toast({ title: "Payment initiated", description: "Complete payment in the PhonePe window" });
    } catch (err: any) {
      toast({ title: "Payment error", description: err.message || "Could not start payment", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  // NEW: verify payment by calling server-side Order Status API
  const verifyPayment = async () => {
    if (!orderId) {
      toast({ title: "No order to verify", description: "Start payment first", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/payment-status/${orderId}`);
      const body = await res.json();
      // PhonePe response shape may vary — inspect body.data.payload.state or similar.
      const status = body?.data?.payload?.state || body?.data?.status || body?.data?.order?.status;
      if (status === "SUCCESS" || status === "completed") {
        navigate("/success", {
          state: {
            name,
            amount,
            transactionId: body?.data?.payload?.transactionId || orderId,
            date: new Date().toLocaleString(),
          },
        });
      } else {
        toast({ title: "Payment not completed", description: "Status: " + (status || "UNKNOWN") });
      }
    } catch (err: any) {
      toast({ title: "Verify failed", description: err.message || "Try again", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

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

            <div className="pt-4 space-y-3">
              {/* NEW: Start PhonePe checkout (server will return paypage token/url) */}
              <Button onClick={createPayment} disabled={isProcessing} className="w-full bg-gradient-primary" size="lg">
                {isProcessing ? "Processing..." : "Pay with any UPI"}
              </Button>

              {/* NEW: Verify status after completing payment */}
              <Button onClick={verifyPayment} disabled={isProcessing || !orderId} variant="outline" className="w-full" size="lg">
                Verify Payment
              </Button>

              <Button onClick={() => navigate("/")} variant="link" className="text-muted-foreground hover:text-foreground">Back to Payment Form</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UPIPayment;
