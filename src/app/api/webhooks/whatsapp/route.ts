import { NextResponse, type NextRequest } from "next/server";
import { verifyWhatsAppSignature } from "@/lib/whatsapp/crypto";
import { handleWhatsAppMessage } from "@/lib/whatsapp/state-machine";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
  ) {
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("X-Hub-Signature-256");

  // 1. Verify Meta signature
  const isValid = await verifyWhatsAppSignature(rawBody, signature);
  if (!isValid) {
    return new Response("Unauthorized Signature", { status: 401 });
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Check if this is a standard status update or messages payload
  const value = body.entry?.[0]?.changes?.[0]?.value;
  if (!value) {
    return NextResponse.json({ received: true });
  }

  const supabase = await createClient();

  // 2. Handle Status Updates (sent, delivered, read)
  if (value.statuses) {
    for (const statusObj of value.statuses) {
      const { id: providerMessageId, status } = statusObj;
      await supabase
        .from("message_logs")
        .update({ status: status as any })
        .eq("provider_message_id", providerMessageId);
    }
  }

  // 3. Handle Inbound Messages
  if (value.messages) {
    const phoneNumberId = value.metadata?.phone_number_id;
    if (!phoneNumberId) {
      return NextResponse.json({ received: true });
    }

    // Resolve business by matching phone_number_id (stored via Settings > Connections)
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("whatsapp_phone_number_id", phoneNumberId)
      .single();

    if (!business) {
      console.warn(`[webhook] Received message for unknown phone_number_id: ${phoneNumberId}`);
      // Return 200 to keep Meta happy
      return NextResponse.json({ received: true });
    }

    const contactName = value.contacts?.[0]?.profile?.name || "Client";

    for (const msg of value.messages) {
      const fromPhone = msg.from; // Customer phone (e.g. "254712345678")
      
      // Get message text depending on type (text, interactive etc.)
      let messageText = "";
      if (msg.type === "text" && msg.text?.body) {
        messageText = msg.text.body;
      } else if (msg.type === "interactive" && msg.interactive?.button_reply?.title) {
        messageText = msg.interactive.button_reply.title;
      } else if (msg.type === "button" && msg.button?.text) {
        messageText = msg.button.text;
      }

      if (!messageText) continue;

      try {
        // Run state machine processor
        // We prepend '+' to fromPhone if it's missing to standardize on E.164 formats in our DB
        const cleanFrom = fromPhone.startsWith("+") ? fromPhone : `+${fromPhone}`;
        await handleWhatsAppMessage(business.id, cleanFrom, messageText, contactName);
      } catch (err: any) {
        console.error(`Error processing message ${msg.id}:`, err.message);
      }
    }
  }

  return NextResponse.json({ received: true });
}
