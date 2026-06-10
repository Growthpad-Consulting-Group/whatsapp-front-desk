"use client";

import { useState, useEffect } from "react";
import { formatCurrency, formatDateTime, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  updateCustomerNotesAction,
  updateCustomerConsentAction,
  updateCustomerTagsAction,
  updateCustomerSpecialDatesAction,
} from "@/actions/customers";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import PageHeader from "@/components/ui/PageHeader";
import { Tabs } from "@/components/ui/Tabs";
import { DatePicker } from "@/components/ui/DatePicker";

interface CustomerDetailClientProps {
  customer: any;
  appointments: any[];
  invoices: any[];
  messages: any[];
  business: any;
}

export function CustomerDetailClient({
  customer,
  appointments,
  invoices,
  messages,
  business,
}: CustomerDetailClientProps) {
  const [notes, setNotes] = useState(customer.notes || "");
  const [consent, setConsent] = useState(customer.consent_given);
  const [tags, setTags] = useState<string[]>(customer.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [tagsSaving, setTagsSaving] = useState(false);
  const [birthday, setBirthday] = useState<string>(customer.birthday ?? "");
  const [anniversary, setAnniversary] = useState<string>(customer.anniversary ?? "");
  const [datesSaving, setDatesSaving] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesFeedback, setNotesFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [consentLoading, setConsentLoading] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("bookings");

  useEffect(() => {
    if (!notesFeedback) return;
    const t = setTimeout(() => setNotesFeedback(null), 3000);
    return () => clearTimeout(t);
  }, [notesFeedback]);

  const statusColors: Record<string, "default" | "success" | "warning" | "destructive" | "outline"> = {
    pending: "warning", confirmed: "success", cancelled: "destructive",
    completed: "outline", no_show: "destructive",
    draft: "outline", sent: "warning", due: "warning",
    overdue: "destructive", partially_paid: "default", paid: "success", disputed: "destructive",
  };

  const handleAddTag = async (raw: string) => {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, "-");
    if (!tag || tags.includes(tag)) { setTagInput(""); return; }
    const next = [...tags, tag];
    setTags(next);
    setTagInput("");
    setTagsSaving(true);
    const res = await updateCustomerTagsAction(customer.id, next);
    setTagsSaving(false);
    if (!res.success) toast.error("Failed to save tag.");
  };

  const handleRemoveTag = async (tag: string) => {
    const next = tags.filter((t) => t !== tag);
    setTags(next);
    setTagsSaving(true);
    const res = await updateCustomerTagsAction(customer.id, next);
    setTagsSaving(false);
    if (!res.success) toast.error("Failed to remove tag.");
  };

  const handleSaveDates = async () => {
    setDatesSaving(true);
    const res = await updateCustomerSpecialDatesAction(customer.id, birthday || null, anniversary || null);
    setDatesSaving(false);
    if (res.success) toast.success("Special dates saved.");
    else toast.error("Failed to save dates.");
  };

  const handleSaveNotes = async () => {
    setNotesLoading(true);
    setNotesFeedback(null);
    const res = await updateCustomerNotesAction(customer.id, notes);
    setNotesLoading(false);
    if (res.success) {
      toast.success("Notes saved.");
    } else {
      setNotesFeedback({ ok: false, msg: res.error || "Failed to update notes." });
      toast.error(res.error || "Failed to update notes.");
    }
  };

  const handleToggleConsent = async () => {
    setConsentLoading(true);
    setConsentError(null);
    const nextConsent = !consent;
    const res = await updateCustomerConsentAction(customer.id, nextConsent);
    setConsentLoading(false);
    if (res.success) {
      setConsent(nextConsent);
      toast.success(nextConsent ? "Bot consent enabled." : "Bot consent disabled.");
    } else {
      setConsentError(res.error || "Failed to update consent status.");
      toast.error(res.error || "Failed to update consent.");
    }
  };

  const detailTabs = [
    { key: "bookings", label: "Bookings", icon: "solar:calendar-date-broken", badge: appointments.length },
    { key: "invoices", label: "Invoices", icon: "solar:document-text-broken", badge: invoices.length },
    { key: "chat", label: "WhatsApp Logs", icon: "solar:chat-square-broken", badge: messages.length },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={customer.name}
        icon="solar:user-id-bold-duotone"
        iconBgColor="bg-linear-to-br from-blue-600 to-blue-500"
        description={`${customer.phone}${customer.email ? ` · ${customer.email}` : ""}`}
        actions={[{ label: "Back to Directory", icon: "solar:arrow-left-broken", variant: "secondary" as const, onClick: () => history.back() }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left CRM Profile Card */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-card/65 backdrop-blur-md border border-border rounded-2xl p-6 shadow-sm space-y-5">
            {/* Avatar */}
            <div className="text-center pb-4 border-b border-border/40">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold mx-auto mb-3">
                {customer.name?.substring(0, 2).toUpperCase()}
              </div>
              <h2 className="text-lg font-bold text-foreground">{customer.name}</h2>
              <p className="text-xs text-muted-foreground font-mono mt-1">{customer.phone}</p>
              {customer.email && <p className="text-xs text-muted-foreground mt-0.5">{customer.email}</p>}
            </div>

            {/* Consent */}
            <div className="space-y-3 text-xs leading-normal">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-semibold">Message Consent</span>
                <button
                  type="button"
                  disabled={consentLoading}
                  onClick={handleToggleConsent}
                  className={cn(
                    "px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer",
                    consent
                      ? "text-green-600 bg-green-500/10 border-green-500/25 hover:bg-green-500/20"
                      : "text-muted-foreground bg-muted border-border hover:bg-muted/80"
                  )}
                >
                  {consentLoading ? "Saving…" : consent ? "Allowed" : "No Consent"}
                </button>
              </div>
              {consentError && <p className="text-[11px] text-destructive">{consentError}</p>}
              <div className="flex justify-between">
                <span className="text-muted-foreground font-semibold">Client Registered</span>
                <span className="text-foreground">{new Date(customer.created_at).toLocaleDateString("en-GB")}</span>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-3 pt-3 border-t border-border/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tags</span>
                {tagsSaving && <Icon icon="solar:spinner-broken" className="h-3 w-3 animate-spin text-muted-foreground" />}
              </div>
              <div className="flex flex-wrap gap-1.5 min-h-6">
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-semibold">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-destructive transition-colors" aria-label={`Remove ${tag}`}>
                      <Icon icon="solar:close-circle-broken" className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {tags.length === 0 && <span className="text-[10px] text-muted-foreground italic">No tags yet</span>}
              </div>
              <input
                type="text"
                placeholder="Add tag and press Enter…"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(tagInput); } }}
                onBlur={() => { if (tagInput.trim()) handleAddTag(tagInput); }}
                className="h-8 w-full rounded-lg border border-border bg-background px-3 text-[11px] focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Special Dates */}
            <div className="space-y-3 pt-3 border-t border-border/40">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Special Dates</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                    <Icon icon="solar:gift-broken" className="h-3 w-3" /> Birthday
                  </label>
                  <DatePicker value={birthday} onChange={setBirthday} placeholder="Pick date" popoverWidth={260} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                    <Icon icon="solar:heart-broken" className="h-3 w-3" /> Anniversary
                  </label>
                  <DatePicker value={anniversary} onChange={setAnniversary} placeholder="Pick date" popoverWidth={260} />
                </div>
              </div>
              <Button size="sm" variant="secondary" onClick={handleSaveDates} loading={datesSaving} className="w-full text-xs">
                Save Dates
              </Button>
            </div>

            {/* Notes */}
            <div className="space-y-3 pt-3 border-t border-border/40">
              <label htmlFor="crm_notes" className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Client Notes
              </label>
              <textarea
                id="crm_notes"
                rows={4}
                placeholder="Record preferences, sizes, allergy flags or notes here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-sans"
              />
              <Button size="sm" onClick={handleSaveNotes} loading={notesLoading} className="w-full text-xs">
                Save Notes
              </Button>
              {notesFeedback && (
                <p className={cn("text-[11px] font-medium", notesFeedback.ok ? "text-green-600 dark:text-green-400" : "text-destructive")}>
                  {notesFeedback.ok
                    ? <span className="flex items-center gap-1"><Icon icon="solar:check-circle-broken" className="h-3.5 w-3.5" />{notesFeedback.msg}</span>
                    : notesFeedback.msg}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right tabbed workspace */}
        <div className="lg:col-span-8 bg-card/75 backdrop-blur-md border border-border rounded-2xl p-6 shadow-sm space-y-5">
          <Tabs tabs={detailTabs} activeTab={activeTab} onChange={setActiveTab} />

          <div className="min-h-80">
            {/* BOOKINGS TAB */}
            {activeTab === "bookings" && (
              <div className="space-y-4">
                {appointments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground space-y-2">
                    <Icon icon="solar:calendar-remove-broken" className="h-10 w-10 text-muted-foreground/50 mx-auto" />
                    <p className="text-xs">No bookings recorded for this client.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {appointments.map((appt) => {
                      const service = appt.services || {};
                      const staff = appt.staff_members || {};
                      return (
                        <div key={appt.id} className="border border-border/50 rounded-2xl p-4 bg-background/30 space-y-3.5">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-semibold text-foreground text-sm truncate">{service.name}</h4>
                            <Badge variant={statusColors[appt.status] || "default"}>{appt.status}</Badge>
                          </div>
                          <div className="space-y-1.5 text-xs text-muted-foreground">
                            <p className="flex justify-between"><span>Time</span><span className="font-medium text-foreground">{formatDateTime(appt.start_at, business.timezone)}</span></p>
                            <p className="flex justify-between"><span>Assigned Staff</span><span className="font-medium text-foreground">{staff.name || "N/A"}</span></p>
                            <p className="flex justify-between"><span>Payment Status</span><span className="font-medium text-foreground uppercase tracking-wide text-[10px]">{appt.payment_status}</span></p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* INVOICES TAB */}
            {activeTab === "invoices" && (
              <div className="space-y-4">
                {invoices.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground space-y-2">
                    <Icon icon="solar:file-remove-broken" className="h-10 w-10 text-muted-foreground/50 mx-auto" />
                    <p className="text-xs">No invoice records for this client.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {invoices.map((inv) => {
                      const outstanding = Number(inv.amount) - Number(inv.amount_paid);
                      return (
                        <div key={inv.id} className="border border-border/50 rounded-2xl p-4 bg-background/30 flex flex-col justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-bold font-mono text-muted-foreground">{inv.invoice_number}</span>
                              <Badge variant={statusColors[inv.status] || "default"}>{inv.status}</Badge>
                            </div>
                            <div className="space-y-1 text-xs text-muted-foreground">
                              <p className="flex justify-between"><span>Due Date</span><span className="font-medium text-foreground">{inv.due_date}</span></p>
                              <p className="flex justify-between"><span>Paid Amount</span><span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(Number(inv.amount_paid), inv.currency)}</span></p>
                              <p className="flex justify-between"><span>Total Net Due</span><span className="font-semibold text-foreground">{formatCurrency(outstanding, inv.currency)}</span></p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => window.open(`/invoice/${inv.id}`, "_blank")} className="w-full flex items-center justify-center gap-1 border border-border text-xs text-foreground hover:bg-muted">
                            <Icon icon="solar:eye-broken" className="h-3.5 w-3.5" /> View Receipt
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* CHAT LOGS TAB */}
            {activeTab === "chat" && (
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground space-y-2">
                    <Icon icon="solar:chat-square-broken" className="h-10 w-10 text-muted-foreground/50 mx-auto" />
                    <p className="text-xs">No logged messages yet.</p>
                  </div>
                ) : (
                  <div className="border border-border/50 rounded-2xl bg-background/25 p-4 flex flex-col gap-4 max-h-115 overflow-y-auto">
                    {messages.map((msg) => {
                      const isInbound = msg.direction === "inbound";
                      return (
                        <div key={msg.id} className={cn(
                          "flex flex-col max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed border relative shadow-sm",
                          isInbound
                            ? "bg-muted/50 border-border/40 text-foreground self-start rounded-tl-none"
                            : "bg-primary/5 border-primary/20 text-foreground self-end rounded-tr-none"
                        )}>
                          <p>{msg.content_summary}</p>
                          <div className="flex items-center gap-1 mt-1.5 self-end text-[9px] text-muted-foreground">
                            <span>{new Date(msg.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                            {!isInbound && (
                              <Icon
                                icon={msg.status === "read" ? "mdi:check-all" : msg.status === "delivered" ? "mdi:check" : msg.status === "failed" ? "mdi:alert-circle-outline" : "mdi:clock-outline"}
                                className={cn("h-3.5 w-3.5", msg.status === "read" && "text-blue-500", msg.status === "failed" && "text-destructive")}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
