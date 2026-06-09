"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireBusiness } from "@/lib/data/business";
import { createAuditLogAction } from "@/actions/audit";
import type { ActionResult } from "@/types";

export async function cancelBookingAction(appointmentId: string): Promise<ActionResult> {
  try {
    const { business, staff } = await requireBusiness();

    const supabase = await createClient();
    
    // Fetch target appointment
    const { data: appt, error: apptError } = await supabase
      .from("appointments")
      .select("*, services(name)")
      .eq("id", appointmentId)
      .eq("business_id", business.id)
      .single();

    if (apptError || !appt) {
      return { success: false, error: "Appointment not found." };
    }

    if (appt.status === "cancelled") {
      return { success: false, error: "Appointment is already cancelled." };
    }

    const adminSupabase = createAdminClient();
    
    // Update appointment status to cancelled
    const { error: cancelError } = await adminSupabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", appointmentId);

    if (cancelError) {
      return { success: false, error: cancelError.message };
    }

    // Trigger Google Calendar event deletion
    if (appt.staff_id && appt.google_event_id) {
      try {
        const { deleteGoogleEvent } = await import("@/lib/calendar/google");
        await deleteGoogleEvent(appt.staff_id, appt.google_event_id);
      } catch (err: any) {
        console.error(`[Google Calendar] Failed to delete event on cancellation:`, err.message);
      }
    }

    await createAuditLogAction("booking.cancelled", appointmentId, {
      service: (appt.services as any)?.name,
      cancelled_by: staff.name,
    });

    revalidatePath("/bookings");
    return { success: true, data: undefined };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function rescheduleBookingAction(
  appointmentId: string,
  newStartAt: string,
  newStaffId: string | null
): Promise<ActionResult> {
  try {
    const { business } = await requireBusiness();

    const supabase = await createClient();

    // Fetch target appointment and service details
    const { data: oldAppt, error: apptError } = await supabase
      .from("appointments")
      .select("*, services(*)")
      .eq("id", appointmentId)
      .eq("business_id", business.id)
      .single();

    if (apptError || !oldAppt) {
      return { success: false, error: "Appointment not found." };
    }

    const service = oldAppt.services as any;
    if (!service) {
      return { success: false, error: "Associated service not found." };
    }

    const startAt = new Date(newStartAt);
    const endAt = new Date(startAt.getTime() + service.duration_minutes * 60 * 1000);

    const adminSupabase = createAdminClient();

    // Update appointment details
    const { data: appt, error: updateError } = await adminSupabase
      .from("appointments")
      .update({
        staff_id: newStaffId,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        status: "confirmed", // manual reschedule confirms it
      })
      .eq("id", appointmentId)
      .select("*")
      .single();

    if (updateError || !appt) {
      return { success: false, error: updateError?.message || "Failed to update appointment." };
    }

    // Google Calendar Sync
    if (appt.staff_id) {
      try {
        const { createGoogleEvent, updateGoogleEvent, deleteGoogleEvent } = await import("@/lib/calendar/google");
        
        // Fetch customer name for calendar summary
        const { data: customer } = await supabase
          .from("customers")
          .select("name")
          .eq("id", appt.customer_id)
          .single();
          
        const customerName = customer?.name || "Client";

        // If staff changed, delete old calendar event and create new one
        if (oldAppt.staff_id !== appt.staff_id && oldAppt.staff_id && oldAppt.google_event_id) {
          await deleteGoogleEvent(oldAppt.staff_id, oldAppt.google_event_id);
          const googleEventId = await createGoogleEvent(
            appt.staff_id,
            appt.id,
            appt.start_at,
            appt.end_at,
            customerName,
            service.name
          );
          await adminSupabase
            .from("appointments")
            .update({ google_event_id: googleEventId })
            .eq("id", appt.id);
        } else if (appt.google_event_id) {
          // Update event on same staff member
          await updateGoogleEvent(
            appt.staff_id,
            appt.google_event_id,
            appt.start_at,
            appt.end_at,
            customerName,
            service.name
          );
        } else {
          // Create new event
          const googleEventId = await createGoogleEvent(
            appt.staff_id,
            appt.id,
            appt.start_at,
            appt.end_at,
            customerName,
            service.name
          );
          await adminSupabase
            .from("appointments")
            .update({ google_event_id: googleEventId })
            .eq("id", appt.id);
        }
      } catch (err: any) {
        console.error(`[Google Calendar] Failed to sync rescheduled event:`, err.message);
      }
    }

    await createAuditLogAction("booking.rescheduled", appointmentId, {
      new_start_at: newStartAt,
      new_staff_id: newStaffId,
    });

    revalidatePath("/bookings");
    return { success: true, data: undefined };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}
