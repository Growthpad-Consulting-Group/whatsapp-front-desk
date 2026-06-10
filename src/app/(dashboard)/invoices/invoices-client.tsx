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
import { DatePicker } from "@/components/ui/DatePicker";
import { DateRangePicker, type DateRangeValue } from "@/components/ui/DateRangePicker";
import toast from "react-hot-toast";
import {
  sendInvoiceAction,
  markInvoicePaymentAction,
  createManualInvoiceAction,
  setInvoicePromiseDateAction,
  toggleInvoiceRemindersPausedAction,
} from "@/actions/invoices";
import { Icon } from "@iconify/react";
import { Badge } from "@/components/ui/badge";
import { FormError } from "@/components/ui/form-error";
import type { Business } from "@/types";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "sent", label: "Sent" },
  { key: "partially_paid", label: "Partial" },
  { key: "paid", label: "Paid" },
  { key: "overdue", label: "Overdue" },
];

interface InvoiceCustomer {
  id: string;
  name: string;
  phone: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  amount_paid: number;
  currency: string;
  due_date: string;
  status: string;
  notes: string | null;
  promise_date: string | null;
  reminders_paused: boolean;
  customers: InvoiceCustomer | null;
}

interface CustomerOption {
  id: string;
  name: string;
  phone: string;
}

interface ServiceOption {
  id: string;
  name: string;
  price: number;
}

interface InvoicesClientProps {
  initialInvoices: Invoice[];
  customers: CustomerOption[];
  services: ServiceOption[];
  business: Business;
}

