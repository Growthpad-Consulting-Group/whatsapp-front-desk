import Link from "next/link";
import { CheckCircle2, XCircle, AlertTriangle, CalendarDays } from "lucide-react";

interface StatusPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function PaymentStatusPage({ searchParams }: StatusPageProps) {
  const { status } = await searchParams;

  const config: Record<
    string,
    { title: string; desc: string; colorClass: string; icon: React.ReactNode }
  > = {
    success: {
      title: "Payment Successful!",
      desc: "Your transaction has been processed. We have updated your booking confirmation and synchronized your staff's calendar.",
      colorClass: "text-green-500 bg-green-500/10 border-green-500/20",
      icon: <CheckCircle2 className="h-16 w-16 text-green-500" />,
    },
    failed: {
      title: "Payment Failed",
      desc: "We could not complete your transaction. Please try opening the payment link again or use a different payment method.",
      colorClass: "text-red-500 bg-red-500/10 border-red-500/20",
      icon: <XCircle className="h-16 w-16 text-red-500" />,
    },
    cancelled: {
      title: "Booking Expired",
      desc: "This appointment has been cancelled or timed out. Please trigger a new booking flow on WhatsApp to select a fresh time slot.",
      colorClass: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
      icon: <AlertTriangle className="h-16 w-16 text-yellow-500" />,
    },
    invalid: {
      title: "Invalid Payment Request",
      desc: "This payment link is invalid, expired, or has already been completed.",
      colorClass: "text-blue-500 bg-blue-500/10 border-blue-500/20",
      icon: <CalendarDays className="h-16 w-16 text-blue-500" />,
    },
  };

  const currentStatus = status && config[status] ? status : "invalid";
  const { title, desc, colorClass, icon } = config[currentStatus];

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-muted/50 via-background to-background p-4">
      {/* Background blur decorators */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-md bg-card/65 backdrop-blur-md border border-border/60 rounded-3xl p-8 shadow-2xl text-center space-y-6">
        <div className="flex justify-center">{icon}</div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
        </div>

        <div className={`border rounded-2xl p-4 text-xs leading-normal ${colorClass}`}>
          {currentStatus === "success" && (
            <span>You can close this window now. A booking confirmation message has been sent to your WhatsApp number.</span>
          )}
          {currentStatus === "failed" && (
            <span>If funds were deducted, please contact the merchant directly with your transaction details.</span>
          )}
          {currentStatus === "cancelled" && (
            <span>Time slots are released to other clients when holds expire.</span>
          )}
          {currentStatus === "invalid" && (
            <span>If you believe this is an error, please check with your service provider.</span>
          )}
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:opacity-95 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
