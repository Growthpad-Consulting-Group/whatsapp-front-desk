import { NextResponse, type NextRequest } from "next/server";
import { exchangeOAuthCode } from "@/lib/calendar/google";
import { createAdminClient } from "@/lib/supabase/server";
import { encryptText } from "@/lib/crypto/encrypt";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const staffId = searchParams.get("state"); // passed as state during redirect
  const errorMsg = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const targetRedirectUrl = new URL("/settings/staff", appUrl);

  if (errorMsg) {
    targetRedirectUrl.searchParams.set("error", `Google OAuth Error: ${errorMsg}`);
    return NextResponse.redirect(targetRedirectUrl.toString());
  }

  if (!code || !staffId) {
    targetRedirectUrl.searchParams.set("error", "Invalid callback: Missing code or state parameters");
    return NextResponse.redirect(targetRedirectUrl.toString());
  }

  try {
    // 1. Exchange OAuth code for tokens
    const redirectUri = `${appUrl}/api/auth/google/callback`;
    const tokenData = await exchangeOAuthCode(code, redirectUri);

    // Google only sends a refresh token on the first connection (prompt=consent)
    if (!tokenData.refresh_token) {
      // Check if we already have one stored in DB, otherwise throw error
      const supabase = createAdminClient();
      const { data: staff } = await supabase
        .from("staff_members")
        .select("google_refresh_token")
        .eq("id", staffId)
        .single();

      if (!staff?.google_refresh_token) {
        throw new Error("No refresh token returned by Google, and no existing token found in database. Try disconnecting and reconnecting.");
      }
    }

    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

    // 2. Save tokens to DB (Encrypted at rest)
    const supabase = createAdminClient();
    const { error: updateError } = await supabase
      .from("staff_members")
      .update({
        google_access_token: encryptText(tokenData.access_token),
        google_token_expires_at: expiresAt,
        calendar_connected: true,
        ...(tokenData.refresh_token ? { google_refresh_token: encryptText(tokenData.refresh_token) } : {}),
      })
      .eq("id", staffId);

    if (updateError) {
      throw new Error(`Database error saving tokens: ${updateError.message}`);
    }

    targetRedirectUrl.searchParams.set("success", "calendar-connected");
    return NextResponse.redirect(targetRedirectUrl.toString());
  } catch (err: any) {
    console.error("[Google OAuth Callback Error]:", err.message);
    targetRedirectUrl.searchParams.set("error", err.message || "Failed to authenticate Google Calendar connection");
    return NextResponse.redirect(targetRedirectUrl.toString());
  }
}
