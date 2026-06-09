import { createAdminClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";
import { PrintButton } from "@/components/ui/print-button";
import { PayButton } from "@/components/ui/PayButton";

interface InvoicePageProps {
  params: Promise<{ id: string }>;
}

export default async function PublicInvoicePage({ params }: InvoicePageProps) {
  const { id } = await params;
  const supabase = createAdminClient();

  // Fetch invoice details using admin client (bypasses RLS for public client link access)
  const { data: inv, error } = await supabase
    .from("invoices")
    .select("*, customers(*), businesses(*), appointments(*)")
    .eq("id", id)
    .single();

  if (error || !inv) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 text-center space-y-4 shadow-lg">
          <Icon icon="solar:shield-warning-broken" className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-semibold text-foreground">Invoice Not Found</h2>
          <p className="text-sm text-muted-foreground">
            The requested invoice link is invalid, expired, or does not exist.
          </p>
        </div>
      </div>
    );
  }

  const customer = inv.customers as any;
  const business = inv.businesses as any;
  const appointment = inv.appointments as any;

  const outstandingAmount = Number(inv.amount) - Number(inv.amount_paid);

  // Status mapping to colors
  const statusColors: Record<string, "default" | "success" | "warning" | "destructive" | "outline"> = {
    draft: "outline",
    sent: "warning",
    due: "warning",
    overdue: "destructive",
    partially_paid: "default",
    paid: "success",
    cancelled: "destructive",
    disputed: "destructive",
  };


  return (
    <div className="min-h-screen w-full bg-muted/20 py-12 px-4 sm:px-6 lg:px-8">
      {/* Container Card */}
      <div className="max-w-2xl mx-auto bg-card border border-border/80 rounded-3xl shadow-xl overflow-hidden print:border-none print:shadow-none print:bg-white print-receipt">
        
        {/* Banner Details */}
        <div className="bg-primary/5 border-b border-border/60 p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:bg-transparent print:p-0 print:pb-6 print:border-b">
          <div>
            <h1 className="text-2xl font-bold text-foreground print:text-black">{business.name}</h1>
            <p className="text-xs text-muted-foreground mt-1">Receipt &amp; Payment Desk</p>
          </div>
          <div className="flex flex-col sm:items-end gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Invoice Number</span>
            <span className="text-lg font-bold text-foreground font-mono print:text-black">{inv.invoice_number}</span>
          </div>
        </div>

        {/* Invoice Body */}
        <div className="p-8 space-y-8 print:p-0 print:pt-6">
          {/* Metadata Row */}
          <div className="grid grid-cols-2 gap-6 text-sm border-b border-border/40 pb-6">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Billed To</p>
              <p className="font-semibold text-foreground print:text-black">{customer.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{customer.phone}</p>
              {customer.email && <p className="text-xs text-muted-foreground">{customer.email}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Invoice Summary</p>
              <div className="flex items-center justify-end gap-1.5 mb-1.5">
                <span className="text-xs text-muted-foreground">Status:</span>
                <Badge variant={statusColors[inv.status] || "default"}>
                  {inv.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Issued: {new Date(inv.created_at).toLocaleDateString("en-GB")}</p>
              <p className="text-xs text-muted-foreground">Due Date: {new Date(inv.due_date).toLocaleDateString("en-GB")}</p>
            </div>
          </div>

          {/* Details Table */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Items</h3>
            <div className="border border-border/50 rounded-2xl overflow-hidden print:border-black">
              <div className="bg-muted/30 grid grid-cols-3 p-4 text-xs font-semibold border-b border-border/40 text-muted-foreground print:bg-transparent print:border-black print:text-black">
                <span className="col-span-2">Description</span>
                <span className="text-right">Price</span>
              </div>
              
              <div className="grid grid-cols-3 p-4 text-sm border-b border-border/30 last:border-0 print:border-black">
                <div className="col-span-2">
                  <p className="font-medium text-foreground print:text-black">Appointment Service Fee</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Service completed on {new Date(inv.due_date).toLocaleDateString("en-GB")}
                  </p>
                </div>
                <span className="text-right font-medium text-foreground print:text-black self-center">
                  {formatCurrency(Number(inv.amount) + Number(inv.amount_paid), inv.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full sm:w-64 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(Number(inv.amount) + Number(inv.amount_paid), inv.currency)}</span>
              </div>
              {Number(inv.amount_paid) > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>Deductions / Deposit Paid</span>
                  <span>-{formatCurrency(Number(inv.amount_paid), inv.currency)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t border-border/50 pt-2 text-foreground print:text-black print:border-black">
                <span>Total Due</span>
                <span>{formatCurrency(outstandingAmount, inv.currency)}</span>
              </div>
            </div>
          </div>

          {inv.notes && (
            <div className="border-t border-border/40 pt-6">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Notes</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{inv.notes}</p>
            </div>
          )}

          {/* Interactive controls (hidden during print) */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border/45 no-print">
            <PrintButton />
            
            {outstandingAmount > 0 && (
              <PayButton invoiceId={inv.id} amount={outstandingAmount} currency={inv.currency} />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-muted/10 border-t border-border/30 p-6 text-center text-xs text-muted-foreground leading-normal print:hidden">
          This invoice was automatically generated for services offered by {business.name}.
        </div>

      </div>

      {/* Embedded Client-side print logic script hack for server components */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            // Allows standard inline JS functions to work since window is client side
            // (e.g. window.print handler)
          `,
        }}
      />
    </div>
  );
}
