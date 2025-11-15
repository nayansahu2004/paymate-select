import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Smartphone, QrCode, Copy, CheckCircle2 } from "lucide-react";

const UPIPayment = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const { name, amount } = location.state || {};

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

  // Generate a sample UPI ID for demonstration
  const upiId = "merchant@upi";
  const upiLink = `upi://pay?pa=${upiId}&pn=Merchant&am=${amount}&cu=INR`;

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "UPI ID copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePayment = (success: boolean) => {
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      const transactionId = `TXN${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      if (success) {
        navigate("/success", { 
          state: { 
            name, 
            amount,
            transactionId,
            date: new Date().toLocaleString()
          } 
        });
      } else {
        navigate("/failed", { 
          state: { 
            name, 
            amount,
            transactionId,
            date: new Date().toLocaleString()
          } 
        });
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4 shadow-elegant">
            <Smartphone className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">UPI Payment</h1>
          <p className="text-muted-foreground">Complete your payment via UPI</p>
        </div>

        <Card className="shadow-card border-border/50 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-150">
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
            <CardDescription>Scan QR or use UPI ID to pay</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-semibold">{name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-semibold text-lg">₹{parseFloat(amount).toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-background border-2 border-border rounded-lg p-6">
              <div className="flex flex-col items-center space-y-4">
                <QrCode className="w-32 h-32 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Scan with any UPI app</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground text-center">Or use UPI ID</p>
              <div className="flex gap-2">
                <div className="flex-1 bg-muted px-4 py-2 rounded-md font-mono text-sm">
                  {upiId}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyUPI}
                  className="gap-2"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <Button
                onClick={() => handlePayment(true)}
                disabled={isProcessing}
                className="w-full bg-gradient-primary hover:opacity-90 transition-opacity shadow-elegant"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  "I have completed the payment"
                )}
              </Button>

              <Button
                onClick={() => handlePayment(false)}
                disabled={isProcessing}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Payment Failed / Cancel
              </Button>
            </div>

            <div className="text-center">
              <Button
                variant="link"
                onClick={() => navigate("/")}
                className="text-muted-foreground hover:text-foreground"
              >
                Back to Payment Form
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UPIPayment;
