"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AnimatedMetricCard } from "@/components/ui/AnimatedMetricCard";
import { cancelBookingAction, rescheduleBookingAction, markNoShowAction } from "@/actions/bookings";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import StatusPill from "@/components/ui/StatusPill";
import { Tabs } from "@/components/ui/Tabs";
import { SimpleModal } from "@/components/common/SimpleModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { WeekCalendar } from "@/components/ui/WeekCalendar";
import { Icon } from "@iconify/react";
import { DatePicker } from "@/components/ui/DatePicker";
import toast from "react-hot-toast";
import type { Business } from "@/types";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "confirmed", label: "Confirmed" },
  { key: "pending", label: "Pending" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

interface BookingsClientProps {
  initialBookings: any[];
  staffMembers: any[];
  services: any[];
  business: Business;
}

export function BookingsClient({ initialBookings, staffMembers, services, business }: BookingsClientProps) {
  const [bookings, setBookings] = useState<any[]>(initialBookings);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStaff, setSelectedStaff] = useState("all");
  const [selectedService, setSelectedService] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");

  // View mode
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1)); // Monday
    return d;
  });

  // Reschedule modal
  const [reschedulingBooking, setReschedulingBooking] = useState<any | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newStaffId, setNewStaffId] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Cancel confirm
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // No-show
  const [noShowId, setNoShowId] = useState<string | null>(null);
  const [noShowLoading, setNoShowLoading] = useState(false);

  const formatDateTimeLocal = (dateStr: string) =>
    new Intl.DateTimeFormat("en-GB", {
      timeZone: business.timezone,
      weekday: "short", day: "numeric", month: "short",
      hour: "2-digit", minute: "2-digit",
    }).format(new Date(dateStr));

  const handleCancelBooking = async () => {
    if (!cancellingId) return;
    setCancelLoading(true);
    setBookings((prev) => prev.map((b) => (b.id === cancellingId ? { ...b, status: "cancelled" } : b)));
    const res = await cancelBookingAction(cancellingId);
    setCancelLoading(false);
    if (res.success) {
      toast.success("Booking cancelled.");
    } else {
      setBookings(initialBookings);
      toast.error("Failed to cancel booking.");
    }
    setCancellingId(null);
  };

  const openRescheduleModal = (booking: any) => {
    const startObj = new Date(booking.start_at);
    setReschedulingBooking(booking);
    setNewDate(startObj.toLocaleDateString("en-CA", { timeZone: business.timezone }));
    setNewTime(startObj.toLocaleTimeString("en-GB", { timeZone: business.timezone, hour: "2-digit", minute: "2-digit" }));
    setNewStaffId(booking.staff_id || "");
    setModalError(null);
  };

  const handleNoShow = async () => {
    if (!noShowId) return;
    setNoShowLoading(true);
    const res = await markNoShowAction(noShowId);
    setNoShowLoading(false);
    if (res.success) {
      setBookings((prev) => prev.map((b) => b.id === noShowId ? { ...b, status: "no_show" } : b));
      toast.success("Marked as no-show.");
    } else {
      toast.error("Failed to mark no-show.");
    }
    setNoShowId(null);
  };

  const handleRescheduleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!reschedulingBooking) return;
    setModalLoading(true);
    setModalError(null);

    const startDateTimeStr = `${newDate}T${newTime}:00`;
    const res = await rescheduleBookingAction(reschedulingBooking.id, startDateTimeStr, newStaffId || null);
    setModalLoading(false);

    if (res.success) {
      setBookings((prev) =>
        prev.map((b) => {
          if (b.id !== reschedulingBooking.id) return b;
          const startAtUtc = new Date(startDateTimeStr).toISOString();
          const endAtUtc = new Date(new Date(startDateTimeStr).getTime() + (b.services?.duration_minutes || 30) * 60000).toISOString();
          return { ...b, start_at: startAtUtc, end_at: endAtUtc, staff_id: newStaffId || null, status: "confirmed", staff_members: staffMembers.find((s) => s.id === newStaffId) || null };
        })
      );
      setReschedulingBooking(null);
      toast.success("Booking rescheduled.");
    } else {
      setModalError(res.error);
      toast.error(res.error ?? "Failed to reschedule.");
    }
  };

  const filteredBookings = useMemo(() => bookings.filter((b) => {
    const customer = b.customers || {};
    const matchesSearch = !searchTerm ||
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm);
    const matchesStaff = selectedStaff === "all" || b.staff_id === selectedStaff;
    const matchesService = selectedService === "all" || b.service_id === selectedService;
    const matchesStatus = selectedStatus === "all" || b.status === selectedStatus;
    let matchesDate = true;
    if (selectedDate) {
      matchesDate = new Date(b.start_at).toLocaleDateString("en-CA", { timeZone: business.timezone }) === selectedDate;
    }
    return matchesSearch && matchesStaff && matchesService && matchesStatus && matchesDate;
  }), [bookings, searchTerm, selectedStaff, selectedService, selectedStatus, selectedDate, business.timezone]);

  const stats = useMemo(() => ({
    activeCount: bookings.filter((b) => b.status === "confirmed" || b.status === "pending").length,
    cancelledCount: bookings.filter((b) => b.status === "cancelled").length,
    completedCount: bookings.filter((b) => b.status === "completed").length,
  }), [bookings]);

  const statusTabs = STATUS_TABS.map((t) => ({
    ...t,
    badge: t.key !== "all" ? bookings.filter((b) => b.status === t.key).length : undefined,
  }));

  const clearFilters = () => {
    setSearchTerm(""); setSelectedStaff("all"); setSelectedService("all");
    setSelectedStatus("all"); setSelectedDate("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings"
        icon="solar:calendar-date-bold-duotone"
        iconBgColor="bg-linear-to-br from-blue-600 to-blue-500"
        description="Manage and reschedule appointments"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AnimatedMetricCard title="Active Bookings" value={stats.activeCount} icon="solar:calendar-broken" color="green" variant="card" />
        <AnimatedMetricCard title="Completed" value={stats.completedCount} icon="solar:clock-circle-broken" color="blue" variant="card" />
        <AnimatedMetricCard title="Cancelled" value={stats.cancelledCount} icon="solar:danger-circle-broken" color="red" variant="card" />
      </div>

      {/* Filters */}
      <div className="bg-card/75 backdrop-blur-md border border-border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          <div className="relative flex-1">
            <Icon icon="solar:magnifer-broken" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by customer name or phone…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full pl-9 pr-4 rounded-xl border border-border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <select value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)} className="h-10 px-3 rounded-xl border border-border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="all">All Staff</option>
              {staffMembers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)} className="h-10 px-3 rounded-xl border border-border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="all">All Services</option>
              {services.map((srv) => <option key={srv.id} value={srv.id}>{srv.name}</option>)}
            </select>
            <DatePicker value={selectedDate} onChange={setSelectedDate} placeholder="Filter by date" clearable />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4">
          <div className="flex items-center gap-3">
            <Tabs tabs={statusTabs} activeTab={selectedStatus} onChange={setSelectedStatus} />
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setSelectedDate(new Date().toLocaleDateString("en-CA", { timeZone: business.timezone }))}>Today</Button>
              <Button variant="secondary" size="sm" onClick={() => setSelectedDate(new Date(Date.now() + 86400000).toLocaleDateString("en-CA", { timeZone: business.timezone }))}>Tomorrow</Button>
              {(searchTerm || selectedStaff !== "all" || selectedService !== "all" || selectedStatus !== "all" || selectedDate) && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="flex items-center gap-1 border border-border">
                  <Icon icon="solar:close-broken" className="h-3.5 w-3.5" /> Clear
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Showing {filteredBookings.length} of {bookings.length}</span>
            <div className="flex rounded-xl overflow-hidden border border-border">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn("px-2.5 py-1.5 text-xs flex items-center gap-1 transition-colors", viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted")}
              >
                <Icon icon="solar:list-broken" className="h-3.5 w-3.5" /> List
              </button>
              <button
                type="button"
                onClick={() => setViewMode("calendar")}
                className={cn("px-2.5 py-1.5 text-xs flex items-center gap-1 transition-colors border-l border-border", viewMode === "calendar" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted")}
              >
                <Icon icon="solar:calendar-broken" className="h-3.5 w-3.5" /> Week
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar view */}
      {viewMode === "calendar" && (
        <WeekCalendar
          appointments={bookings}
          weekStart={weekStart}
          timezone={business.timezone}
          onPrevWeek={() => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); }}
          onNextWeek={() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); }}
          onAppointmentClick={(appt) => openRescheduleModal(appt)}
        />
      )}

      {/* Bookings grid */}
      {viewMode === "list" && filteredBookings.length === 0 ? (
        <EmptyState icon="solar:calendar-add-broken" title="No bookings found" description="Try adjusting your search or filters." />
      ) : viewMode === "list" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredBookings.map((appt) => {
            const customer = appt.customers || {};
            const service = appt.services || {};
            const staff = appt.staff_members || {};
            return (
              <div
                key={appt.id}
                className={cn(
                  "group relative overflow-hidden bg-card/65 backdrop-blur-md border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between",
                  appt.status === "cancelled" ? "border-border/40 opacity-70" : "border-border"
                )}
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">{service.name || "Unknown Service"}</h4>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Icon icon="solar:clock-circle-broken" className="h-3 w-3" /> {service.duration_minutes || 30} mins
                      </span>
                    </div>
                    <StatusPill status={appt.status} context="appointment" variant="default" />
                  </div>

                  <div className="bg-background/40 border border-border/30 rounded-xl p-3 space-y-2">
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Icon icon="solar:user-broken" className="h-3.5 w-3.5 text-muted-foreground" /> {customer.name || "Client"}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Icon icon="solar:smartphone-broken" className="h-3.5 w-3.5 text-muted-foreground" /> {customer.phone || "No phone"}
                    </p>
                  </div>

                  <div className="space-y-2 text-xs border-t border-border/50 pt-3 text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Schedule</span>
                      <span className="font-medium text-foreground">{formatDateTimeLocal(appt.start_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Staff Assigned</span>
                      <span className="font-medium text-foreground">{staff.name || "Unassigned"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Payment Status</span>
                      <StatusPill status={appt.payment_status} context="payment" variant="default" size="xs" />
                    </div>
                  </div>
                </div>

                {appt.status !== "cancelled" && appt.status !== "completed" && appt.status !== "no_show" && (
                  <div className="flex gap-2 border-t border-border/50 pt-4 mt-4">
                    <Button type="button" variant="secondary" size="sm" onClick={() => openRescheduleModal(appt)} className="flex-1 text-xs">
                      Reschedule
                    </Button>
                    {(appt.status === "confirmed" || appt.status === "pending") && (
                      <Button
                        type="button" variant="ghost" size="sm"
                        onClick={() => setNoShowId(appt.id)}
                        className="text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 border border-amber-400/40 text-xs px-2"
                        title="Mark as no-show"
                      >
                        <Icon icon="solar:user-cross-broken" className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      type="button" variant="ghost" size="sm"
                      onClick={() => setCancellingId(appt.id)}
                      className="text-destructive hover:bg-destructive/10 border border-destructive/20 text-xs px-2"
                    >
                      <Icon icon="solar:close-circle-broken" className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reschedule modal */}
      <SimpleModal
        isOpen={!!reschedulingBooking}
        onClose={() => setReschedulingBooking(null)}
        title="Reschedule Booking"
        subtitle="Select a new slot and team member for this appointment."
        width="max-w-md"
      >
        <form onSubmit={handleRescheduleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground">New Date</label>
              <DatePicker value={newDate} onChange={setNewDate} placeholder="Pick new date" clearable={false} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="new_time" className="text-xs font-medium text-foreground">New Time</label>
              <input id="new_time" type="time" required value={newTime} onChange={(e) => setNewTime(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="new_staff" className="text-xs font-medium text-foreground">Reassign Staff</label>
            <select id="new_staff" value={newStaffId} onChange={(e) => setNewStaffId(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">Unassigned</option>
              {staffMembers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {modalError && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">
              <Icon icon="solar:danger-circle-broken" className="h-4 w-4 shrink-0" /><span>{modalError}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setReschedulingBooking(null)} disabled={modalLoading}>Cancel</Button>
            <Button type="submit" loading={modalLoading}>Confirm Reschedule</Button>
          </div>
        </form>
      </SimpleModal>

      {/* No-show confirm */}
      <ConfirmModal
        isOpen={!!noShowId}
        onCancel={() => setNoShowId(null)}
        onConfirm={handleNoShow}
        loading={noShowLoading}
        variant="warning"
        title="Mark as no-show?"
        description="This will update the booking status to no-show. The slot will be freed and no invoice will be auto-generated."
        confirmLabel="Yes, Mark No-Show"
        cancelLabel="Cancel"
      />

      {/* Cancel confirm */}
      <ConfirmModal
        isOpen={!!cancellingId}
        onCancel={() => setCancellingId(null)}
        onConfirm={handleCancelBooking}
        loading={cancelLoading}
        variant="danger"
        title="Cancel this booking?"
        description="The customer will be notified and the Google Calendar event will be updated if synced."
        confirmLabel="Yes, Cancel Booking"
        cancelLabel="Keep Booking"
      />
    </div>
  );
}
