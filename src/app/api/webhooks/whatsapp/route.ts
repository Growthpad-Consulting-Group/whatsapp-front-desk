import { NextResponse, type NextRequest } from "next/server";

/**
 * WhatsApp Cloud API webhook.
 *
 * GET  — verification handshake (Meta sends hub.challenge)
 * POST — incoming messages and status updates
 */

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
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // TODO: validate X-Hub-Signature-256 header
  // TODO: parse entry[].changes[].value and route to conversation state machine

  console.log("[whatsapp webhook]", JSON.stringify(body, null, 2));

  // Always return 200 quickly — Meta will retry on non-200
  return NextResponse.json({ received: true }, { status: 200 });
}
