import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");

    if (!staffId) {
      return new Response("Missing staffId parameter", { status: 400 });
    }

    // 1. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // 2. Verify staff member belongs to the same business as the user
    // First find the logged in user's staff member record
    const { data: currentUserStaff } = await supabase
      .from("staff_members")
      .select("business_id, role")
      .eq("user_id", user.id)
      .eq("active", true)
      .single();

    if (!currentUserStaff) {
      return new Response("Staff record not found for logged in user", { status: 403 });
    }

    // If they aren't an owner, they can only connect their own calendar
    const { data: targetStaff } = await supabase
      .from("staff_members")
      .select("id, user_id, business_id")
      .eq("id", staffId)
      .single();

    if (!targetStaff) {
      return new Response("Target staff member not found", { status: 404 });
    }

    if (targetStaff.business_id !== currentUserStaff.business_id) {
      return new Response("Forbidden: Cross-business operation", { status: 403 });
    }

    if (currentUserStaff.role !== "owner" && targetStaff.user_id !== user.id) {
      return new Response("Forbidden: Standard staff members can only connect their own calendar", { status: 403 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return new Response("Google OAuth is not configured. GOOGLE_CLIENT_ID is missing.", { status: 500 });
    }

    // 3. Construct OAuth URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const redirectUri = `${appUrl}/api/auth/google/callback`;
    const scope = "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly";

    const oauthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    oauthUrl.searchParams.set("client_id", clientId);
    oauthUrl.searchParams.set("redirect_uri", redirectUri);
    oauthUrl.searchParams.set("response_type", "code");
    oauthUrl.searchParams.set("scope", scope);
    oauthUrl.searchParams.set("access_type", "offline");
    oauthUrl.searchParams.set("prompt", "consent");
    oauthUrl.searchParams.set("state", staffId);

    return NextResponse.redirect(oauthUrl.toString());
  } catch (err: any) {
    console.error("[Google Redirect Route Error]:", err.message);
    return new Response(err.message || "An unexpected error occurred", { status: 500 });
  }
}
