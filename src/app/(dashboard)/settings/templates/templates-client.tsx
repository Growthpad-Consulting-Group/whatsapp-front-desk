"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { updateMessageTemplateAction } from "@/actions/business";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/ui/PageHeader";
import { SimpleModal } from "@/components/common/SimpleModal";
import { GenericTable, type TableColumn } from "@/components/ui/GenericTable";
import toast from "react-hot-toast";

interface Template {
  id: string;
  business_id: string;
  type: string;
  language: string;
  body: string;
  approval_status: "local" | "pending" | "approved" | "rejected";
}

interface TemplatesClientProps {
  initialTemplates: Template[];
  business: any;
}

const TEMPLATE_TYPES = [
  { type: "booking_confirmed", label: "Booking Confirmation", icon: "solar:check-square-broken", category: "Booking" },
  { type: "deposit_request", label: "Deposit Request", icon: "solar:wallet-money-broken", category: "Booking" },
  { type: "24h_before", label: "24-Hour Reminder", icon: "solar:bell-bing-broken", category: "Booking" },
  { type: "2h_before", label: "2-Hour Reminder", icon: "solar:clock-circle-broken", category: "Booking" },
  { type: "invoice_sent", label: "Invoice Sent", icon: "solar:document-text-broken", category: "Invoice" },
  { type: "invoice_due", label: "Invoice Due", icon: "solar:calendar-date-broken", category: "Invoice" },
  { type: "invoice_overdue_1_3", label: "Invoice Overdue (1–3 Days)", icon: "solar:danger-triangle-broken", category: "Invoice" },
  { type: "invoice_overdue_4_7", label: "Invoice Overdue (4–7 Days)", icon: "solar:danger-circle-broken", category: "Invoice" },
];

const DEFAULT_TEMPLATES: Record<string, string> = {
  booking_confirmed: "Hi {{customer_name}}! Your booking for *{{service_name}}* is confirmed for {{date}} at {{time}}. Reply *R* to reschedule or *C* to cancel. — {{business_name}}",
  deposit_request: "Hi {{customer_name}}, to secure your booking for *{{service_name}}* on {{date}} at {{time}}, please pay the deposit of *{{amount}}* here: {{payment_link}} — {{business_name}}",
  "24h_before": "Hi {{customer_name}}, this is a friendly reminder that you have an upcoming appointment for *{{service_name}}* tomorrow at {{time}}. Reply *R* to reschedule or *C* to cancel. — {{business_name}}",
  "2h_before": "Hi {{customer_name}}, this is a friendly reminder that your appointment for *{{service_name}}* is today at {{time}}. We look forward to seeing you! — {{business_name}}",
  invoice_sent: "Hi {{customer_name}}, here is your invoice {{invoice_number}} for {{amount}} due on {{due_date}}. View and pay here: {{invoice_link}} — {{business_name}}",
  invoice_due: "Hi {{customer_name}}, this is a reminder that invoice {{invoice_number}} for {{amount}} is due today. View and pay here: {{invoice_link}} — {{business_name}}",
  invoice_overdue_1_3: "Hi {{customer_name}}, this is a friendly reminder that invoice {{invoice_number}} for {{amount}} is overdue. Please complete your payment here: {{invoice_link}} — {{business_name}}",
  invoice_overdue_4_7: "Hi {{customer_name}}, invoice {{invoice_number}} for {{amount}} is overdue. Please let us know when you can complete payment or click here: {{invoice_link}} — {{business_name}}",
};

const VARIABLES = [
  { name: "{{business_name}}", desc: "Your business name" },
  { name: "{{customer_name}}", desc: "Client's full name" },
  { name: "{{service_name}}", desc: "Booked service description" },
  { name: "{{date}}", desc: "Local booking date" },
  { name: "{{time}}", desc: "Local booking start time" },
  { name: "{{amount}}", desc: "Deposit or payment amount" },
  { name: "{{payment_link}}", desc: "Paystack transaction URL" },
  { name: "{{invoice_link}}", desc: "Public invoice receipt URL" },
  { name: "{{invoice_number}}", desc: "Invoice reference number" },
  { name: "{{due_date}}", desc: "Invoice due date" },
];

const STATUS_STYLE: Record<string, string> = {
  local: "text-blue-600 bg-blue-500/10 border-blue-500/20",
  pending: "text-yellow-600 bg-yellow-500/10 border-yellow-500/20",
  approved: "text-green-600 bg-green-500/10 border-green-500/20",
  rejected: "text-red-500 bg-red-500/10 border-red-500/20",
};
const STATUS_LABEL: Record<string, string> = {
  local: "Draft",
  pending: "Pending",
  approved: "Active",
  rejected: "Rejected",
};

// ─── Row type for the table ───────────────────────────────────────────────────

interface TemplateRow {
  type: string;
  label: string;
  icon: string;
  category: string;
  body: string;
  approval_status: "local" | "pending" | "approved" | "rejected";
  isCustom: boolean;
  id: string;
}

