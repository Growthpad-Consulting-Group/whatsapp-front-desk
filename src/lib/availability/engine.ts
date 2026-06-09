import { createClient } from "@/lib/supabase/server";
import { getGoogleBusyPeriods } from "@/lib/calendar/google";
import type { AvailableSlot } from "@/types";

interface LocalDateParts {
  localDateStr: string;
  dayOfWeek: number;
}

function getLocalDateParts(date: Date, timeZone: string): LocalDateParts {
  const options: Intl.DateTimeFormatOptions = {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };
  const formatter = new Intl.DateTimeFormat("en-US", options);
  const parts = formatter.formatToParts(date);
  const year = parts.find((p) => p.type === "year")!.value;
  const month = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;

  const localDateStr = `${year}-${month}-${day}`;
  const localDate = new Date(`${localDateStr}T00:00:00`);
  return {
    localDateStr,
    dayOfWeek: localDate.getDay(), // 0 = Sunday, 6 = Saturday
  };
}

function getUtcDate(dateStr: string, timeStr: string, timeZone: string): Date {
  const date = new Date(`${dateStr}T${timeStr}:00Z`);
  const loc = new Date(date.toLocaleString("en-US", { timeZone }));
  const diff = loc.getTime() - date.getTime();
  return new Date(date.getTime() - diff);
}

/**
 * Computes available booking slots for a service on a given date.
 */
export async function getAvailableSlots(
  businessId: string,
  serviceId: string,
  date: Date
): Promise<AvailableSlot[]> {
  const supabase = await createClient();

  // 1. Fetch business and service configuration
  const { data: business } = await supabase
    .from("businesses")
    .select("timezone")
    .eq("id", businessId)
    .single();

  const { data: service } = await supabase
    .from("services")
    .select("*, staff_members(id, active)")
    .eq("id", serviceId)
    .single();

  if (!business || !service || !service.active) {
    return [];
  }

  // Find local date parts in business timezone
  const { localDateStr, dayOfWeek } = getLocalDateParts(date, business.timezone);

  // 2. Fetch business operating hours for this day of week
  const { data: operatingHour } = await supabase
    .from("operating_hours")
    .select("*")
    .eq("business_id", businessId)
    .eq("day_of_week", dayOfWeek)
    .single();

  if (!operatingHour || operatingHour.is_closed || !operatingHour.open_time || !operatingHour.close_time) {
    return [];
  }

  // Convert local open/close times to absolute UTC dates
  const startUtc = getUtcDate(localDateStr, operatingHour.open_time, business.timezone);
  const endUtc = getUtcDate(localDateStr, operatingHour.close_time, business.timezone);

  // 3. Determine the list of staff members we need to check
  let staffList: Array<{ id: string; name: string; calendar_connected: boolean }> = [];

  if (service.staff_id) {
    // Check if the assigned staff member is active
    const { data: staffMember } = await supabase
      .from("staff_members")
      .select("id, name, calendar_connected")
      .eq("id", service.staff_id)
      .eq("active", true)
      .single();

    if (staffMember) {
      staffList = [staffMember];
    }
  } else {
    // Retrieve all active staff members for this business
    const { data: activeStaff } = await supabase
      .from("staff_members")
      .select("id, name, calendar_connected")
      .eq("business_id", businessId)
      .eq("active", true);

    if (activeStaff) {
      staffList = activeStaff;
    }
  }

  if (staffList.length === 0) {
    return [];
  }

  // 4. Fetch all existing active appointments on this day
  // (Filter out cancelled status)
  const dayStart = new Date(startUtc.getTime() - 12 * 60 * 60 * 1000); // 12h padding
  const dayEnd = new Date(endUtc.getTime() + 12 * 60 * 60 * 1000);

  const { data: appointments } = await supabase
    .from("appointments")
    .select("*, services(buffer_before_minutes, buffer_after_minutes)")
    .eq("business_id", businessId)
    .neq("status", "cancelled")
    .gte("start_at", dayStart.toISOString())
    .lte("start_at", dayEnd.toISOString());

  const activeAppointments = appointments || [];

  // 4b. Fetch Google Calendar busy periods for connected staff
  const staffBusyMap = new Map<string, Array<{ start: number; end: number }>>();

  await Promise.all(
    staffList
      .filter((s) => s.calendar_connected)
      .map(async (staff) => {
        try {
          const busy = await getGoogleBusyPeriods(staff.id, startUtc, endUtc);
          staffBusyMap.set(
            staff.id,
            busy.map((b) => ({
              start: b.start.getTime(),
              end: b.end.getTime(),
            }))
          );
        } catch (err) {
          console.error(`Failed to fetch Google Calendar busy periods for staff ${staff.id}:`, err);
        }
      })
  );

  // 5. Generate candidate slots and test availability
  const availableSlots: AvailableSlot[] = [];
  const serviceDurationMs = service.duration_minutes * 60 * 1000;
  const newBufferBefore = service.buffer_before_minutes * 60 * 1000;
  const newBufferAfter = service.buffer_after_minutes * 60 * 1000;

  // We check candidates starting at 30 minute steps
  const slotIntervalMs = 30 * 60 * 1000;
  let candidateTime = startUtc.getTime();

  while (candidateTime + serviceDurationMs <= endUtc.getTime()) {
    const slotStart = new Date(candidateTime);
    const slotEnd = new Date(candidateTime + serviceDurationMs);

    // Skip past slots
    if (slotStart.getTime() > Date.now()) {
      // Find the first staff member available for this slot
      let availableStaffId: string | null = null;

      for (const staff of staffList) {
        let isOverlapping = false;

        // Check if there is an overlap with existing appointments for this staff member
        const staffAppts = activeAppointments.filter((a) => a.staff_id === staff.id);

        for (const appt of staffAppts) {
          const apptStart = new Date(appt.start_at).getTime();
          const apptEnd = new Date(appt.end_at).getTime();

          const apptService = appt.services as any;
          const apptBufferBefore = (apptService?.buffer_before_minutes || 0) * 60 * 1000;
          const apptBufferAfter = (apptService?.buffer_after_minutes || 0) * 60 * 1000;

          // Blocked window for new booking
          const newBlockStart = slotStart.getTime() - newBufferBefore;
          const newBlockEnd = slotEnd.getTime() + newBufferAfter;

          // Blocked window for existing booking
          const apptBlockStart = apptStart - apptBufferBefore;
          const apptBlockEnd = apptEnd + apptBufferAfter;

          // Overlap check
          if (Math.max(newBlockStart, apptBlockStart) < Math.min(newBlockEnd, apptBlockEnd)) {
            isOverlapping = true;
            break;
          }
        }

        // Check if there is an overlap with Google Calendar busy periods
        if (!isOverlapping) {
          const staffBusy = staffBusyMap.get(staff.id) || [];
          for (const busy of staffBusy) {
            // Blocked window for new booking
            const newBlockStart = slotStart.getTime() - newBufferBefore;
            const newBlockEnd = slotEnd.getTime() + newBufferAfter;

            // Overlap check
            if (Math.max(newBlockStart, busy.start) < Math.min(newBlockEnd, busy.end)) {
              isOverlapping = true;
              break;
            }
          }
        }

        if (!isOverlapping) {
          availableStaffId = staff.id;
          break; // Found an available staff member!
        }
      }

      if (availableStaffId) {
        availableSlots.push({
          startAt: slotStart,
          endAt: slotEnd,
          staffId: availableStaffId,
        });
      }
    }

    candidateTime += slotIntervalMs;
  }

  // Return the first 5 slots
  return availableSlots.slice(0, 5);
}
