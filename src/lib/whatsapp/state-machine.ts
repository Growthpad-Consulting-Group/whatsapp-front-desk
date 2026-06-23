import { createAdminClient } from "@/lib/supabase/server";
import { getAvailableSlots } from "@/lib/availability/engine";
import { createWhatsAppClient } from "./client";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface ConversationContext {
  availableServices?: string[]; // list of active service IDs
  selectedServiceId?: string;
  availableSlots?: Array<{ startAt: string; staffId: string | null }>;
  selectedSlot?: string; // ISO string
  selectedStaffId?: string | null;
  retryCount?: number;
  reschedulingAppointmentId?: string;
}

function formatLocalSlotTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function fillTemplate(body: string, variables: Record<string, string>): string {
  let filled = body;
  for (const [key, val] of Object.entries(variables)) {
    filled = filled.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g"), val);
  }
  return filled;
}

/**
 * Main state machine processor for incoming WhatsApp messages.
 */
export async function handleWhatsAppMessage(
  businessId: string,
  customerPhone: string,
  messageText: string,
  customerProfileName?: string
): Promise<void> {
  const supabase = createAdminClient();
  const text = messageText.trim();

  // 1. Resolve business config
  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .single();

  if (!business) {
    console.error(`Business not found: ${businessId}`);
    return;
  }

  // Per-business WhatsApp client using the tenant's own credentials
  const whatsappClient = createWhatsAppClient(
    business.whatsapp_phone_number_id ?? "",
    business.whatsapp_access_token ?? ""
  );

  // 2. Find or create the customer
  let { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("business_id", businessId)
    .eq("phone", customerPhone)
    .single();

  if (!customer) {
    const { data: newCustomer, error: createError } = await supabase
      .from("customers")
      .insert({
        business_id: businessId,
        phone: customerPhone,
        name: customerProfileName || "Client",
      })
      .select("*")
      .single();

    if (createError) {
      console.error("Failed to create customer:", createError.message);
      return;
    }
    customer = newCustomer;
  }

  // Log the inbound message
  await supabase.from("message_logs").insert({
    business_id: businessId,
    customer_id: customer.id,
    direction: "inbound",
    content_summary: text.substring(0, 100),
    status: "read",
    channel: "whatsapp",
  });

  // 3. Resolve conversation session
  const { data: session } = await supabase
    .from("conversation_sessions")
    .select("*")
    .eq("business_id", businessId)
    .eq("customer_phone", customerPhone)
    .single();

  let state: "idle" | "awaiting_service" | "awaiting_slot" | "awaiting_confirmation" | "awaiting_deposit" | "human_handoff" = "idle";
  let context: ConversationContext = {};

  if (session) {
    const isExpired = new Date(session.expires_at).getTime() < Date.now();
    if (isExpired) {
      // Session expired: Reset to idle and clear context
      state = "idle";
      context = {};
    } else {
      state = session.state as any;
      context = (session.context as ConversationContext) || {};
    }
  }

  // If in human handoff, ignore automatic processing and do nothing
  if (state === "human_handoff") {
    console.log(`Session ${customerPhone} is in human_handoff. Ignoring message.`);
    return;
  }

  let outboundBody = "";
  let nextState:
    | "idle"
    | "awaiting_service"
    | "awaiting_slot"
    | "awaiting_confirmation"
    | "awaiting_deposit"
    | "human_handoff" = state;

  const handleInvalidInput = async (messagePrompt: string) => {
    const retries = (context.retryCount || 0) + 1;
    if (retries >= 3) {
      nextState = "human_handoff";
      context = {};
      outboundBody =
        "Sorry, I am having trouble understanding your selection. I am transferring you to one of our agents who will message you directly. Please wait a moment.";
    } else {
      context.retryCount = retries;
      outboundBody = `I didn't catch that. ${messagePrompt}`;
    }
  };

  // 4. State Machine transitions
  switch (state) {
    case "idle": {
      const normalizedText = text.toUpperCase();
      if (normalizedText === "C" || normalizedText === "R") {
        // Look up next upcoming confirmed or pending appointment
        const { data: upcomingAppt } = await supabase
          .from("appointments")
          .select("*, services(*)")
          .eq("business_id", businessId)
          .eq("customer_id", customer.id)
          .in("status", ["confirmed", "pending"])
          .gte("start_at", new Date().toISOString())
          .order("start_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (!upcomingAppt) {
          outboundBody = "You do not have any upcoming appointments. ";
          // Proceed to show service list
          const { data: services } = await supabase
            .from("services")
            .select("id, name, price, duration_minutes")
            .eq("business_id", businessId)
            .eq("active", true)
            .order("name");

          if (!services || services.length === 0) {
            outboundBody += `Thank you for messaging ${business.name}. We currently do not have any services set up for bookings.`;
            nextState = "idle";
          } else {
            context.availableServices = services.map((s) => s.id);
            context.retryCount = 0;
            nextState = "awaiting_service";

            const serviceList = services
              .map(
                (s, index) =>
                  `${index + 1}. *${s.name}* (${s.duration_minutes} mins · ${formatCurrency(
                    Number(s.price),
                    business.currency
                  )})`
              )
              .join("\n");

            outboundBody += `If you'd like to make a new booking, please reply with the service number:\n\n${serviceList}`;
          }
          break;
        }

        const apptService = upcomingAppt.services as any;
        const formattedTime = formatLocalSlotTime(new Date(upcomingAppt.start_at), business.timezone);

        if (normalizedText === "C") {
          const timeDiffHours = (new Date(upcomingAppt.start_at).getTime() - Date.now()) / (1000 * 60 * 60);
          if (timeDiffHours < business.cancellation_hours) {
            outboundBody = `Sorry, you cannot cancel this appointment for *${apptService.name}* on *${formattedTime}* because it is within our ${business.cancellation_hours} hour cancellation window. Please contact us directly if you need assistance.`;
            nextState = "idle";
            context = {};
          } else {
            const { error: cancelError } = await supabase
              .from("appointments")
              .update({ status: "cancelled" })
              .eq("id", upcomingAppt.id);

            if (cancelError) {
              outboundBody = "We encountered an error cancelling your appointment. Please try again later.";
            } else {
              if (upcomingAppt.staff_id && upcomingAppt.google_event_id) {
                try {
                  const { deleteGoogleEvent } = await import("@/lib/calendar/google");
                  await deleteGoogleEvent(upcomingAppt.staff_id, upcomingAppt.google_event_id);
                } catch (err: any) {
                  console.error("[Google Calendar] Failed to delete event on cancellation:", err.message);
                }
              }
              outboundBody = `Your appointment for *${apptService.name}* on *${formattedTime}* has been successfully cancelled.`;
            }
            nextState = "idle";
            context = {};
          }
        } else if (normalizedText === "R") {
          const timeDiffHours = (new Date(upcomingAppt.start_at).getTime() - Date.now()) / (1000 * 60 * 60);
          if (timeDiffHours < business.cancellation_hours) {
            outboundBody = `Sorry, you cannot reschedule this appointment for *${apptService.name}* on *${formattedTime}* because it is within our ${business.cancellation_hours} hour cancellation window. Please contact us directly if you need assistance.`;
            nextState = "idle";
            context = {};
          } else {
            context.reschedulingAppointmentId = upcomingAppt.id;
            context.selectedServiceId = upcomingAppt.service_id;
            context.retryCount = 0;

            let foundSlots: any[] = [];
            let scanDate = new Date();
            for (let i = 1; i <= 7; i++) {
              scanDate = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
              const slots = await getAvailableSlots(businessId, upcomingAppt.service_id, scanDate);
              if (slots.length > 0) {
                foundSlots = slots;
                break;
              }
            }

            if (foundSlots.length === 0) {
              outboundBody = "We apologize, but there are no available slots for this service in the next 7 days. Transferring you to our staff.";
              nextState = "human_handoff";
              context = {};
            } else {
              context.availableSlots = foundSlots.map((s) => ({
                startAt: s.startAt.toISOString(),
                staffId: s.staffId,
              }));
              nextState = "awaiting_slot";

              const slotList = foundSlots
                .map((s, index) => `${index + 1}. ${formatLocalSlotTime(s.startAt, business.timezone)}`)
                .join("\n");

              outboundBody = `Sure, let's reschedule your appointment for *${apptService.name}* (originally on ${formattedTime}).\n\nReply with the number of the new slot you prefer:\n\n${slotList}`;
            }
          }
        }
      } else {
        // Load active services
        const { data: services } = await supabase
          .from("services")
          .select("id, name, price, duration_minutes")
          .eq("business_id", businessId)
          .eq("active", true)
          .order("name");

        if (!services || services.length === 0) {
          outboundBody = `Hello! Thank you for messaging ${business.name}. We currently do not have any services set up for bookings. Please try again later.`;
          nextState = "idle";
        } else {
          context.availableServices = services.map((s) => s.id);
          context.retryCount = 0;
          nextState = "awaiting_service";

          const serviceList = services
            .map(
              (s, index) =>
                `${index + 1}. *${s.name}* (${s.duration_minutes} mins · ${formatCurrency(
                  Number(s.price),
                  business.currency
                )})`
            )
            .join("\n");

          const botName: string = (business as any).bot_name || "Front Desk";
          const botTone: string = (business as any).bot_tone || "warm";
          const servicePrompt = "Please reply with the number of the service you'd like to book:";

          if (botTone === "professional") {
            outboundBody = `Good day, ${customer.name}. Thank you for contacting *${business.name}*.\n\n${servicePrompt}\n\n${serviceList}`;
          } else if (botTone === "casual") {
            outboundBody = `Hey ${customer.name}! 👋 You've reached *${business.name}* — let's get you sorted!\n\nPick a service:\n\n${serviceList}`;
          } else {
            outboundBody = `Hi ${customer.name}! Welcome to *${business.name}* 🗓️\n\nI'm ${botName}, your virtual booking assistant. ${servicePrompt}\n\n${serviceList}`;
          }
        }
      }
      break;
    }

    case "awaiting_service": {
      const idx = parseInt(text) - 1;
      const servicesCount = context.availableServices?.length || 0;

      if (isNaN(idx) || idx < 0 || idx >= servicesCount) {
        await handleInvalidInput(
          `Please reply with a number from 1 to ${servicesCount} to pick a service.`
        );
      } else {
        const selectedServiceId = context.availableServices![idx];
        context.selectedServiceId = selectedServiceId;
        context.retryCount = 0;

        // Query available slots. Scan upcoming 7 days starting tomorrow
        let foundSlots: any[] = [];
        let scanDate = new Date();

        for (let i = 1; i <= 7; i++) {
          scanDate = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
          const slots = await getAvailableSlots(businessId, selectedServiceId, scanDate);
          if (slots.length > 0) {
            foundSlots = slots;
            break;
          }
        }

        if (foundSlots.length === 0) {
          outboundBody =
            "We apologize, but there are no available slots for this service in the next 7 days. I am transferring you to our staff to help find a booking for you.";
          nextState = "human_handoff";
          context = {};
        } else {
          context.availableSlots = foundSlots.map((s) => ({
            startAt: s.startAt.toISOString(),
            staffId: s.staffId,
          }));
          nextState = "awaiting_slot";

          const slotList = foundSlots
            .map((s, index) => `${index + 1}. ${formatLocalSlotTime(s.startAt, business.timezone)}`)
            .join("\n");

          outboundBody = `We found these upcoming slots. Reply with the number of the slot you prefer:\n\n${slotList}`;
        }
      }
      break;
    }

    case "awaiting_slot": {
      const idx = parseInt(text) - 1;
      const slotsCount = context.availableSlots?.length || 0;

      if (isNaN(idx) || idx < 0 || idx >= slotsCount) {
        await handleInvalidInput(
          `Please reply with a number from 1 to ${slotsCount} to choose a time.`
        );
      } else {
        const selectedSlot = context.availableSlots![idx];
        context.selectedSlot = selectedSlot.startAt;
        context.selectedStaffId = selectedSlot.staffId;
        context.retryCount = 0;
        nextState = "awaiting_confirmation";

        // Fetch service details for summary
        const { data: service } = await supabase
          .from("services")
          .select("name")
          .eq("id", context.selectedServiceId!)
          .single();

        const formattedTime = formatLocalSlotTime(new Date(selectedSlot.startAt), business.timezone);
        if (context.reschedulingAppointmentId) {
          outboundBody = `Confirm rescheduling your appointment for *${service?.name}* to *${formattedTime}*?\n\nReply:\n*1.* Confirm Reschedule\n*2.* Cancel & keep original appointment`;
        } else {
          outboundBody = `Confirm your booking for *${service?.name}* on *${formattedTime}*?\n\nReply:\n*1.* Confirm\n*2.* Cancel & start over`;
        }
      }
      break;
    }

    case "awaiting_confirmation": {
      if (text === "1") {
        // Double check slot availability again
        const slotDate = new Date(context.selectedSlot!);
        const currentSlots = await getAvailableSlots(
          businessId,
          context.selectedServiceId!,
          slotDate
        );

        const slotStillFree = currentSlots.some(
          (s) =>
            s.startAt.getTime() === slotDate.getTime() &&
            s.staffId === context.selectedStaffId
        );

        if (!slotStillFree) {
          // Reset back to slot selection
          outboundBody =
            "Oh no! That slot was just booked by another customer. Please choose a different slot:";
          
          let foundSlots: any[] = [];
          let scanDate = new Date();
          for (let i = 1; i <= 7; i++) {
            scanDate = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
            const slots = await getAvailableSlots(businessId, context.selectedServiceId!, scanDate);
            if (slots.length > 0) {
              foundSlots = slots;
              break;
            }
          }

          if (foundSlots.length === 0) {
            outboundBody =
              "We apologize, but there are no other slots available. Transferring you to our support staff.";
            nextState = "human_handoff";
            context = {};
          } else {
            context.availableSlots = foundSlots.map((s) => ({
              startAt: s.startAt.toISOString(),
              staffId: s.staffId,
            }));
            nextState = "awaiting_slot";
            const slotList = foundSlots
              .map((s, index) => `${index + 1}. ${formatLocalSlotTime(s.startAt, business.timezone)}`)
              .join("\n");
            outboundBody += `\n\n${slotList}`;
          }
        } else {
          // Calculate start & end times
          const { data: service } = await supabase
            .from("services")
            .select("*")
            .eq("id", context.selectedServiceId!)
            .single();

          if (!service) {
            outboundBody = "Sorry, that service is no longer available. Reply with anything to start over.";
            nextState = "idle";
            context = {};
            break;
          }

          const startAt = new Date(context.selectedSlot!);
          const endAt = new Date(startAt.getTime() + service.duration_minutes * 60 * 1000);

          if (context.reschedulingAppointmentId) {
            const apptId = context.reschedulingAppointmentId;
            const { data: oldAppt } = await supabase
              .from("appointments")
              .select("*, services(*)")
              .eq("id", apptId)
              .single();

            if (!oldAppt) {
              outboundBody = "Sorry, we could not find your original appointment. Please start over.";
              nextState = "idle";
              context = {};
              break;
            }

            const { data: appt, error: updateError } = await supabase
              .from("appointments")
              .update({
                staff_id: context.selectedStaffId || null,
                start_at: startAt.toISOString(),
                end_at: endAt.toISOString(),
                status: "confirmed",
              })
              .eq("id", apptId)
              .select("*")
              .single();

            if (updateError) {
              console.error("Failed to update appointment on reschedule:", updateError.message);
              outboundBody = "Sorry, we ran into an error updating your appointment. Please try again shortly.";
              nextState = "idle";
              context = {};
            } else {
              // Update Google Calendar event!
              if (appt.staff_id) {
                try {
                  const { createGoogleEvent, updateGoogleEvent, deleteGoogleEvent } = await import("@/lib/calendar/google");
                  
                  if (oldAppt.staff_id !== appt.staff_id && oldAppt.staff_id && oldAppt.google_event_id) {
                    await deleteGoogleEvent(oldAppt.staff_id, oldAppt.google_event_id);
                    const googleEventId = await createGoogleEvent(
                      appt.staff_id,
                      appt.id,
                      appt.start_at,
                      appt.end_at,
                      customer.name,
                      service.name
                    );
                    await supabase
                      .from("appointments")
                      .update({ google_event_id: googleEventId })
                      .eq("id", appt.id);
                  } else if (appt.google_event_id) {
                    await updateGoogleEvent(
                      appt.staff_id,
                      appt.google_event_id,
                      appt.start_at,
                      appt.end_at,
                      customer.name,
                      service.name
                    );
                  } else {
                    const googleEventId = await createGoogleEvent(
                      appt.staff_id,
                      appt.id,
                      appt.start_at,
                      appt.end_at,
                      customer.name,
                      service.name
                    );
                    await supabase
                      .from("appointments")
                      .update({ google_event_id: googleEventId })
                      .eq("id", appt.id);
                  }
                } catch (err: any) {
                  console.error("[Google Calendar] Failed to sync reschedule event:", err.message);
                }
              }

              const formattedTime = formatLocalSlotTime(startAt, business.timezone);
              outboundBody = `Your appointment for *${service.name}* has been successfully rescheduled to *${formattedTime}*. — ${business.name}`;
              nextState = "idle";
              context = {};
            }
          } else {
            const isDepositRequired =
              service.deposit_required ||
              (business.deposit_default_percent !== null && business.deposit_default_percent > 0);

            let depositAmount = 0;
            if (isDepositRequired) {
              if (service.deposit_amount) {
                depositAmount = Number(service.deposit_amount);
              } else if (business.deposit_default_percent) {
                depositAmount = (Number(service.price) * Number(business.deposit_default_percent)) / 100;
              }
            }

            // Insert appointment
            const { data: appt, error: apptError } = await supabase
              .from("appointments")
              .insert({
                business_id: businessId,
                customer_id: customer.id,
                service_id: context.selectedServiceId!,
                staff_id: context.selectedStaffId || null,
                start_at: startAt.toISOString(),
                end_at: endAt.toISOString(),
                status: isDepositRequired ? "pending" : "confirmed",
                payment_status: isDepositRequired ? "deposit_pending" : "unpaid",
                source: "whatsapp",
              })
              .select("*")
              .single();

            if (apptError) {
              console.error("Failed to insert appointment:", apptError.message);
              outboundBody =
                "Sorry, we ran into an error booking your appointment. Please try again shortly.";
              nextState = "idle";
              context = {};
            } else {
              if (isDepositRequired) {
                // Create payment request / hold link
                const paymentLink = `${process.env.NEXT_PUBLIC_APP_URL}/pay/deposit/${appt.id}`;
                
                // Load template
                const { data: template } = await supabase
                  .from("message_templates")
                  .select("body")
                  .eq("business_id", businessId)
                  .eq("type", "deposit_request")
                  .single();

                const templateBody =
                  template?.body ||
                  "Hi {{customer_name}}, to secure your booking for *{{service_name}}* on {{date}} at {{time}}, please pay the deposit of *{{amount}}* here: {{payment_link}} — {{business_name}}";

                outboundBody = fillTemplate(templateBody, {
                  customer_name: customer.name,
                  service_name: service.name,
                  date: startAt.toLocaleDateString("en-GB", { timeZone: business.timezone }),
                  time: startAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: business.timezone }),
                  amount: formatCurrency(depositAmount, business.currency),
                  payment_link: paymentLink,
                  business_name: business.name,
                });

                nextState = "awaiting_deposit";
                context = {};
              } else {
                // Trigger Google Calendar event creation on immediate confirmation
                if (appt.staff_id) {
                  try {
                    const { createGoogleEvent } = await import("@/lib/calendar/google");
                    const googleEventId = await createGoogleEvent(
                      appt.staff_id,
                      appt.id,
                      appt.start_at,
                      appt.end_at,
                      customer.name,
                      service.name
                    );
                    if (googleEventId) {
                      await supabase
                        .from("appointments")
                        .update({ google_event_id: googleEventId })
                        .eq("id", appt.id);
                    }
                  } catch (err: any) {
                    console.error("[Google Calendar] Failed to create event on confirmation:", err.message);
                  }
                }

                // Get confirmation template
                const { data: template } = await supabase
                  .from("message_templates")
                  .select("body")
                  .eq("business_id", businessId)
                  .eq("type", "booking_confirmed")
                  .single();

                const templateBody =
                  template?.body ||
                  "Hi {{customer_name}}! Your booking for *{{service_name}}* is confirmed for {{date}} at {{time}}. Reply *R* to reschedule or *C* to cancel. — {{business_name}}";

                outboundBody = fillTemplate(templateBody, {
                  customer_name: customer.name,
                  service_name: service.name,
                  date: startAt.toLocaleDateString("en-GB", { timeZone: business.timezone }),
                  time: startAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: business.timezone }),
                  business_name: business.name,
                });

                // Upsell: suggest other active services the customer hasn't booked this session
                try {
                  const { data: otherServices } = await supabase
                    .from("services")
                    .select("name, price")
                    .eq("business_id", businessId)
                    .eq("active", true)
                    .neq("id", context.selectedServiceId!)
                    .limit(3);

                  if (otherServices && otherServices.length > 0) {
                    const suggestions = otherServices
                      .map((s: { name: string; price: number }, i: number) => `*${i + 1}.* ${s.name} — ${formatCurrency(Number(s.price), business.currency)}`)
                      .join("\n");
                    outboundBody += `\n\n💆 *Would you like to add another service?*\n${suggestions}\n\nReply with a number to book, or anything else to skip.`;
                    nextState = "awaiting_service";
                    context = {};
                  }
                } catch {
                  // Upsell is non-critical — don't block the confirmation
                }

                if (nextState !== "awaiting_service") {
                  nextState = "idle";
                  context = {};
                }
              }
            }
          }
        }
      } else if (text === "2") {
        if (context.reschedulingAppointmentId) {
          outboundBody = "Rescheduling cancelled. Your original booking remains unchanged. Reply with anything to return to menu.";
        } else {
          outboundBody = "Booking cancelled. Reply with anything to start a new booking.";
        }
        nextState = "idle";
        context = {};
      } else {
        if (context.reschedulingAppointmentId) {
          outboundBody = "Please reply with *1* to confirm rescheduling your appointment, or *2* to cancel & keep original appointment.";
        } else {
          outboundBody = "Please reply with *1* to confirm your booking, or *2* to cancel & start over.";
        }
      }
      break;
    }

    case "awaiting_deposit": {
      outboundBody =
        "Your appointment booking is pending deposit. Please pay the deposit using the link to secure your slot.";
      break;
    }
  }

  // 5. Update session row
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes expiration
  
  const { error: sessionError } = await supabase
    .from("conversation_sessions")
    .upsert(
      {
        business_id: businessId,
        customer_phone: customerPhone,
        state: nextState,
        context: context as any,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "business_id,customer_phone",
      }
    );

  if (sessionError) {
    console.error("Session upsert failed:", sessionError.message);
  }

  // 6. Send the outbound message
  if (outboundBody) {
    try {
      const { messageId } = await whatsappClient.sendText(customerPhone, outboundBody);

      // Log outbound message to database logs
      await supabase.from("message_logs").insert({
        business_id: businessId,
        customer_id: customer.id,
        direction: "outbound",
        content_summary: outboundBody.substring(0, 100),
        status: "sent",
        channel: "whatsapp",
        provider_message_id: messageId,
      });
    } catch (err: any) {
      console.error("Failed to send WhatsApp response message:", err.message);
    }
  }
}