// ─── Editor Modal ─────────────────────────────────────────────────────────────

interface EditorModalProps {
  row: TemplateRow | null;
  business: any;
  onClose: () => void;
  onSaved: (updated: Template) => void;
}

function EditorModal({ row, business, onClose, onSaved }: EditorModalProps) {
  const [body, setBody] = useState(row?.body ?? "");
  const [saveLoading, setSaveLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);

  // Sync body whenever a different row is opened
  useEffect(() => {
    if (row) setBody(row.body);
  }, [row?.type]);

  // Capture row snapshot so async handlers stay correct after row goes null
  const rowRef = useRef(row);
  useEffect(() => { if (row) rowRef.current = row; }, [row]);

  const livePreview = useMemo(() => {
    const dummyVals: Record<string, string> = {
      business_name: business.name || "Apex Wellness",
      customer_name: "Sarah Jenkins",
      service_name: "Premium Aromatherapy Massage",
      date: "09/06/2026",
      time: "10:30 AM",
      amount: "KES 3,500.00",
      payment_link: "https://checkout.paystack.co/demo_link",
      invoice_link: `${process.env.NEXT_PUBLIC_APP_URL || ""}/invoice/demo_id`,
      invoice_number: "INV-01205",
      due_date: "10/06/2026",
    };
    let out = body;
    for (const [k, v] of Object.entries(dummyVals)) {
      out = out.replace(new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, "g"), v);
    }
    return out;
  }, [body, business.name]);

  const handleSave = async () => {
    const snap = rowRef.current;
    if (!snap) return;
    setSaveLoading(true);
    const res = await updateMessageTemplateAction(snap.id || null, snap.type, body, snap.approval_status);
    setSaveLoading(false);
    if (res.success && res.data) {
      onSaved(res.data);
      toast.success("Template saved.");
      onClose();
    } else {
      toast.error(res.error || "Failed to save template.");
    }
  };

  const handleMetaSubmit = async () => {
    const snap = rowRef.current;
    if (!snap) return;
    setMetaLoading(true);
    const resPending = await updateMessageTemplateAction(snap.id || null, snap.type, body, "pending");
    if (!resPending.success || !resPending.data) {
      setMetaLoading(false);
      toast.error(resPending.error || "Failed to submit for approval.");
      return;
    }
    onSaved(resPending.data);
    setTimeout(async () => {
      const resApproved = await updateMessageTemplateAction(resPending.data.id, snap.type, body, "approved");
      setMetaLoading(false);
      if (resApproved.success && resApproved.data) {
        onSaved(resApproved.data);
        toast.success("WhatsApp template approved by Meta!");
        onClose();
      }
    }, 1500);
  };

  const status = row?.approval_status ?? "local";

  return (
    <SimpleModal
      isOpen={!!row}
      onClose={onClose}
      width="max-w-4xl"
      noPadding
      title={row?.label ?? "Edit Template"}
      icon={row?.icon ?? "solar:document-text-broken"}
    >
      <div className="flex min-h-130 max-h-[82vh]">

        {/* ── Left panel — gradient + WhatsApp preview ── */}
        <div className="hidden md:flex flex-col w-92 shrink-0 bg-slate-50 dark:bg-slate-900/40 border-r border-border/60 rounded-l-3xl p-6 overflow-y-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
              <Icon icon={row?.icon ?? "solar:document-text-broken"} className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-sm font-bold text-foreground leading-snug">{row?.label ?? ""}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">{row?.category} trigger</p>
          </div>

          {/* Status pill */}
          <div className={cn(
            "inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-lg text-[10px] font-bold border mb-6",
            status === "approved" ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
              : status === "pending" ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                : status === "rejected" ? "bg-red-500/10 border-red-500/20 text-red-500"
                  : "bg-muted/60 border-border text-muted-foreground"
          )}>
            <Icon icon={
              status === "approved" ? "solar:check-circle-broken"
                : status === "pending" ? "solar:clock-circle-broken"
                  : status === "rejected" ? "solar:close-circle-broken"
                    : "solar:pen-broken"
            } className="h-3 w-3" />
            {STATUS_LABEL[status]}
          </div>

          {/* WhatsApp phone mockup */}
          <div className="flex-1 flex flex-col">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Live Preview</p>

            {/* Phone frame */}
            <div className="bg-background border border-border shadow-md rounded-2xl p-3 flex flex-col gap-2">
              {/* Chat header */}
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary">
                  {(row?.label ?? "W").charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground leading-none">Booking Bot</p>
                  <p className="text-[10px] text-green-600 dark:text-green-400">online</p>
                </div>
              </div>

              {/* Message bubble */}
              <div className="flex justify-start">
                <div className="bg-[#E2F9CD] dark:bg-[#054640] rounded-2xl rounded-tl-none px-3 py-2 max-w-[90%] shadow-xs">
                  <p className="text-xs text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-wrap wrap-break-word font-sans">
                    {livePreview || <span className="text-slate-400/70 italic">Message preview…</span>}
                  </p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[8px] text-slate-500/80 dark:text-slate-400/80">10:30 AM</span>
                    <Icon icon="solar:double-alt-check-broken" className="h-3 w-3 text-sky-600 dark:text-sky-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* WhatsApp badge */}
            <div className="flex items-center gap-1.5 mt-4">
              <Icon icon="mdi:whatsapp" className="h-3.5 w-3.5 text-green-500" />
              <span className="text-[10px] text-muted-foreground font-medium">WhatsApp Business</span>
            </div>
          </div>
        </div>

        {/* ── Right panel — editor ── */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Header */}
          <div className="px-6 py-4 border-b border-border/60 shrink-0">
            <p className="text-xs text-muted-foreground">Edit the message body and insert dynamic variables.</p>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Textarea */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground block">Message Body</label>
              <textarea
                rows={7}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Type your message here…"
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-sans resize-none leading-relaxed"
              />
            </div>

            {/* Variable chips */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Click a tag to insert</p>
              <div className="flex flex-wrap gap-1.5">
                {VARIABLES.map((v) => (
                  <button
                    key={v.name}
                    type="button"
                    title={v.desc}
                    onClick={() => setBody((prev) => prev + " " + v.name)}
                    className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-[10px] font-semibold text-primary hover:bg-primary/20 transition-colors font-mono"
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/60 shrink-0">
            {status !== "approved" && status !== "pending" && (
              <Button
                type="button"
                variant="ghost"
                loading={metaLoading}
                onClick={handleMetaSubmit}
                className="border border-border text-foreground hover:bg-muted text-sm"
              >
                Submit for Meta Approval
              </Button>
            )}
            <Button type="button" onClick={handleSave} loading={saveLoading}>
              Save Changes
            </Button>
          </div>
        </div>

      </div>
    </SimpleModal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TemplatesClient({ initialTemplates, business }: TemplatesClientProps) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [editingRow, setEditingRow] = useState<TemplateRow | null>(null);

  const rows: TemplateRow[] = useMemo(() => TEMPLATE_TYPES.map((t) => {
    const saved = templates.find((s) => s.type === t.type);
    return {
      type: t.type,
      label: t.label,
      icon: t.icon,
      category: t.category,
      body: saved?.body ?? DEFAULT_TEMPLATES[t.type] ?? "",
      approval_status: saved?.approval_status ?? "local",
      isCustom: !!saved,
      id: saved?.id ?? "",
    };
  }), [templates]);

  const handleSaved = (updated: Template) => {
    setTemplates((prev) => {
      const filtered = prev.filter((t) => t.type !== updated.type);
      return [...filtered, updated];
    });
    // Update editingRow status in-place so modal reflects new state
    setEditingRow((prev) => prev ? {
      ...prev,
      id: updated.id,
      body: updated.body,
      approval_status: updated.approval_status,
      isCustom: true,
    } : null);
  };

  const columns: TableColumn<TemplateRow>[] = [
    {
      key: "label",
      header: "Template",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Icon icon={row.icon} className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{row.label}</p>
            <p className="text-[11px] text-muted-foreground">{row.category} trigger</p>
          </div>
        </div>
      ),
    },
    {
      key: "approval_status",
      header: "Status",
      width: "w-32",
      render: (row) => (
        <span className={cn("px-2 py-0.5 text-[10px] font-semibold border rounded-md", STATUS_STYLE[row.approval_status])}>
          {STATUS_LABEL[row.approval_status]}
        </span>
      ),
    },
    {
      key: "body",
      header: "Message Preview",
      hideOnMobile: true,
      render: (row) => (
        <p className="text-xs text-muted-foreground truncate max-w-xs">{row.body}</p>
      ),
    },
    {
      key: "isCustom",
      header: "Source",
      width: "w-24",
      align: "center",
      render: (row) => (
        <span className={cn(
          "text-[10px] font-semibold uppercase tracking-wide",
          row.isCustom ? "text-primary" : "text-muted-foreground",
        )}>
          {row.isCustom ? "Custom" : "Default"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Message Templates"
        icon="solar:document-text-bold-duotone"
        iconBgColor="bg-linear-to-br from-blue-600 to-blue-500"
        description="Customise the WhatsApp messages sent automatically at each booking stage"
      />

      <GenericTable
        data={rows}
        columns={columns}
        keyExtractor={(r) => r.type}
        onRowClick={setEditingRow}
        emptyIcon="solar:document-text-broken"
        emptyTitle="No templates configured"
        emptyDescription="Templates will appear here once loaded."
        actions={[
          {
            icon: "solar:pen-new-square-broken",
            label: "Edit",
            onClick: setEditingRow,
          },
        ]}
      />

      <EditorModal
        row={editingRow}
        business={business}
        onClose={() => setEditingRow(null)}
        onSaved={handleSaved}
      />
    </div>
  );
}
