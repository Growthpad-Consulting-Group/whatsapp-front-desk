"use client";

import { useState, useMemo } from "react";
import { formatCurrency, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cancelBookingAction, rescheduleBookingAction } from "@/actions/bookings";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  AlertCircle,
  CalendarDays,
  Smartphone,
  CreditCard,
  RefreshCw,
  Slash
} from "lucide-react";
import type { Business } from "@/types";

interface BookingsClientProps {
  initialBookings: any[];
  staffMembers: any[];
  services: any[];
  business: Business;
}

export function BookingsClient({
  initialBookings,
  staffMembers,
  services,
  business,
}: BookingsClientProps) {
  const [bookings, setBookings] = useState<any[]>(initialBookings);
  
  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStaff, setSelectedStaff] = useState("all");
  const [selectedService, setSelectedService] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Reschedule Modal State
  const [reschedulingBooking, setReschedulingBooking] = useState<any | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newStaffId, setNewStaffId] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Status mapping
  const statusVariants: Record<string, "default" | "success" | "warning" | "destructive" | "outline"> = {
    pending: "warning",
    confirmed: "success",
    cancelled: "destructive",
    completed: "outline",
    no_show: "destructive",
  };

  // Payment Status mapping
  const paymentStatusVariants: Record<string, string> = {
    unpaid: "text-muted-foreground bg-muted/30 border-border/50",
    deposit_pending: "text-yellow-600 bg-yellow-500/10 border-yellow-500/20 dark:text-yellow-400",
    deposit_paid: "text-green-600 bg-green-500/10 border-green-500/20 dark:text-green-400",
    paid: "text-green-600 bg-green-500/10 border-green-500/20 dark:text-green-400",
    partially_paid: "text-blue-600 bg-blue-500/10 border-blue-500/20 dark:text-blue-400",
    refunded: "text-purple-600 bg-purple-500/10 border-purple-500/20 dark:text-purple-400",
  };

  // Format date nicely
  const formatDateTimeLocal = (dateStr: string) => {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: business.timezone,
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr));
  };

  // Handle cancellation
  const handleCancelBooking = async (apptId: string) => {
    if (!confirm("Are you sure you want to cancel this booking? This will also update the Google Calendar event if synced.")) return;

    // Optimistic UI update
    setBookings((prev) =>
      prev.map((b) => (b.id === apptId ? { ...b, status: "cancelled" } : b))
    );

    const res = await cancelBookingAction(apptId);
    if (!res.success) {
      alert(res.error);
      // Revert status on failure
      setBookings(initialBookings);
    }
  };

  // Open Reschedule Modal
  const openRescheduleModal = (booking: any) => {
    const startObj = new Date(booking.start_at);
    // Format to local timezone YYYY-MM-DD
    const localDate = startObj.toLocaleDateString("en-CA", { timeZone: business.timezone }); // YYYY-MM-DD
    const localTime = startObj.toLocaleTimeString("en-GB", { timeZone: business.timezone, hour: "2-digit", minute: "2-digit" });

    setReschedulingBooking(booking);
    setNewDate(localDate);
    setNewTime(localTime);
    setNewStaffId(booking.staff_id || "");
    setModalError(null);
  };

  // Submit Reschedule
  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedulingBooking) return;

    setModalLoading(true);
    setModalError(null);

    const startDateTimeStr = `${newDate}T${newTime}:00`;
    // Pass as local datetime or UTC depending on server action parsing (rescheduleBookingAction parses it as local startAt)
    const res = await rescheduleBookingAction(reschedulingBooking.id, startDateTimeStr, newStaffId || null);

    setModalLoading(false);
    if (res.success) {
      // Reload bookings list (we can also update locally or trigger reload)
      // For simplicity, update local list state optimistically and close
      setBookings((prev) =>
        prev.map((b) => {
          if (b.id === reschedulingBooking.id) {
            const startAtUtc = new Date(startDateTimeStr).toISOString();
            const endAtUtc = new Date(new Date(startDateTimeStr).getTime() + (b.services?.duration_minutes || 30) * 60 * 1000).toISOString();
            return {
              ...b,
              start_at: startAtUtc,
              end_at: endAtUtc,
              staff_id: newStaffId || null,
              status: "confirmed",
              staff_members: staffMembers.find((s) => s.id === newStaffId) || null,
            };
          }
          return b;
        })
      );
      setReschedulingBooking(null);
    } else {
      setModalError(res.error);
    }
  };

  // Filter logic
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const customer = b.customers || {};
      const service = b.services || {};
      const matchesSearch =
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm);
      
      const matchesStaff = selectedStaff === "all" || b.staff_id === selectedStaff;
      const matchesService = selectedService === "all" || b.service_id === selectedService;
      const matchesStatus = selectedStatus === "all" || b.status === selectedStatus;

      let matchesDate = true;
      if (selectedDate) {
        const localDay = new Date(b.start_at).toLocaleDateString("en-CA", { timeZone: business.timezone });
        matchesDate = localDay === selectedDate;
      }

      return matchesSearch && matchesStaff && matchesService && matchesStatus && matchesDate;
    });
  }, [bookings, searchTerm, selectedStaff, selectedService, selectedStatus, selectedDate, business.timezone]);

  // Statistics
  const stats = useMemo(() => {
    const active = bookings.filter((b) => b.status === "confirmed" || b.status === "pending");
    const cancelled = bookings.filter((b) => b.status === "cancelled");
    const completed = bookings.filter((b) => b.status === "completed");

    return {
      activeCount: active.length,
      cancelledCount: cancelled.length,
      completedCount: completed.length,
    };
  }, [bookings]);

  // Quick Date Filters
  const setTodayFilter = () => {
    const localToday = new Date().toLocaleDateString("en-CA", { timeZone: business.timezone });
    setSelectedDate(localToday);
  };

  const setTomorrowFilter = () => {
    const localTomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString("en-CA", { timeZone: business.timezone });
    setSelectedDate(localTomorrow);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStaff("all");
    setSelectedService("all");
    setSelectedStatus("all");
    setSelectedDate("");
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards (Glassmorphic Layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="relative overflow-hidden bg-card/65 backdrop-blur-md border border-border/50 rounded-2xl p-5 shadow-sm transition-all duration-200 hover:shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Bookings</p>
              <h3 className="text-3xl font-bold text-foreground mt-2">{stats.activeCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
              <CalendarIcon className="h-5 w-5" />
            </div>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-2xl -z-10" />
        </div>

        <div className="relative overflow-hidden bg-card/65 backdrop-blur-md border border-border/50 rounded-2xl p-5 shadow-sm transition-all duration-200 hover:shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Completed Bookings</p>
              <h3 className="text-3xl font-bold text-foreground mt-2">{stats.completedCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -z-10" />
        </div>

        <div className="relative overflow-hidden bg-card/65 backdrop-blur-md border border-border/50 rounded-2xl p-5 shadow-sm transition-all duration-200 hover:shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cancelled Bookings</p>
              <h3 className="text-3xl font-bold text-foreground mt-2">{stats.cancelledCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl -z-10" />
        </div>
      </div>

      {/* Filters Panel (Premium Control Bar) */}
      <div className="bg-card/75 backdrop-blur-md border border-border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by customer name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full pl-9 pr-4 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Staff Filter */}
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="h-10 px-3 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Staff</option>
              {staffMembers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Service Filter */}
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="h-10 px-3 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Services</option>
              {services.map((srv) => (
                <option key={srv.id} value={srv.id}>
                  {srv.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-10 px-3 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Date Input */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-10 px-3 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4">
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={setTodayFilter}>
              Today
            </Button>
            <Button variant="secondary" size="sm" onClick={setTomorrowFilter}>
              Tomorrow
            </Button>
            {(searchTerm || selectedStaff !== "all" || selectedService !== "all" || selectedStatus !== "all" || selectedDate) && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="flex items-center gap-1 border border-border">
                <X className="h-3.5 w-3.5" /> Clear Filters
              </Button>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            Showing {filteredBookings.length} of {bookings.length} bookings
          </span>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border border-dashed rounded-3xl">
            <CalendarDays className="h-12 w-12 text-muted-foreground/60 mx-auto mb-4" />
            <h4 className="font-semibold text-foreground">No bookings found</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your search query or filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredBookings.map((appt) => {
              const customer = appt.customers || {};
              const service = appt.services || {};
              const staff = appt.staff_members || {};

              return (
                <div
                  key={appt.id}
                  className={cn(
                    "group relative overflow-hidden bg-card/65 backdrop-blur-md border rounded-2xl p-5 shadow-sm transition-all duration-200 hover:shadow-md flex flex-col justify-between",
                    appt.status === "cancelled" ? "border-border/40 opacity-70" : "border-border"
                  )}
                >
                  <div className="space-y-4">
                    {/* Header: Service Name & Status Badge */}
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
                          {service.name || "Unknown Service"}
                        </h4>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" /> {service.duration_minutes || 30} mins
                        </span>
                      </div>
                      <Badge variant={statusVariants[appt.status] || "default"}>
                        {appt.status}
                      </Badge>
                    </div>

                    {/* Customer Info */}
                    <div className="bg-background/40 border border-border/30 rounded-xl p-3 space-y-2">
                      <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground" /> {customer.name || "Client"}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Smartphone className="h-3.5 w-3.5 text-muted-foreground" /> {customer.phone || "No phone"}
                      </p>
                    </div>

                    {/* Date/Time & Staff Member */}
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
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border",
                            paymentStatusVariants[appt.payment_status] || "text-foreground bg-muted border-border"
                          )}
                        >
                          {appt.payment_status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Google Sync</span>
                        <span className="font-medium text-foreground">
                          {appt.google_event_id ? "Synced" : staff.calendar_connected ? "Syncing..." : "Not Connected"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions (Only show if not cancelled) */}
                  {appt.status !== "cancelled" && appt.status !== "completed" && (
                    <div className="flex gap-3 border-t border-border/50 pt-4 mt-4">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => openRescheduleModal(appt)}
                        className="flex-1 text-xs"
                      >
                        Reschedule
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelBooking(appt.id)}
                        className="text-destructive hover:bg-destructive/10 border border-destructive/20 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {reschedulingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-background/60 backdrop-blur-sm transition-opacity"
            onClick={() => setReschedulingBooking(null)}
          />

          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto z-10 relative">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">
                Reschedule Booking
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Select a new slot and team member for this appointment.
              </p>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="new_date" className="text-xs font-medium text-foreground">
                    New Date
                  </label>
                  <input
                    id="new_date"
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="new_time" className="text-xs font-medium text-foreground">
                    New Time
                  </label>
                  <input
                    id="new_time"
                    type="time"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="new_staff" className="text-xs font-medium text-foreground">
                  Reassign Staff
                </label>
                <select
                  id="new_staff"
                  value={newStaffId}
                  onChange={(e) => setNewStaffId(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Unassigned</option>
                  {staffMembers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {modalError && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-border pt-4 mt-6">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setReschedulingBooking(null)}
                  disabled={modalLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={modalLoading}>
                  Confirm Reschedule
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
