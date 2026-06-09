"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import PageHeader from "@/components/ui/PageHeader";
import StatusPill from "@/components/ui/StatusPill";
import { AnimatedMetricCard } from "@/components/ui/AnimatedMetricCard";
import GenericTable, { type TableColumn } from "@/components/ui/GenericTable";

interface CustomersClientProps {
  initialCustomers: any[];
  appointments: any[];
  invoices: any[];
  business: any;
}

type CustomerRow = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  consent_given: boolean;
  lastBooking: string;
  unpaidBalance: number;
  hasBooked: boolean;
};

export function CustomersClient({
  initialCustomers,
  appointments,
  invoices,
  business,
}: CustomersClientProps) {
  const router = useRouter();

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

      return { ...c, lastBooking, unpaidBalance, hasBooked: clientAppts.length > 0 };
    });
  }, [initialCustomers, appointments, invoices]);

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
      key: "email",
      header: "Email",
      hideOnMobile: true,
      render: (row) => <span className="text-muted-foreground text-xs">{row.email ?? "—"}</span>,
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
          mode="light"
        />
        <AnimatedMetricCard
          title="Active Bookers"
          value={metrics.active}
          icon="solar:user-check-broken"
          color="green"
          variant="card"
          mode="light"
        />
        <AnimatedMetricCard
          title="Total Debt Outstanding"
          value={formatCurrency(metrics.totalDebt, business.currency)}
          icon="solar:wallet-broken"
          color="red"
          variant="card"
          mode="light"
        />
      </div>

      <GenericTable
        columns={columns}
        data={customersData}
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
        emptyTitle="No customers yet"
        emptyDescription="Customers will appear here once they start booking via WhatsApp."
      />
    </div>
  );
}
