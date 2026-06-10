"use client";

import { useState } from "react";
import { releaseHandoffAction } from "@/actions/messages";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { Icon } from "@iconify/react";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";

interface HandoffSession {
  id: string;
  customer_phone: string;
  updated_at: string;
  customers?: {
    name: string;
  } | null;
}

interface MessageLogItem {
  id: string;
  direction: "inbound" | "outbound";
  content_summary: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  customer_id: string | null;
  customers?: {
    name: string;
    phone: string;
  } | null;
}

interface MessagesClientProps {
  handoffSessions: HandoffSession[];
  messageLogs: MessageLogItem[];
  timezone: string;
}

export function MessagesClient({
  handoffSessions: initialHandoffs,
  messageLogs: initialLogs,
  timezone,
}: MessagesClientProps) {
  const [handoffs, setHandoffs] = useState<HandoffSession[]>(initialHandoffs);
  const [logs, setLogs] = useState<MessageLogItem[]>(initialLogs);
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [releaseError, setReleaseError] = useState<string | null>(null);

  const handleRelease = async (phone: string, id: string) => {
    setReleasingId(id);
    setReleaseError(null);
    const res = await releaseHandoffAction(phone);
    setReleasingId(null);

    if (res.success) {
      setHandoffs((prev) => prev.filter((h) => h.id !== id));
    } else {
      setReleaseError(res.error ?? "Failed to release session.");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <Icon icon="solar:check-broken" className="h-3 w-3 text-muted-foreground" />;
      case "delivered":
        return <Icon icon="solar:double-alt-check-broken" className="h-3 w-3 text-muted-foreground" />;
      case "read":
        return <Icon icon="solar:double-alt-check-broken" className="h-3 w-3 text-primary" />;
      case "failed":
        return <Icon icon="solar:danger-triangle-broken" className="h-3 w-3 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        icon="solar:chat-round-dots-bold-duotone"
        iconBgColor="bg-linear-to-br from-blue-600 to-blue-500"
        description="Handoff queue and live inbox feed"
      />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Human Handoff Queue (Left column) */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Icon icon="solar:refresh-broken" className="h-4 w-4 text-primary animate-pulse" />
            Handoff Queue
          </h2>
          <p className="text-xs text-muted-foreground">
            Conversations flagged for manual agent intervention.
          </p>
        </div>

        {releaseError && (
          <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">
            <Icon icon="solar:danger-circle-broken" className="h-4 w-4 shrink-0" />
            {releaseError}
          </div>
        )}

        {handoffs.length === 0 ? (
          <div className="text-center py-8 bg-muted/30 border border-border/80 border-dashed rounded-xl">
            <Icon icon="solar:robot-broken" className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs font-medium text-foreground">All clear</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              The automated booking bot is handling all conversations.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {handoffs.map((session) => (
              <div
                key={session.id}
                className="p-3 border border-border bg-muted/20 rounded-xl space-y-3 flex flex-col justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {session.customers?.name || "Client"}
                  </p>
                  <p className="text-xs text-muted-foreground">{session.customer_phone}</p>
                  <span className="inline-block text-[10px] bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400 rounded-md px-1.5 py-0.5 mt-2">
                    Waiting for agent
                  </span>
                </div>

                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full flex items-center justify-center gap-1.5 text-xs h-8"
                  loading={releasingId === session.id}
                  onClick={() => handleRelease(session.customer_phone, session.id)}
                >
                  <Icon icon="solar:user-check-broken" className="h-3.5 w-3.5" /> Return to Bot
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message Activity Log (Right column) */}
      <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4 flex flex-col min-h-125">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Icon icon="solar:chat-square-broken" className="h-4 w-4 text-muted-foreground" />
            Live Message Feed
          </h2>
          <p className="text-xs text-muted-foreground">
            History of incoming bookings and outgoing notifications.
          </p>
        </div>

        {logs.length === 0 ? (
          <EmptyState
            icon="solar:chat-broken"
            title="No message logs"
            description="Messages will populate here as clients interact with WhatsApp."
          />
        ) : (
          <div className="space-y-4 flex-1 overflow-y-auto max-h-150 pr-2">
            {logs.map((log) => {
              const isInbound = log.direction === "inbound";
              const clientName = log.customers?.name || log.customers?.phone || "Client";

              return (
                <div
                  key={log.id}
                  className={`flex ${isInbound ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm space-y-1 ${
                      isInbound
                        ? "bg-muted text-foreground rounded-tl-none border border-border"
                        : "bg-primary text-primary-foreground rounded-tr-none"
                    }`}
                  >
                    <div className="flex justify-between items-center gap-4">
                      <span className={`text-[10px] font-bold ${isInbound ? "text-primary" : "text-primary-foreground/75"}`}>
                        {isInbound ? clientName : "Booking Assistant"}
                      </span>
                      <span className={`text-[9px] ${isInbound ? "text-muted-foreground" : "text-primary-foreground/60"}`}>
                        {formatDateTime(log.timestamp, timezone)}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {log.content_summary}
                    </p>
                    {!isInbound && (
                      <div className="flex justify-end pt-0.5">
                        {getStatusIcon(log.status)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
