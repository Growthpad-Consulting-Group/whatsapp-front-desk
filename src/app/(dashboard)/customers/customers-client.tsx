"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import PageHeader from "@/components/ui/PageHeader";
import StatusPill from "@/components/ui/StatusPill";
import { AnimatedMetricCard } from "@/components/ui/AnimatedMetricCard";
import GenericTable, { type TableColumn } from "@/components/ui/GenericTable";
import { Icon } from "@iconify/react";

interface CustomersClientProps {
  initialCustomers: any[];
  appointments: any[];
  invoices: any[];
  business: any;
  isOwner?: boolean;
}

type CustomerRow = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  consent_given: boolean;
  tags: string[];
  lastBooking: string;
  unpaidBalance: number;
  hasBooked: boolean;
};

export function CustomersClient({
  initialCustomers,
  appointments,
  invoices,
  business,
  isOwner = false,
}: CustomersClientProps) {
  const router = useRouter();
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const customersData = useMemo<CustomerRow[]>(() => {
    return initialCustomers.map((c) => {
      const clientAppts = appointments.filter((a) => a.customer_id === c.id);

      let lastBooking = "No bookings";
      if (clientAppts.length > 0) {
        const sorted = [...clientAppts].sort(
          (a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime()
        );
        lastBooking = new Date(sorted[0].start_at).toLocaleDateString("en-GB");
      }

      const clientInvs = invoices.filter((i) => i.customer_id === c.id);
      const unpaidBalance = clientInvs.reduce(
        (acc: number, inv: any) => acc + (Number(inv.amount) - Number(inv.amount_paid)),
        0
      );

      return { ...c, tags: c.tags ?? [], lastBooking, unpaidBalance, hasBooked: clientAppts.length > 0 };
    });
  }, [initialCustomers, appointments, invoices]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    customersData.forEach((c) => c.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [customersData]);

  const filteredData = useMemo(
    () => activeTag ? customersData.filter((c) => c.tags.includes(activeTag)) : customersData,
    [customersData, activeTag]
  );

  const metrics = useMemo(() => ({
    total: customersData.length,
    active: customersData.filter((c) => c.hasBooked).length,
    totalDebt: customersData.reduce((acc, c) => acc + c.unpaidBalance, 0),
  }), [customersData]);

  const columns: TableColumn<CustomerRow>[] = [
    {
      key: "name",
      header: "Client Name",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-primary">{row.name?.[0]?.toUpperCase() ?? "?"}</span>
          </div>
          <span className="font-semibold text-foreground">{row.name}</span>
        </div>
      ),
    },
    {
      key: "phone",
      header: "WhatsApp",
      render: (row) => <span className="text-muted-foreground font-mono text-xs">{row.phone}</span>,
    },
    {
      key: "tags",
      header: "Tags",
      hideOnMobile: true,
      render: (row) =>
        row.tags.length === 0 ? (
          <span className="text-muted-foreground text-xs">—</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {row.tags.map((t) => (
              <span
                key={t}
                onClick={(e) => { e.stopPropagation(); setActiveTag(activeTag === t ? null : t); }}
                className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-semibold cursor-pointer hover:bg-primary/20 transition-colors"
              >
                {t}
              </span>
            ))}
          </div>
        ),
    },
    {
      key: "lastBooking",
      header: "Last Appointment",
      sortable: true,
      hideOnMobile: true,
      render: (row) => <span className="text-muted-foreground text-sm">{row.lastBooking}</span>,
    },
    {
      key: "unpaidBalance",
      header: "Outstanding",
      sortable: true,
      render: (row) =>
        row.unpaidBalance > 0 ? (
          <span className="font-bold text-red-500 text-sm">{formatCurrency(row.unpaidBalance, business.currency)}</span>
        ) : (
          <span className="text-xs text-muted-foreground">Settled</span>
        ),
    },
    {
      key: "consent_given",
      header: "Bot Consent",
      hideOnMobile: true,
      render: (row) => (
        <StatusPill
          status={row.consent_given ? "active" : "inactive"}
          context="user"
          customLabel={row.consent_given ? "Allowed" : "No Consent"}
          variant="default"
          size="sm"
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        icon="solar:users-group-rounded-bold-duotone"
        iconBgColor="bg-linear-to-br from-blue-600 to-blue-500"
        description="Your client directory and outstanding balances"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AnimatedMetricCard
          title="Total Customers"
          value={metrics.total}
          icon="solar:users-group-rounded-broken"
          color="blue"
          variant="card"
        />
        <AnimatedMetricCard
          title="Active Bookers"
          value={metrics.active}
          icon="solar:user-check-broken"
          color="green"
          variant="card"
        />
        <AnimatedMetricCard
          title="Total Debt Outstanding"
          value={formatCurrency(metrics.totalDebt, business.currency)}
          icon="solar:wallet-broken"
          color="red"
          variant="card"
        />
      </div>

      {/* Tag filter pills */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium shrink-0">Filter by tag:</span>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-[11px] font-semibold transition-colors ${
                activeTag === tag
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
              }`}
            >
              <Icon icon="solar:tag-broken" className="h-3 w-3" />
              {tag}
              {activeTag === tag && <Icon icon="solar:close-circle-broken" className="h-3 w-3" />}
            </button>
          ))}
          {activeTag && (
            <button
              type="button"
              onClick={() => setActiveTag(null)}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Clear
            </button>
          )}
        </div>
      )}

      <GenericTable
        columns={columns}
        data={filteredData}
        keyExtractor={(row) => row.id}
        searchable
        searchPlaceholder="Search by name, phone or email…"
        selectable
        enableExport
        exportFilename="customers"
        enableRefresh
        onView={(row) => router.push(`/customers/${row.id}`)}
        fullPageHeight
        emptyIcon="solar:users-group-rounded-broken"
        emptyTitle={activeTag ? `No customers tagged "${activeTag}"` : "No customers yet"}
        emptyDescription={activeTag ? "Try a different tag or clear the filter." : "Customers will appear here once they start booking via WhatsApp."}
      />
    </div>
  );
}
