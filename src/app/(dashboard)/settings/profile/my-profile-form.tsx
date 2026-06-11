"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { updateOwnProfileAction } from "@/actions/staff";
import type { StaffMember } from "@/types";
import { ConfirmModal } from "@/components/common/ConfirmModal";

const ROLE_LABELS: Record<string, string> = {
  owner: "Business Owner",
  manager: "Manager",
  staff: "Staff",
};

export function MyProfileForm({ staff }: { staff: StaffMember }) {
  const [name, setName]   = useState(staff.name);
  const [phone, setPhone] = useState(staff.phone ?? "");
  const [loading, setLoading] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  const handleDisconnectConfirm = () => {
    setShowDisconnectModal(false);
    window.location.href = `/api/auth/google/redirect?staffId=${staff.id}&disconnect=true`;
  };

  const handleSave = async () => {
    setLoading(true);
    const res = await updateOwnProfileAction(name, phone);
    setLoading(false);
    if (res.success) {
      toast.success("Profile updated.");
    } else {
      toast.error(res.error ?? "Failed to update profile.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Identity card */}
      <div className="bg-card/60 dark:bg-slate-900/60 backdrop-blur-md border border-border/80 rounded-2xl p-6 space-y-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-primary to-primary/70 text-white flex items-center justify-center font-extrabold text-xl shadow-md shrink-0">
            {name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-base font-extrabold text-foreground leading-tight">{staff.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{staff.email}</p>
            <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              {ROLE_LABELS[staff.role] ?? staff.role}
            </span>
          </div>
        </div>

        <div className="h-px bg-border/60" />

        <div className="space-y-4">
          <Input
            label="Display Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
          <Input
            label="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+254 7XX XXX XXX"
          />
        </div>

        <Button onClick={handleSave} loading={loading} className="rounded-xl px-5 text-xs font-bold">
          Save Changes
        </Button>
      </div>

      {/* Google Calendar */}
      <div className="bg-card/60 dark:bg-slate-900/60 backdrop-blur-md border border-border/80 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white border border-border/60 flex items-center justify-center shadow-sm shrink-0">
            <Icon icon="flat-color-icons:google" className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-foreground leading-snug">Google Calendar</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Sync your bookings to your personal Google Calendar.</p>
          </div>
        </div>

        <div className="flex items-center justify-between bg-muted/20 border border-border/60 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <Icon
              icon={staff.calendar_connected ? "solar:calendar-broken" : "solar:calendar-remove-broken"}
              className={`h-4 w-4 ${staff.calendar_connected ? "text-emerald-500" : "text-muted-foreground"}`}
            />
            <span className={`text-xs font-bold ${staff.calendar_connected ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
              {staff.calendar_connected ? "Connected" : "Not connected"}
            </span>
          </div>

          {staff.calendar_connected ? (
            <button
              type="button"
              onClick={() => setShowDisconnectModal(true)}
              className="text-xs font-bold text-destructive hover:underline cursor-pointer bg-transparent border-0"
            >
              Disconnect
            </button>
          ) : (
            <a
              href={`/api/auth/google/redirect?staffId=${staff.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
            >
              <Icon icon="solar:link-broken" className="h-3.5 w-3.5" />
              Connect Calendar
            </a>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          When connected, confirmed bookings assigned to you will automatically appear in your Google Calendar.
        </p>
      </div>

      <ConfirmModal
        isOpen={showDisconnectModal}
        onCancel={() => setShowDisconnectModal(false)}
        onConfirm={handleDisconnectConfirm}
        variant="warning"
        title="Disconnect Google Calendar?"
        description="Bookings will no longer sync to Google Calendar until you reconnect."
        confirmLabel="Disconnect"
        cancelLabel="Keep Connected"
      />
    </div>
  );
}
