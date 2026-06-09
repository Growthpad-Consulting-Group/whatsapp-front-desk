"use client";

import { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import { AnimatedMetricCard } from "@/components/ui/AnimatedMetricCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import StatusPill from "@/components/ui/StatusPill";
import { Tabs } from "@/components/ui/Tabs";
import { SimpleModal } from "@/components/common/SimpleModal";
import { sendInvoiceAction, markInvoicePaymentAction, createManualInvoiceAction } from "@/actions/invoices";
import { Icon } from "@iconify/react";
import type { Business } from "@/types";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "sent", label: "Sent" },
  { key: "partially_paid", label: "Partial" },
  { key: "paid", label: "Paid" },
  { key: "overdue", label: "Overdue" },
];

interface InvoicesClientProps {
  initialInvoices: any[];
  customers: any[];
  services?: any[];
  business: Business;
}

export function InvoicesClient({ initialInvoices, customers, business }: InvoicesClientProps) {
  const [invoices, setInvoices] = useState<any[]>(initialInvoices);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Create invoice modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCustomerId, setNewCustomerId] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Record payment modal
  const [recordingInvoice, setRecordingInvoice] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [recordLoading, setRecordLoading] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);

  const [sendingInvoiceId, setSendingInvoiceId] = useState<string | null>(null);

  const metrics = useMemo(() => {
    let outstanding = 0, collected = 0, overdue = 0;
    invoices.forEach((inv) => {
      const remaining = Number(inv.amount) - Number(inv.amount_paid);
      collected += Number(inv.amount_paid);
      if (inv.status === "overdue") overdue += remaining;
      if (["sent", "due", "overdue", "partially_paid", "draft"].includes(inv.status)) outstanding += remaining;
    });
    return { outstanding, collected, overdue };
  }, [invoices]);

  const filteredInvoices = useMemo(() => invoices.filter((inv) => {
    const customer = inv.customers || {};
    const matchesSearch = !searchTerm ||
      inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm);
    const matchesStatus = selectedStatus === "all" || inv.status === selectedStatus;
    return matchesSearch && matchesStatus;
  }), [invoices, searchTerm, selectedStatus]);

  const statusTabs = STATUS_TABS.map((t) => ({
    ...t,
    badge: t.key !== "all" ? invoices.filter((inv) => inv.status === t.key).length : undefined,
  }));

  const handleSendReminder = async (invoiceId: string) => {
    setSendingInvoiceId(invoiceId);
    const res = await sendInvoiceAction(invoiceId);
    setSendingInvoiceId(null);
    if (res.success) {
      setInvoices((prev) => prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: "sent" } : inv)));
    }
  };

  const handleCreateInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerId || !newAmount || !newDueDate) {
      setCreateError("Please fill out all required fields.");
      return;
    }
    setCreateLoading(true);
    setCreateError(null);
    const res = (await createManualInvoiceAction(newCustomerId, Number(newAmount), newDueDate, newNotes || undefined)) as any;
    setCreateLoading(false);
    if (res.success && res.data) {
      setInvoices((prev) => [{ ...res.data, customers: customers.find((c) => c.id === newCustomerId) || null }, ...prev]);
      setIsCreateOpen(false);
      setNewCustomerId(""); setNewAmount(""); setNewDueDate(""); setNewNotes("");
    } else {
      setCreateError(res.error || "Failed to create invoice.");
    }
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordingInvoice || !paymentAmount) return;
    setRecordLoading(true);
    setRecordError(null);
    const amountNum = Number(paymentAmount);
    const res = await markInvoicePaymentAction(recordingInvoice.id, amountNum, paymentStatus, paymentNotes || undefined);
    setRecordLoading(false);
    if (res.success) {
      setInvoices((prev) => prev.map((inv) => {
        if (inv.id !== recordingInvoice.id) return inv;
        const finalAmtPaid = Number(inv.amount_paid) + amountNum;
        const finalStatus = finalAmtPaid >= Number(inv.amount) ? "paid" : "partially_paid";
        return { ...inv, amount_paid: finalAmtPaid, status: paymentStatus === "paid" ? finalStatus : paymentStatus, notes: paymentNotes || inv.notes };
      }));
      setRecordingInvoice(null);
      setPaymentAmount(""); setPaymentNotes("");
    } else {
      setRecordError(res.error || "Failed to record payment.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        icon="solar:document-text-bold-duotone"
        iconBgColor="bg-linear-to-br from-blue-600 to-blue-500"
        description="Track outstanding and collected revenue"
        actions={[{ label: "Create Invoice", icon: "solar:add-circle-broken", variant: "primary", onClick: () => setIsCreateOpen(true) }]}
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AnimatedMetricCard title="Collected Revenue" value={formatCurrency(metrics.collected, business.currency)} icon="solar:graph-up-broken" color="green" variant="card" mode="light" />
        <AnimatedMetricCard title="Total Outstanding" value={formatCurrency(metrics.outstanding, business.currency)} icon="solar:document-text-broken" color="orange" variant="card" mode="light" />
        <AnimatedMetricCard title="Overdue Balance" value={formatCurrency(metrics.overdue, business.currency)} icon="solar:danger-triangle-broken" color="red" variant="card" mode="light" />
      </div>

      {/* Control bar */}
      <div className="bg-card/75 backdrop-blur-md border border-border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Icon icon="solar:magnifer-broken" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by invoice number or customer…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full pl-9 pr-4 rounded-xl border border-border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            {filteredInvoices.length} of {invoices.length} invoices
          </span>
        </div>
        <div className="border-t border-border/50 pt-4">
          <Tabs tabs={statusTabs} activeTab={selectedStatus} onChange={setSelectedStatus} />
        </div>
      </div>

      {/* Invoice grid */}
      {filteredInvoices.length === 0 ? (
        <EmptyState
          icon="solar:file-search-broken"
          title="No invoices found"
          description="Adjust your search or filter, or create your first invoice."
          action={{ label: "Create Invoice", icon: "solar:add-circle-broken", onClick: () => setIsCreateOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredInvoices.map((inv) => {
            const customer = inv.customers || {};
            const outstanding = Number(inv.amount) - Number(inv.amount_paid);
            return (
              <div key={inv.id} className="group relative overflow-hidden bg-card/65 backdrop-blur-md border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-xs font-semibold text-muted-foreground font-mono block">{inv.invoice_number}</span>
                      <h4 className="font-semibold text-foreground mt-1 text-sm">{customer.name || "Offline Client"}</h4>
                    </div>
                    <StatusPill status={inv.status} context="invoice" variant="default" />
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1.5 bg-background/40 border border-border/30 rounded-xl p-3">
                    <p className="flex justify-between"><span>Due Date</span><span className="font-medium text-foreground">{inv.due_date}</span></p>
                    <p className="flex justify-between"><span>Customer Phone</span><span className="font-medium text-foreground">{customer.phone || "N/A"}</span></p>
                  </div>

                  <div className="space-y-1 border-t border-border/40 pt-3">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Outstanding</span><span>Total Paid</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-base font-bold text-foreground">{formatCurrency(outstanding, inv.currency)}</span>
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(Number(inv.amount_paid), inv.currency)} of {formatCurrency(Number(inv.amount), inv.currency)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 border-t border-border/50 pt-4 mt-4 text-xs">
                  <Button variant="ghost" size="sm" onClick={() => window.open(`/invoice/${inv.id}`, "_blank")} className="flex-1 flex items-center justify-center gap-1 border border-border hover:bg-muted">
                    <Icon icon="solar:eye-broken" className="h-3.5 w-3.5" /> View
                  </Button>
                  {outstanding > 0 && inv.status !== "cancelled" && (
                    <>
                      <Button variant="ghost" size="sm" loading={sendingInvoiceId === inv.id} onClick={() => handleSendReminder(inv.id)} className="flex-1 flex items-center justify-center gap-1 border border-border hover:bg-muted">
                        <Icon icon="solar:plain-2-broken" className="h-3.5 w-3.5" /> Remind
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => { setRecordingInvoice(inv); setPaymentAmount(outstanding.toString()); setPaymentStatus("paid"); setPaymentNotes(""); setRecordError(null); }} className="flex-1 flex items-center justify-center gap-1">
                        <Icon icon="solar:card-broken" className="h-3.5 w-3.5" /> Pay
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create invoice modal */}
      <SimpleModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Manual Invoice"
        subtitle="Generate a billing invoice for an offline client."
        width="max-w-2xl"
      >
        <form onSubmit={handleCreateInvoiceSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="customer" className="text-xs font-semibold text-foreground">Select Customer *</label>
            <select id="customer" required value={newCustomerId} onChange={(e) => setNewCustomerId(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">— Choose Client —</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="amount" className="text-xs font-semibold text-foreground">Amount ({business.currency}) *</label>
              <Input id="amount" type="number" required min="1" step="0.01" placeholder="2500" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="due_date" className="text-xs font-semibold text-foreground">Due Date *</label>
              <input id="due_date" type="date" required value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="notes" className="text-xs font-semibold text-foreground">Notes / Invoice items</label>
            <textarea id="notes" rows={3} placeholder="Hair cutting and hair coloring treatments…" value={newNotes} onChange={(e) => setNewNotes(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          {createError && (
            <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">
              <Icon icon="solar:danger-circle-broken" className="h-4 w-4 shrink-0" /><span>{createError}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)} disabled={createLoading}>Cancel</Button>
            <Button type="submit" loading={createLoading}>Create Draft</Button>
          </div>
        </form>
      </SimpleModal>

      {/* Record payment modal */}
      <SimpleModal
        isOpen={!!recordingInvoice}
        onClose={() => setRecordingInvoice(null)}
        title="Record Payment"
        subtitle={recordingInvoice ? `Recording receipt for ${recordingInvoice.invoice_number}` : undefined}
        width="max-w-md"
      >
        <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
          {recordingInvoice && (
            <div className="bg-muted/40 border border-border/30 rounded-xl p-3 text-xs space-y-1.5">
              <div className="flex justify-between text-muted-foreground">
                <span>Total Amount</span><span>{formatCurrency(Number(recordingInvoice.amount), recordingInvoice.currency)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Already Paid</span><span>{formatCurrency(Number(recordingInvoice.amount_paid), recordingInvoice.currency)}</span>
              </div>
              <div className="flex justify-between font-semibold text-foreground border-t border-border/35 pt-1.5">
                <span>Remaining Due</span>
                <span>{formatCurrency(Number(recordingInvoice.amount) - Number(recordingInvoice.amount_paid), recordingInvoice.currency)}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="p_amount" className="text-xs font-semibold text-foreground">Received Amount *</label>
              <Input id="p_amount" type="number" required min="1" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="p_status" className="text-xs font-semibold text-foreground">Payment State *</label>
              <select id="p_status" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="paid">Record Paid / Partial</option>
                <option value="cancelled">Mark Cancelled</option>
                <option value="disputed">Mark Disputed</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="p_notes" className="text-xs font-semibold text-foreground">Notes / Transaction reference</label>
            <textarea id="p_notes" rows={2} placeholder="Customer paid via cash during salon checkout…" value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          {recordError && (
            <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">
              <Icon icon="solar:danger-circle-broken" className="h-4 w-4 shrink-0" /><span>{recordError}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setRecordingInvoice(null)} disabled={recordLoading}>Cancel</Button>
            <Button type="submit" loading={recordLoading}>Record Payment</Button>
          </div>
        </form>
      </SimpleModal>
    </div>
  );
}
