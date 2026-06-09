"use client";

import { useState, useMemo } from "react";
import { updateMessageTemplateAction } from "@/actions/business";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

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
  { type: "booking_confirmed", label: "Booking Confirmation", icon: "mdi:calendar-check" },
  { type: "deposit_request", label: "Deposit Request", icon: "mdi:cash-clock" },
  { type: "24h_before", label: "24-Hour Reminder", icon: "mdi:clock-alert-outline" },
  { type: "2h_before", label: "2-Hour Reminder", icon: "mdi:clock-fast" },
  { type: "invoice_sent", label: "Invoice Sent", icon: "mdi:file-document-outline" },
  { type: "invoice_due", label: "Invoice Due", icon: "mdi:calendar-alert" },
  { type: "invoice_overdue_1_3", label: "Invoice Overdue (1-3 Days)", icon: "mdi:alert-circle-outline" },
  { type: "invoice_overdue_4_7", label: "Invoice Overdue (4-7 Days)", icon: "mdi:alert-decagram-outline" },
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

// Variable explanation tags
const VARIABLES = [
  { name: "{{business_name}}", desc: "Your business name" },
  { name: "{{customer_name}}", desc: "Client's full name" },
  { name: "{{service_name}}", desc: "Booked service description" },
  { name: "{{date}}", desc: "Local booking date" },
  { name: "{{time}}", desc: "Local booking start time" },
  { name: "{{amount}}", desc: "Deduction or payment cost" },
  { name: "{{payment_link}}", desc: "Paystack transaction URL" },
  { name: "{{invoice_link}}", desc: "Public invoice receipt view URL" },
];

