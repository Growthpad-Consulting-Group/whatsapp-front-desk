"use client";

import { useState, useMemo } from "react";
import { formatCurrency, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  sendInvoiceAction,
  markInvoicePaymentAction,
  createManualInvoiceAction,
} from "@/actions/invoices";
import {
  FileText,
  Search,
  Plus,
  Calendar,
  CreditCard,
  Send,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  TrendingUp,
  AlertTriangle
} from "lucide-react";
import type { Business } from "@/types";

interface InvoicesClientProps {
  initialInvoices: any[];
  customers: any[];
  services: any[];
  business: Business;
}

export function InvoicesClient({
  initialInvoices,
  customers,
  services,
  business,
}: InvoicesClientProps) {
  const [invoices, setInvoices] = useState<any[]>(initialInvoices);

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Create Invoice Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCustomerId, setNewCustomerId] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Record Payment Modal State
  const [recordingInvoice, setRecordingInvoice] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [recordLoading, setRecordLoading] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);

  // Loading indicator map for instant reminders
  const [sendingInvoiceId, setSendingInvoiceId] = useState<string | null>(null);

  // Status mapping to color variants
  const statusVariants: Record<string, "default" | "success" | "warning" | "destructive" | "outline"> = {
    draft: "outline",
    sent: "warning",
    due: "warning",
    overdue: "destructive",
    partially_paid: "default",
    paid: "success",
    cancelled: "destructive",
    disputed: "destructive",
  };

  // 1. Calculate Metrics
  const metrics = useMemo(() => {
    let outstanding = 0;
    let collected = 0;
    let overdue = 0;

    invoices.forEach((inv) => {
      const remaining = Number(inv.amount) - Number(inv.amount_paid);
      collected += Number(inv.amount_paid);

      if (inv.status === "overdue") {
        overdue += remaining;
      }
      if (["sent", "due", "overdue", "partially_paid", "draft"].includes(inv.status)) {
        outstanding += remaining;
      }
    });

    return { outstanding, collected, overdue };
  }, [invoices]);

  // 2. Filter Logic
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const customer = inv.customers || {};
      const matchesSearch =
        inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm);

      const matchesStatus = selectedStatus === "all" || inv.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, selectedStatus]);

  // 3. Dispatch invoice reminder
  const handleSendReminder = async (invoiceId: string) => {
    setSendingInvoiceId(invoiceId);
    const res = await sendInvoiceAction(invoiceId);
    setSendingInvoiceId(null);

    if (res.success) {
      alert("Invoice notification sent successfully via WhatsApp!");
      // Re-fetch or update status locally
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: "sent" } : inv))
      );
    } else {
      alert(res.error);
    }
  };

  // 4. Submit New Invoice
  const handleCreateInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerId || !newAmount || !newDueDate) {
      setCreateError("Please fill out all required fields.");
      return;
    }

    setCreateLoading(true);
    setCreateError(null);

    const res = (await createManualInvoiceAction(
      newCustomerId,
      Number(newAmount),
      newDueDate,
      newNotes || undefined
    )) as any;

    setCreateLoading(false);
    if (res.success && res.data) {
      const createdInv = {
        ...res.data,
        customers: customers.find((c) => c.id === newCustomerId) || null,
      };

      setInvoices((prev) => [createdInv, ...prev]);
      setIsCreateOpen(false);
      // Reset inputs
      setNewCustomerId("");
      setNewAmount("");
      setNewDueDate("");
      setNewNotes("");
    } else {
      setCreateError(res.error || "Failed to create invoice.");
    }
  };

  // 5. Submit Payment record
  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordingInvoice || !paymentAmount) return;

    setRecordLoading(true);
    setRecordError(null);

    const amountNum = Number(paymentAmount);
    const res = await markInvoicePaymentAction(
      recordingInvoice.id,
      amountNum,
      paymentStatus,
      paymentNotes || undefined
    );

    setRecordLoading(false);
    if (res.success) {
      setInvoices((prev) =>
        prev.map((inv) => {
          if (inv.id === recordingInvoice.id) {
            const finalAmtPaid = Number(inv.amount_paid) + amountNum;
            const finalStatus = finalAmtPaid >= Number(inv.amount) ? "paid" : "partially_paid";
            return {
              ...inv,
              amount_paid: finalAmtPaid,
              status: paymentStatus === "paid" ? finalStatus : paymentStatus,
              notes: paymentNotes || inv.notes,
            };
          }
          return inv;
        })
      );
      setRecordingInvoice(null);
      setPaymentAmount("");
      setPaymentNotes("");
    } else {
      setRecordError(res.error || "Failed to record payment.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Header Grid (Glassmorphism layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="relative overflow-hidden bg-card/65 backdrop-blur-md border border-border/50 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Collected Revenue</p>
              <h3 className="text-3xl font-bold text-foreground mt-2">{formatCurrency(metrics.collected, business.currency)}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-2xl -z-10" />
        </div>

        <div className="relative overflow-hidden bg-card/65 backdrop-blur-md border border-border/50 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Outstanding</p>
              <h3 className="text-3xl font-bold text-foreground mt-2">{formatCurrency(metrics.outstanding, business.currency)}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -z-10" />
        </div>

        <div className="relative overflow-hidden bg-card/65 backdrop-blur-md border border-border/50 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Overdue Balance</p>
              <h3 className="text-3xl font-bold text-foreground mt-2">{formatCurrency(metrics.overdue, business.currency)}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl -z-10" />
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-card/75 backdrop-blur-md border border-border rounded-2xl p-5 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by invoice number or customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full pl-9 pr-4 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Status selector */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-10 px-3 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Invoices</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} className="w-full md:w-auto flex items-center gap-1.5 shrink-0">
          <Plus className="h-4 w-4" /> Create Invoice
        </Button>
      </div>

      {/* Invoices List Grid */}
      <div className="space-y-4">
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border border-dashed rounded-3xl">
            <FileText className="h-12 w-12 text-muted-foreground/60 mx-auto mb-4" />
            <h4 className="font-semibold text-foreground">No invoices found</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Adjust your search query or status filter parameters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredInvoices.map((inv) => {
              const customer = inv.customers || {};
              const outstanding = Number(inv.amount) - Number(inv.amount_paid);

              return (
                <div
                  key={inv.id}
                  className="group relative overflow-hidden bg-card/65 backdrop-blur-md border border-border rounded-2xl p-5 shadow-sm transition-all duration-200 hover:shadow-md flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-xs font-semibold text-muted-foreground font-mono block">
                          {inv.invoice_number}
                        </span>
                        <h4 className="font-semibold text-foreground mt-1 text-sm">
                          {customer.name || "Offline Client"}
                        </h4>
                      </div>
                      <Badge variant={statusVariants[inv.status] || "default"}>
                        {inv.status}
                      </Badge>
                    </div>

                    {/* Customer Info */}
                    <div className="text-xs text-muted-foreground space-y-1.5 bg-background/40 border border-border/30 rounded-xl p-3">
                      <p className="flex justify-between">
                        <span>Due Date</span>
                        <span className="font-medium text-foreground">{inv.due_date}</span>
                      </p>
                      <p className="flex justify-between">
                        <span>Customer Phone</span>
                        <span className="font-medium text-foreground">{customer.phone || "N/A"}</span>
                      </p>
                    </div>

                    {/* Outstanding vs Total Amount */}
                    <div className="space-y-1 border-t border-border/40 pt-3">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Outstanding</span>
                        <span>Total Paid</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-base font-bold text-foreground">
                          {formatCurrency(outstanding, inv.currency)}
                        </span>
                        <span className="text-xs font-medium text-green-600 dark:text-green-400">
                          {formatCurrency(Number(inv.amount_paid), inv.currency)} paid of {formatCurrency(Number(inv.amount), inv.currency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Grid */}
                  <div className="flex gap-2 border-t border-border/50 pt-4 mt-4 text-xs">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`/invoice/${inv.id}`, "_blank")}
                      className="flex-1 flex items-center justify-center gap-1 border border-border text-foreground hover:bg-muted"
                    >
                      <Eye className="h-3.5 w-3.5" /> View
                    </Button>
                    
                    {outstanding > 0 && inv.status !== "cancelled" && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={sendingInvoiceId === inv.id}
                          onClick={() => handleSendReminder(inv.id)}
                          className="flex-1 flex items-center justify-center gap-1 border border-border text-foreground hover:bg-muted"
                        >
                          <Send className="h-3.5 w-3.5" /> Remind
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setRecordingInvoice(inv);
                            setPaymentAmount(outstanding.toString());
                            setPaymentStatus("paid");
                            setPaymentNotes("");
                            setRecordError(null);
                          }}
                          className="flex-1 flex items-center justify-center gap-1"
                        >
                          <CreditCard className="h-3.5 w-3.5" /> Pay
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE MANUAL INVOICE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-background/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsCreateOpen(false)}
          />

          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto z-10 relative">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Create Manual Invoice</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Generate a billing invoice for an offline client.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsCreateOpen(false)} className="h-8 w-8 p-0 rounded-lg">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleCreateInvoiceSubmit} className="p-6 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="customer" className="text-xs font-semibold text-foreground">Select Customer *</label>
                <select
                  id="customer"
                  required
                  value={newCustomerId}
                  onChange={(e) => setNewCustomerId(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">-- Choose Client --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="amount" className="text-xs font-semibold text-foreground">Billing Amount ({business.currency}) *</label>
                  <Input
                    id="amount"
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    placeholder="2500"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="due_date" className="text-xs font-semibold text-foreground">Due Date *</label>
                  <input
                    id="due_date"
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="notes" className="text-xs font-semibold text-foreground">Notes / Invoice items</label>
                <textarea
                  id="notes"
                  rows={3}
                  placeholder="Hair cutting and hair coloring treatments..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {createError && (
                <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-border pt-4 mt-6">
                <Button type="button" variant="ghost" className="border border-border text-foreground hover:bg-muted" onClick={() => setIsCreateOpen(false)} disabled={createLoading}>
                  Cancel
                </Button>
                <Button type="submit" loading={createLoading}>
                  Create Draft
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {recordingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-background/60 backdrop-blur-sm transition-opacity"
            onClick={() => setRecordingInvoice(null)}
          />

          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto z-10 relative">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Record Manual Receipt</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Record cash or POS collection for {recordingInvoice.invoice_number}.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setRecordingInvoice(null)} className="h-8 w-8 p-0 rounded-lg">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="p-6 space-y-4">
              <div className="bg-muted/40 border border-border/30 rounded-xl p-3 text-xs leading-normal">
                <div className="flex justify-between mb-1 text-muted-foreground">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(Number(recordingInvoice.amount), recordingInvoice.currency)}</span>
                </div>
                <div className="flex justify-between mb-1 text-muted-foreground">
                  <span>Already Paid:</span>
                  <span>{formatCurrency(Number(recordingInvoice.amount_paid), recordingInvoice.currency)}</span>
                </div>
                <div className="flex justify-between font-semibold text-foreground border-t border-border/35 pt-1.5">
                  <span>Remaining Due:</span>
                  <span>{formatCurrency(Number(recordingInvoice.amount) - Number(recordingInvoice.amount_paid), recordingInvoice.currency)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="p_amount" className="text-xs font-semibold text-foreground">Received Amount *</label>
                  <Input
                    id="p_amount"
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="p_status" className="text-xs font-semibold text-foreground">Payment State *</label>
                  <select
                    id="p_status"
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="paid">Record Paid / Partial</option>
                    <option value="cancelled">Mark Cancelled</option>
                    <option value="disputed">Mark Disputed</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="p_notes" className="text-xs font-semibold text-foreground">Notes / Transaction receipt number</label>
                <textarea
                  id="p_notes"
                  rows={2}
                  placeholder="Customer paid via cash during salon checkout..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {recordError && (
                <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{recordError}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-border pt-4 mt-6">
                <Button type="button" variant="ghost" className="border border-border text-foreground hover:bg-muted" onClick={() => setRecordingInvoice(null)} disabled={recordLoading}>
                  Cancel
                </Button>
                <Button type="submit" loading={recordLoading}>
                  Record Payment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