export function InvoicesClient({ initialInvoices, customers, business }: Omit<InvoicesClientProps, "services"> & { services?: ServiceOption[] }) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateRange, setDateRange] = useState<DateRangeValue>({ start: "", end: "", label: "" });

  // Create invoice modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCustomerId, setNewCustomerId] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Record payment modal
  const [recordingInvoice, setRecordingInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [recordLoading, setRecordLoading] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);

  // Promise-to-pay modal
  const [promiseInvoice, setPromiseInvoice] = useState<Invoice | null>(null);
  const [promiseDate, setPromiseDate] = useState("");
  const [promiseLoading, setPromiseLoading] = useState(false);

  const [sendingInvoiceId, setSendingInvoiceId] = useState<string | null>(null);
  const [togglingPauseId, setTogglingPauseId] = useState<string | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

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
    const customer = inv.customers;
    const matchesSearch = !searchTerm ||
      inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer?.phone?.includes(searchTerm);
    const matchesStatus = selectedStatus === "all" || inv.status === selectedStatus;
    let matchesDate = true;
    if (dateRange.start && dateRange.end && inv.due_date) {
      matchesDate = inv.due_date >= dateRange.start && inv.due_date <= dateRange.end;
    }
    return matchesSearch && matchesStatus && matchesDate;
  }), [invoices, searchTerm, selectedStatus, dateRange]);

  const statusTabs = STATUS_TABS.map((t) => ({
    ...t,
    badge: t.key !== "all" ? invoices.filter((inv) => inv.status === t.key).length : undefined,
  }));

  const handleSendReminder = async (invoiceId: string) => {
    setSendingInvoiceId(invoiceId);
    const res = await sendInvoiceAction(invoiceId);
    setSendingInvoiceId(null);
    if (res.success) {
      setInvoices((prev) => prev.map((inv) => inv.id === invoiceId ? { ...inv, status: "sent" } : inv));
      toast.success("Invoice sent to customer.");
    } else {
      toast.error("Failed to send invoice.");
    }
  };

  const handleTogglePause = async (inv: Invoice) => {
    setTogglingPauseId(inv.id);
    const res = await toggleInvoiceRemindersPausedAction(inv.id, !inv.reminders_paused);
    setTogglingPauseId(null);
    if (res.success) {
      setInvoices((prev) => prev.map((i) => i.id === inv.id ? { ...i, reminders_paused: !inv.reminders_paused } : i));
      toast.success(inv.reminders_paused ? "Reminders resumed." : "Reminders paused.");
    } else {
      toast.error("Failed to update reminders.");
    }
  };

  const handleSetPromiseDate = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!promiseInvoice) return;
    setPromiseLoading(true);
    const res = await setInvoicePromiseDateAction(promiseInvoice.id, promiseDate || null);
    setPromiseLoading(false);
    if (res.success) {
      setInvoices((prev) => prev.map((i) => i.id === promiseInvoice.id ? { ...i, promise_date: promiseDate || null } : i));
      setPromiseInvoice(null);
      setPromiseDate("");
      toast.success("Promise date saved.");
    } else {
      toast.error("Failed to save promise date.");
    }
  };

  const handleCreateInvoiceSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!newCustomerId || !newAmount || !newDueDate) {
      setCreateError("Please fill out all required fields.");
      return;
    }
    setCreateLoading(true);
    setCreateError(null);
    const res = await createManualInvoiceAction(newCustomerId, Number(newAmount), newDueDate, newNotes || undefined);
    setCreateLoading(false);
    if (res.success && res.data) {
      const customer = customers.find((c) => c.id === newCustomerId) ?? null;
      setInvoices((prev) => [{ ...res.data, customers: customer, promise_date: null, reminders_paused: false }, ...prev]);
      setIsCreateOpen(false);
      setNewCustomerId(""); setNewAmount(""); setNewDueDate(""); setNewNotes("");
      toast.success("Invoice created.");
    } else {
      setCreateError(res.error ?? "Failed to create invoice.");
    }
  };

  const handleRecordPaymentSubmit = async (e: React.SyntheticEvent) => {
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
      toast.success("Payment recorded.");
    } else {
      setRecordError(res.error ?? "Failed to record payment.");
      toast.error(res.error ?? "Failed to record payment.");
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AnimatedMetricCard title="Collected Revenue" value={formatCurrency(metrics.collected, business.currency)} icon="solar:graph-up-broken" color="green" variant="card" />
        <AnimatedMetricCard title="Total Outstanding" value={formatCurrency(metrics.outstanding, business.currency)} icon="solar:document-text-broken" color="orange" variant="card" />
        <AnimatedMetricCard title="Overdue Balance" value={formatCurrency(metrics.overdue, business.currency)} icon="solar:danger-triangle-broken" color="red" variant="card" />
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
          <div className="flex items-center gap-2 shrink-0">
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder="Filter by due date"
              className="w-52"
            />
            <span className="text-xs text-muted-foreground">
              {filteredInvoices.length} of {invoices.length}
            </span>
          </div>
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
            const customer = inv.customers;
            const outstanding = Number(inv.amount) - Number(inv.amount_paid);
            return (
              <div key={inv.id} className="group relative overflow-hidden bg-card/65 backdrop-blur-md border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-xs font-semibold text-muted-foreground font-mono block">{inv.invoice_number}</span>
                      <h4 className="font-semibold text-foreground mt-1 text-sm">{customer?.name ?? "Offline Client"}</h4>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {inv.reminders_paused && (
                        <span title="Reminders paused">
                          <Icon icon="solar:bell-off-broken" className="h-4 w-4 text-muted-foreground" />
                        </span>
                      )}
                      <StatusPill status={inv.status} context="invoice" variant="default" />
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1.5 bg-background/40 border border-border/30 rounded-xl p-3">
                    <p className="flex justify-between"><span>Due Date</span><span className="font-medium text-foreground">{inv.due_date}</span></p>
                    <p className="flex justify-between"><span>Customer Phone</span><span className="font-medium text-foreground">{customer?.phone ?? "N/A"}</span></p>
                    {inv.promise_date && (
                      <p className="flex justify-between text-amber-600 dark:text-amber-400">
                        <span>Promised</span>
                        <span className="font-medium">{inv.promise_date}</span>
                      </p>
                    )}
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

                {/* Primary actions */}
                <div className="flex gap-2 border-t border-border/50 pt-4 mt-4 text-xs">
                  <Button variant="ghost" size="sm" onClick={() => setViewingInvoice(inv)} className="flex-1 flex items-center justify-center gap-1 border border-border hover:bg-muted">
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

                {/* Collections controls — only on unpaid/overdue */}
                {outstanding > 0 && !["cancelled", "paid", "draft"].includes(inv.status) && (
                  <div className="flex gap-2 pt-2 mt-1 text-xs">
                    <button
                      onClick={() => { setPromiseInvoice(inv); setPromiseDate(inv.promise_date ?? ""); }}
                      className="flex-1 flex items-center justify-center gap-1 h-7 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-[11px] font-medium"
                    >
                      <Icon icon="solar:calendar-mark-broken" className="h-3 w-3" />
                      {inv.promise_date ? `Promised ${inv.promise_date}` : "Set Promise"}
                    </button>
                    <button
                      onClick={() => handleTogglePause(inv)}
                      disabled={togglingPauseId === inv.id}
                      className={`flex-1 flex items-center justify-center gap-1 h-7 rounded-lg border transition-colors text-[11px] font-medium ${
                        inv.reminders_paused
                          ? "border-amber-400/50 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/40"
                          : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon icon={inv.reminders_paused ? "solar:bell-off-broken" : "solar:bell-broken"} className="h-3 w-3" />
                      {inv.reminders_paused ? "Paused" : "Pause"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Invoice preview modal */}
      <SimpleModal
        isOpen={!!viewingInvoice}
        onClose={() => setViewingInvoice(null)}
        width="max-w-2xl"
        noPadding
        icon="solar:document-text-broken"
        title={viewingInvoice ? viewingInvoice.invoice_number : "Invoice"}
        subtitle={viewingInvoice?.customers?.name ?? undefined}
        rightElement={
          viewingInvoice ? (
            <a
              href={`/invoice/${viewingInvoice.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              <Icon icon="solar:square-top-down-broken" className="h-3.5 w-3.5" />
              Open full page
            </a>
          ) : undefined
        }
      >
        {viewingInvoice && (() => {
          const inv = viewingInvoice;
          const customer = inv.customers;
          const outstanding = Number(inv.amount) - Number(inv.amount_paid);
          return (
            <div className="divide-y divide-border/50">
              {/* Banner */}
              <div className="bg-primary/5 px-6 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{business.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Receipt &amp; Payment Desk</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusPill status={inv.status} context="invoice" size="md" />
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-6 px-6 py-5 text-sm">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Billed To</p>
                  <p className="font-semibold text-foreground">{customer?.name ?? "Offline Client"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{customer?.phone ?? "—"}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Details</p>
                  <p className="text-xs text-muted-foreground">Due: <span className="font-medium text-foreground">{inv.due_date}</span></p>
                  {inv.promise_date && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                      Promised: <span className="font-medium">{inv.promise_date}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Line items */}
              <div className="px-6 py-5 space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Items</p>
                <div className="border border-border/50 rounded-xl overflow-hidden">
                  <div className="bg-muted/30 grid grid-cols-3 px-4 py-2.5 text-xs font-semibold text-muted-foreground border-b border-border/40">
                    <span className="col-span-2">Description</span>
                    <span className="text-right">Amount</span>
                  </div>
                  <div className="grid grid-cols-3 px-4 py-3 text-sm">
                    <div className="col-span-2">
                      <p className="font-medium text-foreground">
                        {inv.notes || "Appointment Service Fee"}
                      </p>
                    </div>
                    <span className="text-right font-medium text-foreground self-center">
                      {formatCurrency(Number(inv.amount), inv.currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Totals */}
              <div className="px-6 py-5">
                <div className="ml-auto w-full sm:w-64 space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatCurrency(Number(inv.amount), inv.currency)}</span>
                  </div>
                  {Number(inv.amount_paid) > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>Already Paid</span>
                      <span>−{formatCurrency(Number(inv.amount_paid), inv.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base border-t border-border/50 pt-2 text-foreground">
                    <span>Total Due</span>
                    <span>{formatCurrency(outstanding, inv.currency)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5"
                >
                  <Icon icon="solar:printer-minimalistic-broken" className="h-4 w-4" />
                  Print
                </Button>
                {outstanding > 0 && inv.status !== "cancelled" && (
                  <Button
                    size="sm"
                    loading={sendingInvoiceId === inv.id}
                    onClick={async () => {
                      setSendingInvoiceId(inv.id);
                      const res = await sendInvoiceAction(inv.id);
                      setSendingInvoiceId(null);
                      if (res.success) {
                        setInvoices((prev) => prev.map((i) => i.id === inv.id ? { ...i, status: "sent" } : i));
                        setViewingInvoice((prev) => prev ? { ...prev, status: "sent" } : prev);
                        toast.success("Invoice sent to customer.");
                      } else {
                        toast.error("Failed to send invoice.");
                      }
                    }}
                    className="flex items-center gap-1.5"
                  >
                    <Icon icon="solar:plain-2-broken" className="h-4 w-4" />
                    Send to Customer
                  </Button>
                )}
              </div>
            </div>
          );
        })()}
      </SimpleModal>

      {/* Create invoice modal */}
      <SimpleModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Manual Invoice" subtitle="Generate a billing invoice for an offline client." width="max-w-xl">
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
              <label className="text-xs font-semibold text-foreground">Due Date *</label>
              <DatePicker value={newDueDate} onChange={setNewDueDate} placeholder="Pick due date" minDate={new Date().toISOString().split("T")[0]} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="notes" className="text-xs font-semibold text-foreground">Notes / Invoice items</label>
            <textarea id="notes" rows={3} placeholder="Hair cutting and hair coloring treatments…" value={newNotes} onChange={(e) => setNewNotes(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          {createError && <FormError message={createError} />}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)} disabled={createLoading}>Cancel</Button>
            <Button type="submit" loading={createLoading}>Create Draft</Button>
          </div>
        </form>
      </SimpleModal>

      {/* Record payment modal */}
      <SimpleModal isOpen={!!recordingInvoice} onClose={() => setRecordingInvoice(null)} title="Record Payment" subtitle={recordingInvoice ? `Receipt for ${recordingInvoice.invoice_number}` : undefined} width="max-w-md">
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
            <textarea id="p_notes" rows={2} placeholder="Customer paid via cash…" value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          {recordError && <FormError message={recordError} />}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setRecordingInvoice(null)} disabled={recordLoading}>Cancel</Button>
            <Button type="submit" loading={recordLoading}>Record Payment</Button>
          </div>
        </form>
      </SimpleModal>

      {/* Promise-to-pay modal */}
      <SimpleModal isOpen={!!promiseInvoice} onClose={() => setPromiseInvoice(null)} title="Promise to Pay" subtitle={promiseInvoice ? `Set a payment commitment date for ${promiseInvoice.invoice_number}` : undefined} variant="warning" width="max-w-sm">
        <form onSubmit={handleSetPromiseDate} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Overdue reminders will be paused until this date. If payment is not received by then, the sequence will resume automatically.
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">Promised Payment Date</label>
            <DatePicker value={promiseDate} onChange={setPromiseDate} placeholder="Pick promise date" minDate={new Date().toISOString().split("T")[0]} />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            {promiseInvoice?.promise_date && (
              <Button type="button" variant="secondary" loading={promiseLoading} onClick={async () => {
                setPromiseLoading(true);
                await setInvoicePromiseDateAction(promiseInvoice.id, null);
                setInvoices((prev) => prev.map((i) => i.id === promiseInvoice.id ? { ...i, promise_date: null } : i));
                setPromiseLoading(false);
                setPromiseInvoice(null);
              }}>Clear Date</Button>
            )}
            <Button type="button" variant="secondary" onClick={() => setPromiseInvoice(null)}>Cancel</Button>
            <Button type="submit" loading={promiseLoading}>Save Promise</Button>
          </div>
        </form>
      </SimpleModal>
    </div>
  );
}
