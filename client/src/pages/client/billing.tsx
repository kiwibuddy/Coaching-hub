import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { TableSkeleton } from "@/components/loading-skeleton";
import { CreditCard, FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  description: string | null;
  paidAt: string | null;
  createdAt: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: string;
  dueDate: string | null;
  paidAt: string | null;
  items: string;
  createdAt: string;
}

interface PaymentProviders {
  stripe: boolean;
  paypal: boolean;
}

export default function ClientBilling() {
  const [location] = useLocation();
  const { toast } = useToast();

  const { data: payments, isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ["/api/client/payments"],
  });

  const { data: invoices, isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/client/invoices"],
  });

  const { data: providers } = useQuery<PaymentProviders>({
    queryKey: ["/api/payments/providers"],
  });

  // Handle URL params for payment success/cancel
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      toast({
        title: "Payment Successful",
        description: "Thank you for your payment!",
      });
      // Clean URL
      window.history.replaceState({}, "", "/client/billing");
    } else if (params.get("cancelled") === "true") {
      toast({
        title: "Payment Cancelled",
        description: "Your payment was not processed.",
        variant: "destructive",
      });
      window.history.replaceState({}, "", "/client/billing");
    }
  }, [location, toast]);

  const isLoading = paymentsLoading || invoicesLoading;

  if (isLoading) {
    return (
      <div className="p-6">
        <TableSkeleton />
      </div>
    );
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
      case "paid":
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" /> Paid</Badge>;
      case "pending":
      case "sent":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case "overdue":
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" /> Overdue</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const unpaidInvoices = invoices?.filter((inv) => inv.status === "sent" || inv.status === "overdue") || [];
  const totalOwed = unpaidInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-serif text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          View your invoices and payment history.
        </p>
      </div>

      {/* Outstanding Balance */}
      {totalOwed > 0 && (
        <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-900/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-medium">Outstanding Balance</p>
                  <p className="text-sm text-muted-foreground">
                    You have {unpaidInvoices.length} unpaid invoice{unpaidInvoices.length > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{formatAmount(totalOwed, "usd")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Methods
          </CardTitle>
          <CardDescription>
            Available payment options for your invoices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {providers?.stripe && (
              <div className="flex items-center gap-2 px-4 py-2 border rounded-md">
                <span className="font-medium">Credit Card</span>
                <Badge variant="outline">Stripe</Badge>
              </div>
            )}
            {providers?.paypal && (
              <div className="flex items-center gap-2 px-4 py-2 border rounded-md">
                <span className="font-medium">PayPal</span>
                <Badge variant="outline">PayPal</Badge>
              </div>
            )}
            {!providers?.stripe && !providers?.paypal && (
              <p className="text-muted-foreground">
                No payment methods are currently configured. Please contact your coach for payment options.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices && invoices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{formatAmount(invoice.amount, invoice.currency)}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>
                      {invoice.dueDate ? format(new Date(invoice.dueDate), "MMM d, yyyy") : "-"}
                    </TableCell>
                    <TableCell>
                      {format(new Date(invoice.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      {(invoice.status === "sent" || invoice.status === "overdue") && (
                        <Button size="sm">Pay Now</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={FileText}
              title="No invoices yet"
              description="You don't have any invoices at the moment."
            />
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments && payments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {payment.paidAt
                        ? format(new Date(payment.paidAt), "MMM d, yyyy")
                        : format(new Date(payment.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>{payment.description || "Payment"}</TableCell>
                    <TableCell>{formatAmount(payment.amount, payment.currency)}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {payment.provider === "stripe" ? "Card" : "PayPal"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={CreditCard}
              title="No payment history"
              description="You haven't made any payments yet."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
