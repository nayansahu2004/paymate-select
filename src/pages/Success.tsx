import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Download, Home } from "lucide-react";

const Success = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { name, amount, transactionId, date } = location.state || {};

  useEffect(() => {
    if (!name || !amount) {
      navigate("/");
    }
  }, [name, amount, navigate]);

  const handleDownloadReceipt = () => {
    // In production, this would generate a PDF receipt
    const receiptData = `
Payment Receipt
===============
Transaction ID: ${transactionId}
Name: ${name}
Amount: ₹${parseFloat(amount).toFixed(2)}
Date: ${date}
Status: Success
===============
    `;
    const blob = new Blob([receiptData], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${transactionId}.txt`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-card border-border/50 animate-in fade-in zoom-in-95 duration-700">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mb-4 animate-in zoom-in-50 duration-500 delay-300">
              <CheckCircle2 className="w-10 h-10 text-secondary" />
            </div>
            <CardTitle className="text-2xl text-foreground">Payment Successful!</CardTitle>
            <CardDescription>Your payment has been processed successfully</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Transaction ID</span>
                <span className="font-mono text-sm font-semibold">{transactionId}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Name</span>
                <span className="font-semibold">{name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="font-semibold text-lg text-secondary">₹{parseFloat(amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Date & Time</span>
                <span className="text-sm">{date}</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleDownloadReceipt}
                variant="outline"
                className="w-full gap-2"
                size="lg"
              >
                <Download className="w-4 h-4" />
                Download Receipt
              </Button>

              <Button
                onClick={() => navigate("/dashboard")}
                variant="outline"
                className="w-full gap-2"
                size="lg"
              >
                View All Transactions
              </Button>

              <Button
                onClick={() => navigate("/")}
                className="w-full bg-gradient-primary hover:opacity-90 transition-opacity shadow-elegant gap-2"
                size="lg"
              >
                <Home className="w-4 h-4" />
                Make Another Payment
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              A confirmation email has been sent to your registered email address
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Success;
