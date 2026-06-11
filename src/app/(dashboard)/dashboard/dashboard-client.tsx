"use client";

import { useMemo } from "react";
import Link from "next/link";
import { formatDateTime, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";
import { AnimatedMetricCard } from "@/components/ui/AnimatedMetricCard";
import { DashboardCharts } from "@/components/ui/DashboardCharts";
import { BookingHeatmap, type HeatmapAppointment } from "@/components/ui/BookingHeatmap";



interface WeeklyBookingData { labels: string[]; confirmed: number[]; cancelled: number[]; }
interface RevenueData { labels: string[]; revenue: number[]; }

interface DashboardClientProps {
  todayAppointments: any[];
  pendingDeposits: number;
  unpaidInvoices: number;
  overdueInvoices: number;
  recentMessages: any[];
  cancelledCount: number;
  staffName: string;
  staffId: string;
  onboardingSteps: {
    hoursConfigured: boolean;
    servicesAdded: boolean;
    calendarConnected: boolean;
  };
  business: any;
  weeklyBookings?: WeeklyBookingData;
  revenueData?: RevenueData;
  heatmapAppointments?: HeatmapAppointment[];
  retentionRate?: number | null;
}

export function DashboardClient({
  todayAppointments,
  pendingDeposits,
  unpaidInvoices,
  overdueInvoices,
  recentMessages,
  cancelledCount,
  staffName,
  staffId,
  onboardingSteps,
  business,
  weeklyBookings,
  revenueData,
  heatmapAppointments = [],
  retentionRate,
}: DashboardClientProps) {

  // Helper to get initials
  const getInitials = (name?: string) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Helper to format relative time
  const formatRelativeTime = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

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
          <Icon icon="solar:wallet-money-broken" className="h-3 w-3" /> Deposit due
        </Badge>
      );
    }
    if (appt.status === "confirmed") {
      return (
        <Badge variant="success" className="flex items-center gap-1">
          <Icon icon="solar:check-circle-broken" className="h-3 w-3" /> Confirmed
        </Badge>
      );
    }
    if (appt.status === "pending") {
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <Icon icon="solar:clock-circle-broken" className="h-3 w-3" /> Pending
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
            {greeting}, {staffName.split(" ")[0]}! 👋
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Here is what is happening at <strong>{business.name}</strong> today.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted/30 border border-border/40 rounded-xl px-3 py-1.5 h-fit w-fit">
          <Icon icon="solar:clock-circle-broken" className="h-4 w-4 text-muted-foreground" />
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
                    icon={onboardingSteps.hoursConfigured ? "solar:check-circle-bold" : "solar:circle-broken"}
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
                    icon={onboardingSteps.servicesAdded ? "solar:check-circle-bold" : "solar:circle-broken"}
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
                    icon={onboardingSteps.calendarConnected ? "solar:check-circle-bold" : "solar:circle-broken"}
                    className={cn("h-4 w-4", onboardingSteps.calendarConnected ? "text-green-500" : "text-muted-foreground")}
                  />
                  Connect staff Google Cal
                </span>
                {!onboardingSteps.calendarConnected && (
                  <a href={`/api/auth/google/redirect?staffId=${staffId}`} className="text-primary font-semibold hover:underline">
                    Connect
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Cards Grid — 2×2 Operational */}
      <div className="grid grid-cols-2 gap-4">
        <AnimatedMetricCard
          title="Today's Bookings"
          value={todayAppointments.length}
          icon="solar:calendar-date-broken"
          color="green"
          variant="card"
          mode="light"
          href="/bookings"
        />
        <AnimatedMetricCard
          title="Pending Deposits"
          value={pendingDeposits}
          icon="solar:wallet-money-broken"
          color="orange"
          variant="card"
          mode="light"
          href="/bookings"
        />
        <AnimatedMetricCard
          title="Unpaid Invoices"
          value={unpaidInvoices}
          icon="solar:file-text-broken"
          color="purple"
          variant="card"
          mode="light"
          href="/invoices"
        />
        <AnimatedMetricCard
          title="Cancellations Today"
          value={cancelledCount}
          icon="solar:close-circle-broken"
          color="red"
          variant="card"
          mode="light"
          href="/bookings"
        />
      </div>

      {/* Business Health Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-blue-700 via-blue-600 to-cyan-500 p-5 shadow-md border border-blue-500/30">
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-6 left-1/3 w-24 h-24 rounded-full bg-cyan-300/10 blur-2xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Label */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/15 border border-white/20 shrink-0">
              <Icon icon="solar:pulse-2-broken" className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Business Health</p>
              <p className="text-md font-bold text-white leading-tight">Client Retention Rate</p>
              <p className="text-xs text-white/50 mt-0.5">% of last month&apos;s clients who returned</p>
            </div>
          </div>

          {/* Metric */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="text-center">
              <p className="text-4xl font-black text-white tabular-nums">
                {(retentionRate ?? null) !== null ? `${retentionRate}%` : "—"}
              </p>
              <p className="text-[10px] text-white/50 mt-0.5">this month</p>
            </div>

            {/* Health label chip */}
            {(() => {
              const rate = retentionRate ?? null;
              return (
                <div className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-bold border shrink-0",
                  rate === null
                    ? "bg-white/10 border-white/20 text-white/50"
                    : rate >= 60
                    ? "bg-green-400/20 border-green-300/30 text-green-100"
                    : rate >= 35
                    ? "bg-amber-400/20 border-amber-300/30 text-amber-100"
                    : "bg-red-400/20 border-red-300/30 text-red-100"
                )}>
                  {rate === null ? "No data yet" : rate >= 60 ? "✦ Excellent" : rate >= 35 ? "⚑ Good" : "⚠ Needs work"}
                </div>
              );
            })()}

            <Link
              href="/customers"
              className="text-[11px] font-bold text-white/70 hover:text-white hover:underline shrink-0 transition-colors"
            >
              View clients →
            </Link>
          </div>
        </div>
      </div>

      {/* Needs Attention */}
      {overdueInvoices > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/8 px-5 py-3.5 text-sm">
          <Icon icon="solar:danger-triangle-bold-duotone" className="h-5 w-5 text-amber-500 shrink-0" />
          <span className="font-medium text-foreground">
            <span className="text-amber-600 dark:text-amber-400 font-bold">{overdueInvoices} overdue {overdueInvoices === 1 ? "invoice" : "invoices"}</span> need attention.
          </span>
          <a href="/invoices?status=overdue" className="ml-auto text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline shrink-0">
            Review →
          </a>
        </div>
      )}

      {/* Charts */}
      {weeklyBookings && revenueData && (
        <DashboardCharts
          weeklyBookings={weeklyBookings}
          revenueData={revenueData}
          currency={business.currency || "KES"}
        />
      )}

      {/* Booking Heatmap */}
      <BookingHeatmap
        appointments={heatmapAppointments}
        timezone={business.timezone}
        title="Booking Patterns (Last 30 Days)"
      />

      {/* Bottom Dual Grid - Agenda & Messages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Agenda Section */}
        <section className="bg-card/75 backdrop-blur-md border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between border-b border-border/30 pb-3 mb-4 shrink-0">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Icon icon="solar:list-broken" className="h-4 w-4 text-muted-foreground" />
                Today&apos;s Agenda
              </h2>
              {todayAppointments.length > 0 && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                  {todayAppointments.length} Active
                </span>
              )}
            </div>

            {todayAppointments.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-muted-foreground space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-muted/40 flex items-center justify-center border border-border/40">
                  <Icon icon="solar:calendar-broken" className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">No appointments today</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Your schedule is currently clear.</p>
                </div>
              </div>
            ) : (
              <ul className="space-y-2.5 max-h-75 overflow-y-auto pr-1 custom-scrollbar flex-1 py-1">
                {todayAppointments.map((appt: any) => {
                  const startTime = new Date(appt.start_at).toLocaleTimeString("en-GB", {
                    timeZone: business.timezone,
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  });
                  return (
                    <li
                      key={appt.id}
                      className="group flex gap-3.5 items-center p-3 bg-muted/15 dark:bg-slate-900/40 border border-border/40 rounded-2xl hover:bg-muted/30 transition-all duration-300 animate-in fade-in duration-300"
                    >
                      {/* Left: Time indicator */}
                      <span className="text-[10px] font-extrabold text-muted-foreground w-13 shrink-0 text-right tracking-tight">
                        {startTime}
                      </span>

                      {/* Accent divider */}
                      <div className="w-[1.5px] h-6 bg-border shrink-0" />

                      {/* Right Details */}
                      <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-foreground truncate">
                            {appt.customers?.name ?? "Client"}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate mt-0.5 font-semibold">
                            {appt.services?.name || "Service"}
                            {appt.staff_members?.name && ` · ${appt.staff_members.name.split(" ")[0]}`}
                          </p>
                        </div>

                        {/* Status badge & Hover actions */}
                        <div className="flex items-center gap-2.5 shrink-0">
                          {getAppointmentBadge(appt)}

                          {/* Quick Actions (Reveal on list item hover) */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-250">
                            {appt.customers?.phone && (
                              <Link
                                href={`/messages?chat=${appt.customers.phone}`}
                                className="p-1 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-105 active:scale-95"
                                title="Chat with Client"
                              >
                                <Icon icon="solar:chat-square-broken" className="h-3 w-3" />
                              </Link>
                            )}
                            <Link
                              href={`/bookings?search=${encodeURIComponent(appt.customers?.name || "")}`}
                              className="p-1 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-105 active:scale-95"
                              title="Manage Booking"
                            >
                              <Icon icon="solar:calendar-broken" className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {todayAppointments.length > 0 && (
            <Link
              href="/bookings"
              className="mt-4 inline-flex items-center justify-center h-10 w-full rounded-xl border border-border bg-background hover:bg-muted text-xs font-bold text-foreground transition-all duration-200 active:scale-99 shadow-xs"
            >
              View Booking Sheet
            </Link>
          )}
        </section>

        {/* Message Logs Section */}
        <section className="bg-card/75 backdrop-blur-md border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between border-b border-border/30 pb-3 mb-4 shrink-0">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Icon icon="solar:chat-square-broken" className="h-4 w-4 text-muted-foreground" />
                Live Inbox Feed
              </h2>
              {recentMessages.length > 0 && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Live</span>
                </div>
              )}
            </div>

            {recentMessages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-muted-foreground space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-muted/40 flex items-center justify-center border border-border/40">
                  <Icon icon="solar:chat-square-broken" className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">No messages yet</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Incoming logs will appear here in real-time.</p>
                </div>
              </div>
            ) : (
              <ul className="space-y-4 max-h-75 overflow-y-auto pr-1 custom-scrollbar flex-1 py-1">
                {recentMessages.map((msg: any) => {
                  const isInbound = msg.direction === "inbound";
                  return (
                    <li
                      key={msg.id}
                      className={cn(
                        "flex flex-col w-full group relative",
                        isInbound ? "items-start" : "items-end"
                      )}
                    >
                      {/* Name header */}
                      <div className={cn(
                        "flex items-center gap-2 px-1 text-[11px]",
                        isInbound ? "flex-row" : "flex-row-reverse"
                      )}>
                        <span className="font-bold text-foreground/80">
                          {isInbound ? (msg.customers?.name ?? msg.customers?.phone ?? "Client") : "Engine / Agent"}
                        </span>
                        {!isInbound && msg.customers?.name && (
                          <span className="text-muted-foreground/60 text-[10px]">
                            to {msg.customers.name.split(" ")[0]}
                          </span>
                        )}
                        <span className="text-muted-foreground/50 text-[10px]">
                          {formatRelativeTime(msg.timestamp)}
                        </span>
                      </div>

                      {/* Speech Bubble */}
                      <div className="relative mt-1.5 max-w-[85%] flex items-end gap-2">
                        <div
                          className={cn(
                            "rounded-2xl px-3.5 py-2.5 text-xs shadow-xs border leading-relaxed",
                            isInbound
                              ? "bg-primary/[0.08] dark:bg-primary/10 border-primary/20 text-foreground rounded-tl-xs"
                              : "bg-muted/50 dark:bg-slate-900/60 border-border/70 text-foreground rounded-tr-xs"
                          )}
                        >
                          <p className="break-words whitespace-pre-wrap">{msg.content_summary}</p>
                        </div>

                        {/* Quick Chat Reply Button (Only shows for inbound on hover) */}
                        {isInbound && msg.customers?.phone && (
                          <Link
                            href={`/messages?chat=${msg.customers.phone}`}
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 rounded-xl border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground hover:scale-105 active:scale-95 shrink-0 shadow-xs"
                            title="Reply to Client"
                          >
                            <Icon icon="solar:chat-square-broken" className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {recentMessages.length > 0 && (
            <Link
              href="/messages"
              className="mt-4 inline-flex items-center justify-center h-10 w-full rounded-xl border border-border bg-background hover:bg-muted text-xs font-bold text-foreground transition-all duration-200 active:scale-99 shadow-xs"
            >
              Open Live Message Panel
            </Link>
          )}
        </section>

      </div>

    </div>
  );
}
