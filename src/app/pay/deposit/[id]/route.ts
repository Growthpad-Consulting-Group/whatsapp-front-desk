import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createPaymentLinkAction } from "@/actions/payments";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

  try {
    const supabase = createAdminClient();

    // Fetch appointment with service and business configs
    const { data: appt, error: apptError } = await supabase
      .from("appointments")
      .select("*, services(*), businesses(*)")
      .eq("id", id)
      .single();

    if (apptError || !appt) {
      return NextResponse.redirect(`${appUrl}/pay/status?status=invalid`);
    }

    // Redirect to state page if already processed
    if (appt.status !== "pending" || appt.payment_status !== "deposit_pending") {
      const isPaid = appt.payment_status === "deposit_paid" || appt.payment_status === "paid";
      return NextResponse.redirect(
        `${appUrl}/pay/status?status=${
          isPaid ? "success" : appt.status === "cancelled" ? "cancelled" : "invalid"
        }`
      );
    }

    const service = appt.services as any;
    const business = appt.businesses as any;

    if (!service || !business) {
      return NextResponse.redirect(`${appUrl}/pay/status?status=invalid`);
    }

    // Determine deposit amount
    let depositAmount = 0;
    if (service.deposit_required && service.deposit_amount) {
      depositAmount = Number(service.deposit_amount);
    } else if (business.deposit_default_percent) {
      depositAmount = (Number(service.price) * Number(business.deposit_default_percent)) / 100;
    }

    if (depositAmount <= 0) {
      // Fallback: No deposit actually needed, confirm instantly
      await supabase
        .from("appointments")
        .update({ status: "confirmed", payment_status: "unpaid" })
        .eq("id", appt.id);
      return NextResponse.redirect(`${appUrl}/pay/status?status=success`);
    }

    // Generate link and redirect
    const res = await createPaymentLinkAction(
      appt.id,
      null,
      depositAmount,
      business.currency || "KES"
    );

    if (res.success && res.url) {
      return NextResponse.redirect(res.url);
    } else {
      console.error("[Deposit Redirect Error]:", res.error);
      return NextResponse.redirect(`${appUrl}/pay/status?status=failed`);
    }
  } catch (err: any) {
    console.error("[Deposit GET error]:", err.message);
    return NextResponse.redirect(`${appUrl}/pay/status?status=failed`);
  }
}
