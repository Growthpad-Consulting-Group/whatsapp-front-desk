"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatCurrency, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";

interface CustomersClientProps {
  initialCustomers: any[];
  appointments: any[];
  invoices: any[];
  business: any;
}

export function CustomersClient({
  initialCustomers,
  appointments,
  invoices,
  business,
}: CustomersClientProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Map appointments and invoices to customers in memory for fast performance
  const customersData = useMemo(() => {
    return initialCustomers.map((c) => {
      // Find all appointments for customer
      const clientAppts = appointments.filter((a) => a.customer_id === c.id);
      
      // Calculate last booking date
      let lastBookingStr = "No bookings";
      if (clientAppts.length > 0) {
        const sorted = [...clientAppts].sort(
          (a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime()
        );
        lastBookingStr = new Date(sorted[0].start_at).toLocaleDateString("en-GB");
      }

      // Calculate unpaid balance
      const clientInvs = invoices.filter((i) => i.customer_id === c.id);
      const unpaidBalance = clientInvs.reduce(
        (acc, inv) => acc + (Number(inv.amount) - Number(inv.amount_paid)),
        0
      );

      return {
        ...c,
        lastBooking: lastBookingStr,
        unpaidBalance,
        hasBooked: clientAppts.length > 0,
      };
    });
  }, [initialCustomers, appointments, invoices]);

  // Filter based on query
  const filteredCustomers = useMemo(() => {
    return customersData.filter((c) => {
      return (
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [customersData, searchTerm]);

  // Overall Directory Metrics
  const metrics = useMemo(() => {
    const total = customersData.length;
    const active = customersData.filter((c) => c.hasBooked).length;
    const totalDebt = customersData.reduce((acc, c) => acc + c.unpaidBalance, 0);

    return { total, active, totalDebt };
  }, [customersData]);

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards (Glassmorphism layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="relative overflow-hidden bg-card/65 backdrop-blur-md border border-border/50 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Customers</p>
              <h3 className="text-3xl font-bold text-foreground mt-2">{metrics.total}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Icon icon="mdi:account-group-outline" className="h-5 w-5" />
            </div>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -z-10" />
        </div>

        <div className="relative overflow-hidden bg-card/65 backdrop-blur-md border border-border/50 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Bookers</p>
              <h3 className="text-3xl font-bold text-foreground mt-2">{metrics.active}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
              <Icon icon="mdi:account-check-outline" className="h-5 w-5" />
            </div>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-2xl -z-10" />
        </div>

        <div className="relative overflow-hidden bg-card/65 backdrop-blur-md border border-border/50 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Debt Outstanding</p>
              <h3 className="text-3xl font-bold text-foreground mt-2">{formatCurrency(metrics.totalDebt, business.currency)}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
              <Icon icon="mdi:cash-remove" className="h-5 w-5" />
            </div>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl -z-10" />
        </div>
      </div>

      {/* Control Search Bar */}
      <div className="bg-card/75 backdrop-blur-md border border-border rounded-2xl p-5 shadow-sm flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by client name, phone or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 w-full pl-9 pr-4 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <span className="text-xs text-muted-foreground hidden sm:inline">
          Showing {filteredCustomers.length} of {metrics.total} customer profiles
        </span>
      </div>

      {/* Customers List (Responsive Table/Cards) */}
      <div className="bg-card/75 backdrop-blur-md border border-border rounded-2xl overflow-hidden shadow-sm">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-16">
            <Icon icon="mdi:account-off-outline" className="h-12 w-12 text-muted-foreground/60 mx-auto mb-4" />
            <h4 className="font-semibold text-foreground">No customers found</h4>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase bg-muted/20">
                  <th className="p-4 pl-6">Client Name</th>
                  <th className="p-4">WhatsApp Phone</th>
                  <th className="p-4">Last Appointment</th>
                  <th className="p-4">Outstanding Bal</th>
                  <th className="p-4">Bot Consent</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-sm">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/10 transition-colors">
                    <td className="p-4 pl-6 font-semibold text-foreground">{c.name}</td>
                    <td className="p-4 text-muted-foreground font-mono text-xs">{c.phone}</td>
                    <td className="p-4 text-muted-foreground">{c.lastBooking}</td>
                    <td className="p-4">
                      {c.unpaidBalance > 0 ? (
                        <span className="font-bold text-red-500">
                          {formatCurrency(c.unpaidBalance, business.currency)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Settled</span>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge variant={c.consent_given ? "success" : "outline"}>
                        {c.consent_given ? "Allowed" : "No Consent"}
                      </Badge>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <Link
                        href={`/customers/${c.id}`}
                        className="inline-flex h-8 items-center justify-center gap-1 px-3 rounded-lg border border-border text-xs font-semibold hover:bg-muted transition-colors"
                      >
                        <Icon icon="mdi:account-badge-outline" className="h-3.5 w-3.5" /> View File
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
