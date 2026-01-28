import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/empty-state";
import { TableSkeleton } from "@/components/loading-skeleton";
import { StatCard } from "@/components/stat-card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard, 
  FileText, 
  Plus, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  DollarSign,
  TrendingUp,
  Send,
} from "lucide-react";
import type { ClientProfile } from "@shared/schema";

interface Payment {
  id: string;
  clientId: string;
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
  clientId: string;
  amount: number;
  currency: string;
  status: string;
  dueDate: string | null;
  paidAt: string | null;
  items: string;
  notes: string | null;
  createdAt: string;
}

export default function CoachBilling() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: payments, isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ["/api/coach/payments"],
  });

  const { data: invoices, isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/coach/invoices"],
  });

  const { data: clients } = useQuery<ClientProfile[]>({
    queryKey: ["/api/coach/clients"],
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: {
      clientId: string;
      amount: number;
      dueDate?: string;
      items: string;
      notes?: string;
    }) => {
      return apiRequest("POST", "/api/coach/invoices", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coach/invoices"] });
      setCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Invoice Created",
        description: "The invoice has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create invoice. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/coach/invoices/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coach/invoices"] });
      toast({
        title: "Invoice Updated",
        description: "The invoice status has been updated.",
      });
    },
  });

  const resetForm = () => {
    setSelectedClient("");
    setAmount("");
    setDescription("");
    setDueDate("");
    setNotes("");
  };

  const handleCreateInvoice = () => {
    const amountCents = Math.round(parseFloat(amount) * 100);
    if (!selectedClient || isNaN(amountCents) || amountCents < 100) {
      toast({
        title: "Invalid Input",
        description: "Please select a client and enter a valid amount (min $1.00).",
        variant: "destructive",
      });
      return;
    }

    const items = JSON.stringify([{ description: description || "Coaching Services", amount: amountCents }]);

    createInvoiceMutation.mutate({
      clientId: selectedClient,
      amount: amountCents,
      dueDate: dueDate || undefined,
      items,
      notes: notes || undefined,
    });
  };

  const isLoading = paymentsLoading || invoicesLoading;

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
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      case "overdue":
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" /> Overdue</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Calculate stats
  const totalReceived = payments?.filter((p) => p.status === "completed").reduce((sum, p) => sum + p.amount, 0) || 0;
  const pendingAmount = invoices?.filter((i) => i.status === "sent" || i.status === "overdue").reduce((sum, i) => sum + i.amount, 0) || 0;
  const completedPayments = payments?.filter((p) => p.status === "completed").length || 0;

  if (isLoading) {
    return (
      <div className="p-6">
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground">
            Manage invoices and track payments.
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Invoice</DialogTitle>
              <DialogDescription>
                Create a new invoice for a client.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Client</Label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        Client #{client.id.slice(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount ($)</Label>
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="150.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="Coaching session"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date (optional)</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder="Additional notes for the client..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateInvoice} disabled={createInvoiceMutation.isPending}>
                {createInvoiceMutation.isPending ? "Creating..." : "Create Invoice"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Received"
          value={formatAmount(totalReceived, "usd")}
          icon={DollarSign}
        />
        <StatCard
          title="Pending Invoices"
          value={formatAmount(pendingAmount, "usd")}
          icon={Clock}
        />
        <StatCard
          title="Completed Payments"
          value={completedPayments}
          icon={TrendingUp}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">
            <FileText className="h-4 w-4 mr-2" />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard className="h-4 w-4 mr-2" />
            Payments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {invoices && invoices.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Client</TableHead>
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
                        <TableCell>#{invoice.clientId.slice(0, 8)}</TableCell>
                        <TableCell>{formatAmount(invoice.amount, invoice.currency)}</TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell>
                          {invoice.dueDate ? format(new Date(invoice.dueDate), "MMM d, yyyy") : "-"}
                        </TableCell>
                        <TableCell>
                          {format(new Date(invoice.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {invoice.status === "draft" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateInvoiceMutation.mutate({ id: invoice.id, status: "sent" })}
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Send
                            </Button>
                          )}
                          {invoice.status === "sent" && (
                            <Button
                              size="sm"
                              onClick={() => updateInvoiceMutation.mutate({ id: invoice.id, status: "paid" })}
                            >
                              Mark Paid
                            </Button>
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
                  description="Create your first invoice to get started."
                  actionLabel="Create Invoice"
                  onAction={() => setCreateDialogOpen(true)}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {payments && payments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Description</TableHead>
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
                        <TableCell>#{payment.clientId.slice(0, 8)}</TableCell>
                        <TableCell>{formatAmount(payment.amount, payment.currency)}</TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {payment.provider === "stripe" ? "Card" : "PayPal"}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {payment.description || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState
                  icon={CreditCard}
                  title="No payments yet"
                  description="Payments will appear here once clients pay their invoices."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
