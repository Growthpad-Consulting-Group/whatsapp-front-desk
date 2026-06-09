import { createAdminClient } from "@/lib/supabase/server";
import { encryptText, decryptText } from "@/lib/crypto/encrypt";

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
}

interface BusyPeriod {
  start: Date;
  end: Date;
}

/**
 * Exchange an OAuth authorization code for Google access and refresh tokens.
 */
export async function exchangeOAuthCode(code: string, redirectUri: string): Promise<GoogleTokenResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not configured in environment variables.");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google token exchange failed: ${res.status} - ${errText}`);
  }

  return res.json();
}

/**
 * Refresh a Google access token using the stored refresh token.
 */
export async function refreshGoogleTokens(staffId: string, refreshToken: string): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not configured in environment variables.");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google token refresh failed: ${res.status} - ${errText}`);
  }

  const data: GoogleTokenResponse = await res.json();
  const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

  // Update tokens in DB using admin client to bypass RLS in background jobs
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("staff_members")
    .update({
      google_access_token: encryptText(data.access_token),
      google_token_expires_at: expiresAt,
      // If a new refresh token is returned, update it too
      ...(data.refresh_token ? { google_refresh_token: encryptText(data.refresh_token) } : {}),
      calendar_connected: true,
    })
    .eq("id", staffId);

  if (error) {
    console.error(`[Google OAuth] Failed to save refreshed tokens for staff ${staffId}:`, error.message);
  }

  return data.access_token;
}

/**
 * Returns a valid, non-expired Google access token for a staff member.
 * Refreshes the token automatically if it has expired.
 */
export async function getValidGoogleToken(staffId: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data: staff, error } = await supabase
    .from("staff_members")
    .select("google_access_token, google_refresh_token, google_token_expires_at, calendar_connected")
    .eq("id", staffId)
    .single();

  if (error || !staff || !staff.calendar_connected) {
    return null;
  }

  const { google_access_token, google_refresh_token, google_token_expires_at } = staff;
  if (!google_access_token || !google_refresh_token) {
    return null;
  }

  const decryptedAccessToken = decryptText(google_access_token);
  const decryptedRefreshToken = decryptText(google_refresh_token);

  // Check if token is expired or expires in the next 5 minutes
  const expiryTime = google_token_expires_at ? new Date(google_token_expires_at).getTime() : 0;
  const isExpired = expiryTime - 5 * 60 * 1000 < Date.now();

  if (isExpired) {
    try {
      return await refreshGoogleTokens(staffId, decryptedRefreshToken);
    } catch (err: any) {
      console.error(`[Google Calendar] Auto token refresh failed for staff member ${staffId}:`, err.message);
      return null;
    }
  }

  return decryptedAccessToken;
}

/**
 * Creates an event in the staff member's Google Calendar.
 * Returns the Google event ID.
 */
export async function createGoogleEvent(
  staffId: string,
  appointmentId: string,
  startAt: string,
  endAt: string,
  customerName: string,
  serviceName: string
): Promise<string | null> {
  const token = await getValidGoogleToken(staffId);
  if (!token) return null;

  try {
    const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: `${serviceName} - ${customerName}`,
        description: `WhatsApp Front Desk Appointment\nAppointment ID: ${appointmentId}`,
        start: {
          dateTime: startAt,
        },
        end: {
          dateTime: endAt,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[Google Calendar] Create event failed for staff ${staffId}: ${res.status} - ${errText}`);
      return null;
    }

    const data = await res.json();
    return data.id || null;
  } catch (err: any) {
    console.error(`[Google Calendar] Create event error:`, err.message);
    return null;
  }
}

/**
 * Updates an event in the staff member's Google Calendar.
 */
export async function updateGoogleEvent(
  staffId: string,
  googleEventId: string,
  startAt: string,
  endAt: string,
  customerName: string,
  serviceName: string
): Promise<boolean> {
  const token = await getValidGoogleToken(staffId);
  if (!token) return false;

  try {
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: `${serviceName} - ${customerName}`,
        description: `WhatsApp Front Desk Appointment`,
        start: {
          dateTime: startAt,
        },
        end: {
          dateTime: endAt,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[Google Calendar] Update event failed for event ${googleEventId}: ${res.status} - ${errText}`);
      return false;
    }

    return true;
  } catch (err: any) {
    console.error(`[Google Calendar] Update event error:`, err.message);
    return false;
  }
}

/**
 * Deletes an event from the staff member's Google Calendar.
 */
export async function deleteGoogleEvent(staffId: string, googleEventId: string): Promise<boolean> {
  const token = await getValidGoogleToken(staffId);
  if (!token) return false;

  try {
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok && res.status !== 404) {
      const errText = await res.text();
      console.error(`[Google Calendar] Delete event failed for event ${googleEventId}: ${res.status} - ${errText}`);
      return false;
    }

    return true;
  } catch (err: any) {
    console.error(`[Google Calendar] Delete event error:`, err.message);
    return false;
  }
}

/**
 * Queries Google FreeBusy API to fetch busy periods for a staff member.
 */
export async function getGoogleBusyPeriods(staffId: string, start: Date, end: Date): Promise<BusyPeriod[]> {
  const token = await getValidGoogleToken(staffId);
  if (!token) return [];

  try {
    const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        items: [{ id: "primary" }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[Google Calendar] Freebusy query failed for staff ${staffId}: ${res.status} - ${errText}`);
      return [];
    }

    const data = await res.json();
    const busyList = data.calendars?.primary?.busy || [];

    return busyList.map((item: any) => ({
      start: new Date(item.start),
      end: new Date(item.end),
    }));
  } catch (err: any) {
    console.warn(`[Google Calendar] Freebusy query error for staff ${staffId}:`, err.message);
    return [];
  }
}
