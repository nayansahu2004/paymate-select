import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, TrendingUp, Users, IndianRupee } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();

  // Sample payment data - In production, this would come from your database
  const [payments] = useState([
    {
      id: "1",
      name: "Rahul Kumar",
      amount: 2500.00,
      status: "success",
      date: "2024-01-15 14:30",
      transactionId: "TXN123456"
    },
    {
      id: "2",
      name: "Priya Sharma",
      amount: 1800.50,
      status: "success",
      date: "2024-01-15 12:15",
      transactionId: "TXN123457"
    },
    {
      id: "3",
      name: "Amit Patel",
      amount: 3200.00,
      status: "failed",
      date: "2024-01-14 16:45",
      transactionId: "TXN123458"
    },
    {
      id: "4",
      name: "Sneha Gupta",
      amount: 1500.00,
      status: "success",
      date: "2024-01-14 11:20",
      transactionId: "TXN123459"
    }
  ]);

  // Only show successful payments
  const successfulPayments = payments.filter(p => p.status === "success");
  const totalAmount = successfulPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-bg p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Payment Dashboard</h1>
            <p className="text-muted-foreground">Track and manage all payment transactions</p>
          </div>
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Payment
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <Card className="shadow-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
              <IndianRupee className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalAmount.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                From {successfulPayments.length} successful payments
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Transactions
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{successfulPayments.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Successful transactions only
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Unique Users
              </CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(successfulPayments.map(p => p.name)).size}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Active payment users
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Payments Table */}
        <Card className="shadow-card border-border/50 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>A list of all payment transactions</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date & Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {successfulPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No successful transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    successfulPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-mono text-sm">
                          {payment.transactionId}
                        </TableCell>
                        <TableCell className="font-medium">{payment.name}</TableCell>
                        <TableCell className="font-semibold">
                          ₹{payment.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="default"
                            className="bg-secondary hover:bg-secondary/90"
                          >
                            Success
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {payment.date}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
