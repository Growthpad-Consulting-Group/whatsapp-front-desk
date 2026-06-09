"use client";

import { useMemo } from "react";
import Link from "next/link";
import { formatDateTime, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";

interface DashboardClientProps {
  todayAppointments: any[];
  pendingDeposits: number;
  unpaidInvoices: number;
  overdueInvoices: number;
  recentMessages: any[];
  cancelledCount: number;
  onboardingSteps: {
    hoursConfigured: boolean;
    servicesAdded: boolean;
    calendarConnected: boolean;
  };
  business: any;
}

export function DashboardClient({
  todayAppointments,
  pendingDeposits,
  unpaidInvoices,
  overdueInvoices,
  recentMessages,
  cancelledCount,
  onboardingSteps,
  business,
}: DashboardClientProps) {
  
  // Greeting message based on local time
  const greeting = useMemo(() => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good morning";
    if (hours < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  // Compute onboarding checklist percentage
  const onboardingMetrics = useMemo(() => {
    const steps = [
      onboardingSteps.hoursConfigured,
      onboardingSteps.servicesAdded,
      onboardingSteps.calendarConnected,
    ];
    const completed = steps.filter(Boolean).length;
    const pct = Math.round((completed / steps.length) * 100);
    return { completed, total: steps.length, pct, done: completed === steps.length };
  }, [onboardingSteps]);

  // Curated badges
  const getAppointmentBadge = (appt: any) => {
    if (appt.payment_status === "deposit_pending") {
      return (
        <Badge variant="warning" className="flex items-center gap-1">
          <Icon icon="mdi:cash-clock" className="h-3 w-3" /> Deposit due
        </Badge>
      );
    }
    if (appt.status === "confirmed") {
      return (
        <Badge variant="success" className="flex items-center gap-1">
          <Icon icon="mdi:calendar-check" className="h-3 w-3" /> Confirmed
        </Badge>
      );
    }
    if (appt.status === "pending") {
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <Icon icon="mdi:progress-clock" className="h-3 w-3" /> Pending
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* Greetings & Time */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {greeting}, manager! 👋
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Here is what is happening at *{business.name}* today.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted/30 border border-border/40 rounded-xl px-3 py-1.5 h-fit w-fit">
          <Icon icon="mdi:clock-outline" className="h-4 w-4 text-muted-foreground" />
          <span>
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
              timeZone: business.timezone,
            })}
          </span>
        </div>
      </div>

      {/* Onboarding Checklist Card (Hides if completed) */}
      {!onboardingMetrics.done && (
        <div className="relative overflow-hidden bg-primary/5 border border-primary/20 rounded-3xl p-6 shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10" />
          
          <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">🚀</span>
                <h2 className="text-md font-bold text-foreground">Get Ready for Launch</h2>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                Set up these vital business configurations to enable your state machine and WhatsApp bot engine to handle slot bookings automatically.
              </p>
              
              {/* Progress bar */}
              <div className="pt-2 max-w-md">
                <div className="flex justify-between text-xs font-semibold text-foreground mb-1.5">
                  <span>Setup Progress</span>
                  <span>{onboardingMetrics.pct}% Complete</span>
                </div>
                <div className="w-full h-2 bg-muted border border-border/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${onboardingMetrics.pct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Checklist elements */}
            <div className="w-full md:w-auto bg-card/65 border border-border/60 rounded-2xl p-4 shrink-0 space-y-2.5 min-w-[260px] text-xs">
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2 font-medium text-foreground">
                  <Icon
                    icon={onboardingSteps.hoursConfigured ? "mdi:check-circle" : "mdi:circle-outline"}
                    className={cn("h-4 w-4", onboardingSteps.hoursConfigured ? "text-green-500" : "text-muted-foreground")}
                  />
                  Set operating hours
                </span>
                {!onboardingSteps.hoursConfigured && (
                  <Link href="/settings" className="text-primary font-semibold hover:underline">
                    Configure
                  </Link>
                )}
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-border/30 pt-2.5">
                <span className="flex items-center gap-2 font-medium text-foreground">
                  <Icon
                    icon={onboardingSteps.servicesAdded ? "mdi:check-circle" : "mdi:circle-outline"}
                    className={cn("h-4 w-4", onboardingSteps.servicesAdded ? "text-green-500" : "text-muted-foreground")}
                  />
                  Add booking services
                </span>
                {!onboardingSteps.servicesAdded && (
                  <Link href="/settings/services" className="text-primary font-semibold hover:underline">
                    Create
                  </Link>
                )}
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-border/30 pt-2.5">
                <span className="flex items-center gap-2 font-medium text-foreground">
                  <Icon
                    icon={onboardingSteps.calendarConnected ? "mdi:check-circle" : "mdi:circle-outline"}
                    className={cn("h-4 w-4", onboardingSteps.calendarConnected ? "text-green-500" : "text-muted-foreground")}
                  />
                  Connect staff Google Cal
                </span>
                {!onboardingSteps.calendarConnected && (
                  <Link href="/settings/staff" className="text-primary font-semibold hover:underline">
                    Connect
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card/65 border border-border/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium mb-2">
            <Icon icon="mdi:calendar-multiselect" className="h-4 w-4" />
            <span>Today's Bookings</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{todayAppointments.length}</p>
        </div>

        <div className="bg-card/65 border border-border/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium mb-2">
            <Icon icon="mdi:cash-multiple" className="h-4 w-4" />
            <span>Pending Deposits</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{pendingDeposits}</p>
        </div>

        <div className="bg-card/65 border border-border/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium mb-2">
            <Icon icon="mdi:file-alert-outline" className="h-4 w-4" />
            <span>Unpaid Invoices</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{unpaidInvoices}</p>
        </div>

        <div className="bg-card/65 border border-border/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium mb-2">
            <Icon icon="mdi:close-circle-outline" className="h-4 w-4" />
            <span>Cancellations Today</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{cancelledCount}</p>
        </div>
      </div>

      {/* Bottom Dual Grid - Agenda & Messages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Agenda Section */}
        <section className="bg-card/75 backdrop-blur-md border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border/30 pb-3 mb-4">
              <Icon icon="mdi:format-list-bulleted" className="h-4 w-4 text-muted-foreground" />
              Today's Agenda
            </h2>
            {todayAppointments.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground space-y-2">
                <Icon icon="mdi:calendar-blank-outline" className="h-10 w-10 mx-auto text-muted-foreground/50" />
                <p className="text-xs">No appointments scheduled for today.</p>
              </div>
            ) : (
              <ul className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {todayAppointments.map((appt: any) => (
                  <li key={appt.id} className="flex items-start justify-between gap-3 bg-muted/20 border border-border/30 rounded-xl p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {appt.customers?.name ?? "Unknown Customer"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {appt.services?.name} · {formatDateTime(appt.start_at, business.timezone)}
                      </p>
                    </div>
                    {getAppointmentBadge(appt)}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {todayAppointments.length > 0 && (
            <Link
              href="/bookings"
              className="mt-4 inline-flex items-center justify-center h-9 w-full rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors"
            >
              View Booking Sheet
            </Link>
          )}
        </section>

        {/* Message Logs Section */}
        <section className="bg-card/75 backdrop-blur-md border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border/30 pb-3 mb-4">
              <Icon icon="mdi:message-text-clock-outline" className="h-4 w-4 text-muted-foreground" />
              Live Inbox Feed
            </h2>
            {recentMessages.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground space-y-2">
                <Icon icon="mdi:message-off-outline" className="h-10 w-10 mx-auto text-muted-foreground/50" />
                <p className="text-xs">No messages logged yet. Check back shortly.</p>
              </div>
            ) : (
              <ul className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {recentMessages.map((msg: any) => (
                  <li key={msg.id} className="flex items-start gap-3 bg-muted/20 border border-border/30 rounded-xl p-3">
                    <span
                      className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                        msg.direction === "inbound" ? "bg-primary" : "bg-muted-foreground/50"
                      }`}
                      aria-label={msg.direction}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {msg.customers?.name ?? msg.customers?.phone ?? "Client"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                        {msg.content_summary}
                      </p>
                      <span className="text-[10px] text-muted-foreground block mt-1">
                        {formatDateTime(msg.timestamp, business.timezone)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {recentMessages.length > 0 && (
            <Link
              href="/messages"
              className="mt-4 inline-flex items-center justify-center h-9 w-full rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors"
            >
              Open Live Message Panel
            </Link>
          )}
        </section>

      </div>
    </div>
  );
}
