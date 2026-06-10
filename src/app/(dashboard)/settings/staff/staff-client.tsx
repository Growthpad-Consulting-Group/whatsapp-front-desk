"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import Select from "react-select";
import { createStaffAction, updateStaffAction, toggleStaffActiveAction, disconnectCalendarAction, resendStaffInviteAction, deleteStaffAction } from "@/actions/staff";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Icon } from "@iconify/react";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { SimpleModal } from "@/components/common/SimpleModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { TooltipButton } from "@/components/ui/TooltipButton";
import { getSelectStyles } from "@/utils/selectStyles";
import type { StaffMember } from "@/types";

interface StaffClientProps {
  initialStaff: StaffMember[];
  isOwner: boolean;
  currentUserId: string;
}

export function StaffClient({ initialStaff, isOwner, currentUserId }: StaffClientProps) {
  const { resolvedTheme } = useTheme();
  const [staffList, setStaffList] = useState<StaffMember[]>(initialStaff);
  const [isOpen, setIsOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const searchParams = useSearchParams();

  useEffect(() => {
    const success = searchParams?.get("success");
    const error = searchParams?.get("error");
    if (success === "calendar-connected") {
      toast.success("Google Calendar successfully connected!");
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
      toast.error(error);
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
    setName(""); setEmail(""); setPhone("");
    setRole("staff"); setActive(true); setError(null);
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
    if (staffMember?.user_id === currentUserId) return;

    const newActive = !currentActive;
    setStaffList((prev) => prev.map((s) => (s.id === id ? { ...s, active: newActive } : s)));

    const res = await toggleStaffActiveAction(id, newActive);
    if (res.success) {
      toast.success(newActive ? "Staff member activated." : "Staff member deactivated.");
    } else {
      setStaffList((prev) => prev.map((s) => (s.id === id ? { ...s, active: currentActive } : s)));
      toast.error("Failed to update status.");
    }
  };

  const handleResendInvite = async (id: string) => {
    setResendingId(id);
    const res = await resendStaffInviteAction(id);
    setResendingId(null);
    if (res.success) toast.success("Invite resent successfully.");
    else toast.error(res.error ?? "Failed to resend invite.");
  };

  const handleDeleteStaff = async () => {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete);
    setConfirmDelete(null);
    const res = await deleteStaffAction(confirmDelete);
    setDeletingId(null);
    if (res.success) {
      setStaffList((prev) => prev.filter((s) => s.id !== confirmDelete));
      toast.success("Staff member removed.");
    } else {
      toast.error(res.error ?? "Failed to remove staff member.");
    }
  };

  const handleDisconnectCalendar = async () => {
    if (!confirmDisconnect) return;
    setDisconnectingId(confirmDisconnect);
    setConfirmDisconnect(null);
    const res = await disconnectCalendarAction(confirmDisconnect);
    setDisconnectingId(null);
    if (res.success) {
      setStaffList((prev) =>
        prev.map((s) => (s.id === confirmDisconnect ? { ...s, calendar_connected: false } : s))
      );
      toast.success("Calendar disconnected.");
    } else {
      toast.error("Failed to disconnect calendar.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;
    setLoading(true);
    setError(null);

    const payload = { name, email, phone: phone || null, role, active };

    if (editingStaff) {
      const res = await updateStaffAction(editingStaff.id, payload);
      setLoading(false);
      if (res.success) {
        setStaffList((prev) =>
          prev.map((s) => (s.id === editingStaff.id ? { ...s, ...payload } : s))
        );
        toast.success("Staff member updated.");
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
        toast.success("Staff member added.");
        setIsOpen(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        icon="solar:users-group-two-rounded-bold-duotone"
        iconBgColor="bg-linear-to-br from-blue-600 to-blue-500"
        description="Manage your booking staff, roles, and connected Google Calendars"
        actions={isOwner ? [{ label: "Add Staff Member", icon: "solar:add-circle-broken", variant: "primary" as const, onClick: handleOpenCreate }] : []}
      />

      {staffList.length === 0 ? (
        <EmptyState
          icon="solar:users-group-two-rounded-broken"
          title="No staff members found"
          description="Add your first team member to get started."
        />
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
                          <Icon icon="solar:shield-broken" className="h-4 w-4" />
                        ) : (
                          <Icon icon="solar:user-broken" className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground truncate text-sm">
                          {staff.name}{isSelf && <span className="text-xs text-primary font-normal ml-1">(You)</span>}
                        </h3>
                        <span className="text-xs text-muted-foreground capitalize">{staff.role}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <TooltipButton
                        tooltip={isSelf ? "Cannot deactivate yourself" : staff.active ? "Deactivate" : "Activate"}
                        icon={staff.active ? "solar:check-circle-broken" : "solar:eye-closed-broken"}
                        variant={staff.active ? "success" : "ghost"}
                        onClick={() => handleToggleActive(staff.id, staff.active)}
                        disabled={!isOwner || isSelf}
                        className={isSelf ? "opacity-50 cursor-not-allowed" : ""}
                      />
                      {isOwner && (
                        <TooltipButton
                          tooltip="Edit staff member"
                          icon="solar:pen-2-broken"
                          variant="ghost"
                          onClick={() => handleOpenEdit(staff)}
                        />
                      )}
                      {isOwner && !isSelf && (
                        <TooltipButton
                          tooltip="Remove staff member"
                          icon="solar:trash-bin-minimalistic-broken"
                          variant="destructive"
                          onClick={() => setConfirmDelete(staff.id)}
                          className={deletingId === staff.id ? "opacity-50 pointer-events-none" : ""}
                        />
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs border-t border-border/50 pt-3 text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Email</span>
                      <span className="font-medium text-foreground truncate max-w-45">{staff.email}</span>
                    </div>
                    {staff.phone && (
                      <div className="flex justify-between">
                        <span>Phone</span>
                        <span className="font-medium text-foreground">{staff.phone}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span>Account</span>
                      {staff.user_id ? (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                          <Icon icon="solar:check-circle-broken" className="h-3.5 w-3.5" />
                          Active
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                            <Icon icon="solar:letter-broken" className="h-3.5 w-3.5" />
                            Invite pending
                          </span>
                          {isOwner && (
                            <>
                              <span className="text-muted-foreground font-light">|</span>
                              <button
                                type="button"
                                disabled={resendingId === staff.id}
                                onClick={() => handleResendInvite(staff.id)}
                                className="text-xs text-primary hover:underline font-medium focus:outline-none disabled:opacity-50"
                              >
                                {resendingId === staff.id ? "Sending…" : "Resend"}
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span>Google Calendar</span>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 font-medium ${staff.calendar_connected ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                          <Icon icon={staff.calendar_connected ? "solar:calendar-broken" : "solar:calendar-remove-broken"} className="h-3.5 w-3.5" />
                          {staff.calendar_connected ? "Connected" : "Not Connected"}
                        </span>
                        {staff.user_id === currentUserId && (
                          <>
                            <span className="text-muted-foreground font-light">|</span>
                            {staff.calendar_connected ? (
                              <button
                                type="button"
                                onClick={() => setConfirmDisconnect(staff.id)}
                                disabled={disconnectingId === staff.id}
                                className="text-xs text-destructive hover:underline font-medium focus:outline-none"
                              >
                                {disconnectingId === staff.id ? "Disconnecting…" : "Disconnect"}
                              </button>
                            ) : (
                              <a href={`/api/auth/google/redirect?staffId=${staff.id}`} className="text-xs text-primary hover:underline font-medium">
                                Connect
                              </a>
                            )}
                          </>
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

      {/* Staff form modal */}
      <SimpleModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editingStaff ? "Edit Staff Member" : "Add Staff Member"}
        subtitle="Assign roles and details for team members."
        width="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="text-sm font-medium text-foreground">Role</label>
            <Select
              inputId="staff_role"
              options={[
                { value: "staff", label: "Staff (Standard view)" },
                { value: "owner", label: "Owner (Full admin rights)" },
              ]}
              value={{ value: role, label: role === "owner" ? "Owner (Full admin rights)" : "Staff (Standard view)" }}
              onChange={(opt) => opt && setRole((opt as { value: string }).value as "owner" | "staff")}
              styles={getSelectStyles(resolvedTheme)}
              isSearchable={false}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <Icon icon="solar:info-circle-broken" className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {editingStaff ? "Save Changes" : "Add Staff"}
            </Button>
          </div>
        </form>
      </SimpleModal>

      {/* Delete staff confirm */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={handleDeleteStaff}
        variant="danger"
        title="Remove staff member?"
        description="This will permanently remove them from your team. If they have an active account it will be unlinked. This cannot be undone."
        confirmLabel="Remove"
        cancelLabel="Keep"
      />

      {/* Disconnect calendar confirm */}
      <ConfirmModal
        isOpen={!!confirmDisconnect}
        onCancel={() => setConfirmDisconnect(null)}
        onConfirm={handleDisconnectCalendar}
        variant="warning"
        title="Disconnect Google Calendar?"
        description="Bookings will no longer sync to Google Calendar until you reconnect."
        confirmLabel="Disconnect"
        cancelLabel="Keep Connected"
      />
    </div>
  );
}
