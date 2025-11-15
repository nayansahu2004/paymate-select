import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Home, Receipt } from "lucide-react";

const Confirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const paymentData = location.state;

  useEffect(() => {
    // Redirect if no payment data
    if (!paymentData) {
      navigate("/");
    }
  }, [paymentData, navigate]);

  if (!paymentData) {
    return null;
  }

  const isSuccess = paymentData.status === "success";

  return (
    <div className="min-h-screen bg-gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-elegant border-border/50 animate-in fade-in zoom-in-95 duration-500">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              {isSuccess ? (
                <div className="w-20 h-20 bg-gradient-success rounded-full flex items-center justify-center shadow-elegant animate-in zoom-in-50 duration-700 delay-150">
                  <CheckCircle2 className="w-12 h-12 text-secondary-foreground" />
                </div>
              ) : (
                <div className="w-20 h-20 bg-destructive rounded-full flex items-center justify-center shadow-elegant animate-in zoom-in-50 duration-700 delay-150">
                  <XCircle className="w-12 h-12 text-destructive-foreground" />
                </div>
              )}
            </div>
            <CardTitle className="text-2xl">
              {isSuccess ? "Payment Successful!" : "Payment Failed"}
            </CardTitle>
            <CardDescription>
              {isSuccess 
                ? "Your payment has been processed successfully" 
                : "Unfortunately, your payment could not be processed"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted rounded-lg p-4 space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Name</span>
                <span className="font-semibold">{paymentData.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold text-lg">₹{parseFloat(paymentData.amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Transaction ID</span>
                <span className="font-mono text-sm">
                  {Math.random().toString(36).substring(2, 15).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Date & Time</span>
                <span className="text-sm">
                  {new Date().toLocaleString('en-IN', { 
                    dateStyle: 'medium', 
                    timeStyle: 'short' 
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                <span className={`font-semibold ${isSuccess ? 'text-secondary' : 'text-destructive'}`}>
                  {isSuccess ? 'Completed' : 'Failed'}
                </span>
              </div>
            </div>

            <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500">
              <Button
                onClick={() => navigate("/")}
                variant="outline"
                className="flex-1"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
              <Button
                onClick={() => navigate("/dashboard")}
                className="flex-1 bg-gradient-primary hover:opacity-90"
              >
                <Receipt className="w-4 h-4 mr-2" />
                View All
              </Button>
            </div>

            {isSuccess && (
              <p className="text-center text-sm text-muted-foreground">
                A confirmation email has been sent to your registered email address
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Confirmation;
