"use client";

import { useState } from "react";
import { createServiceAction, updateServiceAction, toggleServiceActiveAction } from "@/actions/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { Plus, Edit2, Sliders, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";

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

export function ServicesClient({
  initialServices,
  staffMembers,
  currency,
  isOwner,
}: ServicesClientProps) {
  const [services, setServices] = useState<ServiceWithStaff[]>(initialServices);
  const [isOpen, setIsOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceWithStaff | null>(null);

  // Form states
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
    setName("");
    setDescription("");
    setDuration("30");
    setPrice("");
    setDepositRequired(false);
    setDepositAmount("");
    setBufferBefore("0");
    setBufferAfter("0");
    setStaffId("");
    setActive(true);
    setError(null);
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

    // Optimistic UI update
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: newActive } : s))
    );

    const res = await toggleServiceActiveAction(id, newActive);
    if (!res.success) {
      // Revert if error
      setServices((prev) =>
        prev.map((s) => (s.id === id ? { ...s, active: currentActive } : s))
      );
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
      description,
      duration_minutes: Number(duration),
      price: Number(price),
      deposit_required: depositRequired,
      deposit_amount: depositRequired ? Number(depositAmount) : null,
      buffer_before_minutes: Number(bufferBefore),
      buffer_after_minutes: Number(bufferAfter),
      staff_id: staffId || null,
      active,
    };

    if (editingService) {
      const res = await updateServiceAction(editingService.id, payload);
      setLoading(false);
      if (res.success) {
        setServices((prev) =>
          prev.map((s) =>
            s.id === editingService.id
              ? {
                  ...s,
                  ...payload,
                  staff_members: staffId
                    ? staffMembers.find((m) => m.id === staffId)
                      ? { name: staffMembers.find((m) => m.id === staffId)!.name }
                      : null
                    : null,
                }
              : s
          )
        );
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
        const newService: ServiceWithStaff = {
          id: res.data,
          ...payload,
          staff_members: staffId
            ? staffMembers.find((m) => m.id === staffId)
              ? { name: staffMembers.find((m) => m.id === staffId)!.name }
              : null
            : null,
        };
        setServices((prev) => [newService, ...prev]);
        setIsOpen(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Service Catalog</h2>
          <p className="text-sm text-muted-foreground">
            Configure the list of services clients can choose when booking.
          </p>
        </div>
        {isOwner && (
          <Button onClick={handleOpenCreate} size="sm" className="flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> Add Service
          </Button>
        )}
      </div>

      {services.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border border-dashed rounded-2xl">
          <Sliders className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-foreground font-medium">No services found</p>
          <p className="text-xs text-muted-foreground mt-1">
            Create your first service offering to get started.
          </p>
        </div>
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
                    <button
                      onClick={() => handleToggleActive(service.id, service.active)}
                      disabled={!isOwner}
                      title={service.active ? "Deactivate" : "Activate"}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        service.active
                          ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-950/20 dark:border-green-900 dark:text-green-400"
                          : "bg-muted border-border text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {service.active ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5" />
                      )}
                    </button>
                    {isOwner && (
                      <button
                        onClick={() => handleOpenEdit(service)}
                        className="p-1.5 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
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
                    <span className="font-medium text-foreground">
                      {formatCurrency(service.price, currency)}
                    </span>
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

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-background/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Container */}
          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-10 relative">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">
                {editingService ? "Edit Service offering" : "Create new Service"}
              </h3>
              <p className="text-xs text-muted-foreground">
                Define the pricing, buffers, and staff defaults for this service.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                  placeholder="Detailed semi-permanent brow service description..."
                  className="min-h-16 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Duration (minutes)"
                  type="number"
                  min="1"
                  max="1440"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                />

                <Input
                  label={`Price (${currency})`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
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
                    <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {depositRequired && (
                  <Input
                    label={`Deposit Amount (${currency})`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    required
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Buffer Before (min)"
                  type="number"
                  min="0"
                  max="120"
                  value={bufferBefore}
                  onChange={(e) => setBufferBefore(e.target.value)}
                  required
                />

                <Input
                  label="Buffer After (min)"
                  type="number"
                  min="0"
                  max="120"
                  value={bufferAfter}
                  onChange={(e) => setBufferAfter(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="staff_assignment" className="text-sm font-medium text-foreground">
                  Assigned Staff (Default)
                </label>
                <select
                  id="staff_assignment"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Any active staff member</option>
                  {staffMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
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
                  {editingService ? "Save Changes" : "Create Service"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
