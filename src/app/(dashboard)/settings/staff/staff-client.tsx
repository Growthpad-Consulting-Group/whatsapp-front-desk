"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createStaffAction, updateStaffAction, toggleStaffActiveAction, disconnectCalendarAction } from "@/actions/staff";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit2, Users2, CheckCircle2, AlertCircle, EyeOff, Calendar, CalendarOff, Shield, User } from "lucide-react";
import type { StaffMember } from "@/types";

interface StaffClientProps {
  initialStaff: StaffMember[];
  isOwner: boolean;
  currentUserId: string; // so owners don't deactivate themselves
}

export function StaffClient({
  initialStaff,
  isOwner,
  currentUserId,
}: StaffClientProps) {
  const [staffList, setStaffList] = useState<StaffMember[]>(initialStaff);
  const [isOpen, setIsOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const searchParams = useSearchParams();

  useEffect(() => {
    const success = searchParams?.get("success");
    const error = searchParams?.get("error");
    if (success === "calendar-connected") {
      alert("Google Calendar successfully connected!");
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
      alert(error);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams]);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"owner" | "staff">("staff");
  const [active, setActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setRole("staff");
    setActive(true);
    setError(null);
  };

  const handleOpenCreate = () => {
    setEditingStaff(null);
    resetForm();
    setIsOpen(true);
  };

  const handleOpenEdit = (staff: StaffMember) => {
    setEditingStaff(staff);
    setName(staff.name);
    setEmail(staff.email);
    setPhone(staff.phone || "");
    setRole(staff.role === "owner" ? "owner" : "staff");
    setActive(staff.active);
    setError(null);
    setIsOpen(true);
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    if (!isOwner) return;

    const staffMember = staffList.find((s) => s.id === id);
    if (staffMember?.user_id === currentUserId) {
      alert("You cannot deactivate your own account.");
      return;
    }

    const newActive = !currentActive;

    // Optimistic UI update
    setStaffList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: newActive } : s))
    );

    const res = await toggleStaffActiveAction(id, newActive);
    if (!res.success) {
      // Revert if error
      setStaffList((prev) =>
        prev.map((s) => (s.id === id ? { ...s, active: currentActive } : s))
      );
      alert(res.error);
    }
  };

  const handleDisconnectCalendar = async (staffId: string) => {
    if (!confirm("Are you sure you want to disconnect your Google Calendar?")) return;
    setDisconnectingId(staffId);
    const res = await disconnectCalendarAction(staffId);
    setDisconnectingId(null);
    if (res.success) {
      setStaffList((prev) =>
        prev.map((s) => (s.id === staffId ? { ...s, calendar_connected: false } : s))
      );
    } else {
      alert(res.error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;
    setLoading(true);
    setError(null);

    const payload = {
      name,
      email,
      phone: phone || null,
      role,
      active,
    };

    if (editingStaff) {
      const res = await updateStaffAction(editingStaff.id, payload);
      setLoading(false);
      if (res.success) {
        setStaffList((prev) =>
          prev.map((s) =>
            s.id === editingStaff.id
              ? {
                  ...s,
                  ...payload,
                }
              : s
          )
        );
        setIsOpen(false);
      } else {
        setError(res.error);
      }
    } else {
      const res = await createStaffAction(payload);
      setLoading(false);
      if (!res.success) {
        setError(res.error);
      } else {
        const newStaff: StaffMember = {
          id: res.data,
          business_id: staffList[0]?.business_id || "",
          user_id: null,
          calendar_connected: false,
          created_at: new Date().toISOString(),
          ...payload,
        };
        setStaffList((prev) => [...prev, newStaff]);
        setIsOpen(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Staff Members</h2>
          <p className="text-sm text-muted-foreground">
            Manage your booking staff, roles, and connected Google Calendars.
          </p>
        </div>
        {isOwner && (
          <Button onClick={handleOpenCreate} size="sm" className="flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> Add Staff Member
          </Button>
        )}
      </div>

      {staffList.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border border-dashed rounded-2xl">
          <Users2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-foreground font-medium">No staff members found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staffList.map((staff) => {
            const isSelf = staff.user_id === currentUserId;

            return (
              <div
                key={staff.id}
                className={`group bg-card border rounded-2xl p-5 shadow-sm transition-all duration-200 hover:shadow-md flex flex-col justify-between ${
                  !staff.active ? "opacity-75 border-border/50 bg-muted/40" : "border-border"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        {staff.role === "owner" ? (
                          <Shield className="h-4 w-4" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground truncate text-sm">
                          {staff.name} {isSelf && <span className="text-xs text-primary font-normal">(You)</span>}
                        </h3>
                        <span className="inline-flex items-center text-xs text-muted-foreground capitalize">
                          {staff.role}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleToggleActive(staff.id, staff.active)}
                        disabled={!isOwner || isSelf}
                        title={isSelf ? "Cannot deactivate yourself" : staff.active ? "Deactivate" : "Activate"}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          isSelf
                            ? "opacity-50 cursor-not-allowed bg-muted border-border text-muted-foreground"
                            : staff.active
                            ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-950/20 dark:border-green-900 dark:text-green-400"
                            : "bg-muted border-border text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {staff.active ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5" />
                        )}
                      </button>
                      {isOwner && (
                        <button
                          onClick={() => handleOpenEdit(staff)}
                          className="p-1.5 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs border-t border-border/50 pt-3 text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Email</span>
                      <span className="font-medium text-foreground truncate max-w-[180px]">{staff.email}</span>
                    </div>
                    {staff.phone && (
                      <div className="flex justify-between">
                        <span>Phone</span>
                        <span className="font-medium text-foreground">{staff.phone}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center mt-1">
                      <span>Google Calendar</span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 font-medium ${
                            staff.calendar_connected ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                          }`}
                        >
                          {staff.calendar_connected ? (
                            <>
                              <Calendar className="h-3.5 w-3.5" /> Connected
                            </>
                          ) : (
                            <>
                              <CalendarOff className="h-3.5 w-3.5" /> Not Connected
                            </>
                          )}
                        </span>
                        {staff.user_id === currentUserId && (
                          <span className="text-muted-foreground font-light">|</span>
                        )}
                        {staff.user_id === currentUserId && (
                          staff.calendar_connected ? (
                            <button
                              type="button"
                              onClick={() => handleDisconnectCalendar(staff.id)}
                              disabled={disconnectingId === staff.id}
                              className="text-xs text-destructive hover:underline font-medium focus:outline-none"
                            >
                              {disconnectingId === staff.id ? "Disconnecting..." : "Disconnect"}
                            </button>
                          ) : (
                            <a
                              href={`/api/auth/google/redirect?staffId=${staff.id}`}
                              className="text-xs text-primary hover:underline font-medium"
                            >
                              Connect
                            </a>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-background/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Container */}
          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto z-10 relative">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">
                {editingStaff ? "Edit Staff details" : "Add Staff member"}
              </h3>
              <p className="text-xs text-muted-foreground">
                Assign roles and details for team members.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Input
                label="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Koech"
                required
              />

              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane.koech@business.com"
                required
              />

              <Input
                label="Phone number (optional)"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254712345678"
              />

              <div className="flex flex-col gap-1.5">
                <label htmlFor="staff_role" className="text-sm font-medium text-foreground">
                  Role
                </label>
                <select
                  id="staff_role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as "owner" | "staff")}
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="staff">Staff (Standard view)</option>
                  <option value="owner">Owner (Full admin rights)</option>
                </select>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-border pt-4 mt-6">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={loading}>
                  {editingStaff ? "Save Changes" : "Add Staff"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
