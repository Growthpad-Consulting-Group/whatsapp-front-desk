"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import Select from "react-select";
import { createServiceAction, updateServiceAction, toggleServiceActiveAction } from "@/actions/services";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { Icon } from "@iconify/react";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { SimpleModal } from "@/components/common/SimpleModal";
import { TooltipButton } from "@/components/ui/TooltipButton";
import { getSelectStyles } from "@/utils/selectStyles";

interface ServiceWithStaff {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  deposit_required: boolean;
  deposit_amount: number | null;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  staff_id: string | null;
  active: boolean;
  staff_members?: { name: string } | null;
}

interface ServicesClientProps {
  initialServices: ServiceWithStaff[];
  staffMembers: Array<{ id: string; name: string }>;
  currency: string;
  isOwner: boolean;
}

export function ServicesClient({ initialServices, staffMembers, currency, isOwner }: ServicesClientProps) {
  const { resolvedTheme } = useTheme();
  const [services, setServices] = useState<ServiceWithStaff[]>(initialServices);
  const [isOpen, setIsOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceWithStaff | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("30");
  const [price, setPrice] = useState("");
  const [depositRequired, setDepositRequired] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [bufferBefore, setBufferBefore] = useState("0");
  const [bufferAfter, setBufferAfter] = useState("0");
  const [staffId, setStaffId] = useState("");
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName(""); setDescription(""); setDuration("30"); setPrice("");
    setDepositRequired(false); setDepositAmount(""); setBufferBefore("0");
    setBufferAfter("0"); setStaffId(""); setActive(true); setError(null);
  };

  const handleOpenCreate = () => {
    setEditingService(null);
    resetForm();
    setIsOpen(true);
  };

  const handleOpenEdit = (service: ServiceWithStaff) => {
    setEditingService(service);
    setName(service.name);
    setDescription(service.description || "");
    setDuration(String(service.duration_minutes));
    setPrice(String(service.price));
    setDepositRequired(service.deposit_required);
    setDepositAmount(service.deposit_amount ? String(service.deposit_amount) : "");
    setBufferBefore(String(service.buffer_before_minutes));
    setBufferAfter(String(service.buffer_after_minutes));
    setStaffId(service.staff_id || "");
    setActive(service.active);
    setError(null);
    setIsOpen(true);
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    if (!isOwner) return;
    const newActive = !currentActive;
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, active: newActive } : s)));
    const res = await toggleServiceActiveAction(id, newActive);
    if (res.success) {
      toast.success(newActive ? "Service activated." : "Service deactivated.");
    } else {
      setServices((prev) => prev.map((s) => (s.id === id ? { ...s, active: currentActive } : s)));
      toast.error("Failed to update service.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;
    setLoading(true);
    setError(null);

    const payload = {
      name, description,
      duration_minutes: Number(duration),
      price: Number(price),
      deposit_required: depositRequired,
      deposit_amount: depositRequired ? Number(depositAmount) : null,
      buffer_before_minutes: Number(bufferBefore),
      buffer_after_minutes: Number(bufferAfter),
      staff_id: staffId || null,
      active,
    };

    const staffName = staffId ? staffMembers.find((m) => m.id === staffId)?.name : undefined;

    if (editingService) {
      const res = await updateServiceAction(editingService.id, payload);
      setLoading(false);
      if (res.success) {
        setServices((prev) =>
          prev.map((s) =>
            s.id === editingService.id
              ? { ...s, ...payload, staff_members: staffName ? { name: staffName } : null }
              : s
          )
        );
        toast.success("Service updated.");
        setIsOpen(false);
      } else {
        setError(res.error);
      }
    } else {
      const res = await createServiceAction(payload);
      setLoading(false);
      if (!res.success) {
        setError(res.error);
      } else {
        setServices((prev) => [
          { id: res.data, ...payload, staff_members: staffName ? { name: staffName } : null },
          ...prev,
        ]);
        toast.success("Service created.");
        setIsOpen(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Services"
        icon="solar:widget-bold-duotone"
        iconBgColor="bg-linear-to-br from-blue-600 to-blue-500"
        description="Configure the list of services clients can choose when booking"
        actions={isOwner ? [{ label: "Add Service", icon: "solar:add-circle-broken", variant: "primary" as const, onClick: handleOpenCreate }] : []}
      />

      {services.length === 0 ? (
        <EmptyState
          icon="solar:tuning-broken"
          title="No services found"
          description="Create your first service offering to get started."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              className={`group bg-card border rounded-2xl p-5 shadow-sm transition-all duration-200 hover:shadow-md flex flex-col justify-between ${
                !service.active ? "opacity-75 border-border/50 bg-muted/40" : "border-border"
              }`}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {service.name}
                  </h3>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <TooltipButton
                      tooltip={service.active ? "Deactivate" : "Activate"}
                      icon={service.active ? "solar:check-circle-broken" : "solar:eye-closed-broken"}
                      variant={service.active ? "success" : "ghost"}
                      onClick={() => handleToggleActive(service.id, service.active)}
                      disabled={!isOwner}
                    />
                    {isOwner && (
                      <TooltipButton
                        tooltip="Edit service"
                        icon="solar:pen-2-broken"
                        variant="ghost"
                        onClick={() => handleOpenEdit(service)}
                      />
                    )}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
                  {service.description || "No description provided."}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs border-t border-border/50 pt-3">
                  <div>
                    <span className="text-muted-foreground block">Duration</span>
                    <span className="font-medium text-foreground">{service.duration_minutes} mins</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Price</span>
                    <span className="font-medium text-foreground">{formatCurrency(service.price, currency)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-t border-border/50 pt-3">
                  <div>
                    <span className="text-muted-foreground block">Deposit</span>
                    <span className="font-medium text-foreground">
                      {service.deposit_required && service.deposit_amount
                        ? formatCurrency(service.deposit_amount, currency)
                        : "None"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Assigned Staff</span>
                    <span className="font-medium text-foreground truncate block max-w-full">
                      {service.staff_members?.name || "Any staff"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <SimpleModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editingService ? "Edit Service" : "Create Service"}
        subtitle="Define the pricing, buffers, and staff defaults for this service."
        width="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Service name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Microblading session"
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed service description…"
              className="min-h-16 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Duration (minutes)" type="number" min="1" max="1440" value={duration} onChange={(e) => setDuration(e.target.value)} required />
            <Input label={`Price (${currency})`} type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
          </div>

          <div className="bg-muted/30 border border-border/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="deposit_toggle" className="text-sm font-medium text-foreground">
                Require Booking Deposit
              </label>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  id="deposit_toggle"
                  type="checkbox"
                  checked={depositRequired}
                  onChange={() => setDepositRequired(!depositRequired)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
              </label>
            </div>
            {depositRequired && (
              <Input label={`Deposit Amount (${currency})`} type="number" min="0" step="0.01" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} required />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Buffer Before (min)" type="number" min="0" max="120" value={bufferBefore} onChange={(e) => setBufferBefore(e.target.value)} required />
            <Input label="Buffer After (min)" type="number" min="0" max="120" value={bufferAfter} onChange={(e) => setBufferAfter(e.target.value)} required />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Assigned Staff (Default)</label>
            <Select
              inputId="staff_assignment"
              options={[
                { value: "", label: "Any active staff member" },
                ...staffMembers.map((m) => ({ value: m.id, label: m.name })),
              ]}
              value={staffId === "" ? { value: "", label: "Any active staff member" } : staffMembers.find((m) => m.id === staffId) ? { value: staffId, label: staffMembers.find((m) => m.id === staffId)!.name } : null}
              onChange={(opt) => setStaffId((opt as { value: string } | null)?.value ?? "")}
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
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" loading={loading}>
              {editingService ? "Save Changes" : "Create Service"}
            </Button>
          </div>
        </form>
      </SimpleModal>
    </div>
  );
}
