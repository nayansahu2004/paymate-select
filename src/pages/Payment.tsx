import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, ArrowRight, User, IndianRupee } from "lucide-react";

const Payment = () => {
  const [selectedName, setSelectedName] = useState("");
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Sample user names - In production, this would come from your database
  const userNames = [
    "Rahul Kumar",
    "Priya Sharma",
    "Amit Patel",
    "Sneha Gupta",
    "Vikram Singh",
    "Anita Reddy"
  ];

  const handlePayment = async () => {
    if (!selectedName || !amount) {
      toast({
        title: "Missing Information",
        description: "Please select a name and enter an amount",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      });
      return;
    }

    // Navigate to UPI payment page
    navigate("/upi-payment", { 
      state: { 
        name: selectedName, 
        amount: amount
      } 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4 shadow-elegant">
            <CreditCard className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Secure Payment</h1>
          <p className="text-muted-foreground">Quick and safe UPI transactions</p>
        </div>

        <Card className="shadow-card border-border/50 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-150">
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
            <CardDescription>Select your name and enter the payment amount</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Select Your Name
              </Label>
              <Select value={selectedName} onValueChange={setSelectedName}>
                <SelectTrigger id="name">
                  <SelectValue placeholder="Choose your name" />
                </SelectTrigger>
                <SelectContent>
                  {userNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="flex items-center gap-2">
                <IndianRupee className="w-4 h-4" />
                Payment Amount
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <Button
              onClick={handlePayment}
              disabled={isProcessing || !selectedName || !amount}
              className="w-full bg-gradient-primary hover:opacity-90 transition-opacity shadow-elegant"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  Proceed to Pay
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>

            <div className="text-center">
              <Button
                variant="link"
                onClick={() => navigate("/dashboard")}
                className="text-muted-foreground hover:text-foreground"
              >
                View Payment History
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Secured by industry-standard encryption
        </p>
      </div>
    </div>
  );
};

export default Payment;