export function TemplatesClient({ initialTemplates, business }: TemplatesClientProps) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [activeType, setActiveType] = useState<string>("booking_confirmed");

  // Locate or fallback active template
  const activeTemplate = useMemo(() => {
    const existing = templates.find((t) => t.type === activeType);
    if (existing) return existing;
    return {
      id: "",
      business_id: business.id,
      type: activeType,
      language: "en",
      body: DEFAULT_TEMPLATES[activeType] || "",
      approval_status: "local" as const,
    };
  }, [templates, activeType, business.id]);

  const [editorBody, setEditorBody] = useState(activeTemplate.body);
  const [saveLoading, setSaveLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);

  // Sync editor field when active template changes
  useMemo(() => {
    setEditorBody(activeTemplate.body);
  }, [activeTemplate]);

  // Live variable translation engine
  const livePreview = useMemo(() => {
    let preview = editorBody;
    const dummyVals: Record<string, string> = {
      business_name: business.name || "Apex Wellness",
      customer_name: "Sarah Jenkins",
      service_name: "Premium Aromatherapy Massage",
      date: new Date().toLocaleDateString("en-GB"),
      time: "10:30 AM",
      amount: "KES 3,500.00",
      payment_link: "https://checkout.paystack.co/demo_link",
      invoice_link: `${process.env.NEXT_PUBLIC_APP_URL}/invoice/demo_invoice_id`,
      invoice_number: "INV-01205",
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString("en-GB"),
    };

    for (const [key, val] of Object.entries(dummyVals)) {
      preview = preview.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g"), val);
    }
    return preview;
  }, [editorBody, business.name]);

  // Save template settings
  const handleSave = async () => {
    setSaveLoading(true);
    const res = await updateMessageTemplateAction(
      activeTemplate.id || null,
      activeType,
      editorBody,
      activeTemplate.approval_status
    );
    setSaveLoading(false);

    if (res.success && res.data) {
      setTemplates((prev) => {
        const filtered = prev.filter((t) => t.type !== activeType);
        return [...filtered, res.data];
      });
      alert("Template content saved successfully!");
    } else {
      alert(res.error || "Failed to save template.");
    }
  };

  // Mock Meta Approval flow trigger
  const handleMetaSubmit = async () => {
    setMetaLoading(true);
    // 1. Submit for approval state
    const resPending = await updateMessageTemplateAction(
      activeTemplate.id || null,
      activeType,
      editorBody,
      "pending"
    );

    if (!resPending.success || !resPending.data) {
      setMetaLoading(false);
      alert(resPending.error || "Failed to submit for approval.");
      return;
    }

    setTemplates((prev) => {
      const filtered = prev.filter((t) => t.type !== activeType);
      return [...filtered, resPending.data];
    });

    // 2. Delay 1.5 seconds, then set to approved
    setTimeout(async () => {
      const resApproved = await updateMessageTemplateAction(
        resPending.data.id,
        activeType,
        editorBody,
        "approved"
      );

      setMetaLoading(false);
      if (resApproved.success && resApproved.data) {
        setTemplates((prev) => {
          const filtered = prev.filter((t) => t.type !== activeType);
          return [...filtered, resApproved.data];
        });
        alert("WhatsApp Template has been APPROVED by Meta!");
      }
    }, 1500);
  };

  const statusLabels = {
    local: { label: "Local Draft", color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
    pending: { label: "Pending Meta Review", color: "text-yellow-600 bg-yellow-500/10 border-yellow-500/20" },
    approved: { label: "Approved (Active)", color: "text-green-600 bg-green-500/10 border-green-500/20" },
    rejected: { label: "Rejected", color: "text-red-500 bg-red-500/10 border-red-500/20" },
  };

  const activeStatus = statusLabels[activeTemplate.approval_status] || statusLabels.local;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Sidebar - Template Types List */}
      <div className="lg:col-span-4 bg-card/65 backdrop-blur-md border border-border rounded-2xl p-4 shadow-sm h-fit space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-3">Triggers</h3>
        {TEMPLATE_TYPES.map((t) => {
          const isActive = t.type === activeType;
          const templateRecord = templates.find((tmp) => tmp.type === t.type);
          const hasCustom = !!templateRecord;
          const status = templateRecord?.approval_status || "local";

          return (
            <button
              key={t.type}
              onClick={() => setActiveType(t.type)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-all duration-200 cursor-pointer",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon icon={t.icon} className="h-4 w-4 shrink-0" />
                <span className="truncate">{t.label}</span>
              </div>
              {!isActive && (
                <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                  {hasCustom ? (status === "approved" ? "Active" : status) : "Default"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Workspace - Editor & Previews */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-card/75 backdrop-blur-md border border-border rounded-2xl p-6 shadow-sm space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {TEMPLATE_TYPES.find((t) => t.type === activeType)?.label} Template
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Timezone-aware client messaging content.</p>
            </div>
            
            <div className={`flex items-center gap-1.5 px-3 py-1 border rounded-lg text-xs font-semibold ${activeStatus.color}`}>
              <Icon
                icon={
                  activeTemplate.approval_status === "approved"
                    ? "mdi:check-decagram-outline"
                    : activeTemplate.approval_status === "pending"
                    ? "mdi:loading"
                    : "mdi:pencil-outline"
                }
                className={cn("h-3.5 w-3.5", activeTemplate.approval_status === "pending" && "animate-spin")}
              />
              {activeStatus.label}
            </div>
          </div>

          {/* Text Editor */}
          <div className="space-y-2">
            <label htmlFor="template_body" className="text-xs font-semibold text-foreground">Message Content</label>
            <textarea
              id="template_body"
              rows={5}
              value={editorBody}
              onChange={(e) => setEditorBody(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-sans"
            />
          </div>

          {/* Variables Sheet */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Allowed Template Tags</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
              {VARIABLES.map((v) => (
                <div
                  key={v.name}
                  onClick={() => setEditorBody((prev) => prev + " " + v.name)}
                  className="bg-muted/40 border border-border/30 rounded-lg p-2 hover:border-primary/50 transition-colors cursor-pointer"
                  title={v.desc}
                >
                  <code className="font-semibold text-primary">{v.name}</code>
                  <p className="text-muted-foreground mt-0.5 leading-tight">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Live Preview</h4>
            <div className="relative overflow-hidden bg-background/50 border border-border/60 rounded-2xl p-5 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
              <div className="absolute top-2 right-3 flex items-center gap-1 text-[10px] font-semibold text-green-500 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded">
                <Icon icon="mdi:whatsapp" className="h-3.5 w-3.5" /> WhatsApp View
              </div>
              <p className="pr-16">{livePreview}</p>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex justify-end gap-3 border-t border-border/50 pt-5">
            {activeTemplate.approval_status !== "approved" && activeTemplate.approval_status !== "pending" && (
              <Button
                variant="ghost"
                loading={metaLoading}
                onClick={handleMetaSubmit}
                className="border border-border text-foreground hover:bg-muted"
              >
                Submit for Meta Approval
              </Button>
            )}
            <Button onClick={handleSave} loading={saveLoading}>
              Save Changes
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}
