import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, Home, RefreshCw } from "lucide-react";

const Failed = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { name, amount, transactionId, date } = location.state || {};

  useEffect(() => {
    if (!name || !amount) {
      navigate("/");
    }
  }, [name, amount, navigate]);

  return (
    <div className="min-h-screen bg-gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-card border-border/50 animate-in fade-in zoom-in-95 duration-700">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mb-4 animate-in zoom-in-50 duration-500 delay-300">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
            <CardTitle className="text-2xl text-foreground">Payment Failed</CardTitle>
            <CardDescription>Unfortunately, your payment could not be processed</CardDescription>
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
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold text-lg">₹{parseFloat(amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Date & Time</span>
                <span className="text-sm">{date}</span>
              </div>
            </div>

            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <h3 className="font-semibold text-sm mb-2">Possible Reasons:</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Insufficient balance in your account</li>
                <li>Network connectivity issues</li>
                <li>Incorrect UPI PIN</li>
                <li>Bank server downtime</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => navigate("/", { state: { name, amount } })}
                className="w-full bg-gradient-primary hover:opacity-90 transition-opacity shadow-elegant gap-2"
                size="lg"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>

              <Button
                onClick={() => navigate("/")}
                variant="outline"
                className="w-full gap-2"
                size="lg"
              >
                <Home className="w-4 h-4" />
                Back to Home
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              No amount has been debited from your account
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Failed;
