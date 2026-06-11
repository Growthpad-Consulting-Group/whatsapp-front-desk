"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireBusiness } from "@/lib/data/business";
import { StaffSchema } from "@/lib/validations/settings";
import type { ActionResult } from "@/types";

export async function createStaffAction(
  rawInput: any
): Promise<ActionResult<string>> {
  try {
    const { business, staff } = await requireBusiness();

    if (staff.role !== "owner") {
      return { success: false, error: "Only the business owner can manage staff members." };
    }

    const parsed = StaffSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const adminClient = createAdminClient();

    // Check if an auth account already exists for this email
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingAuthUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === parsed.data.email.toLowerCase()
    );

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("staff_members")
      .insert({
        business_id: business.id,
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        role: parsed.data.role,
        active: parsed.data.active,
        calendar_connected: false,
        // Link immediately if auth account already exists
        user_id: existingAuthUser?.id ?? null,
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Send invite only if no auth account exists yet
    if (!existingAuthUser) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
      await adminClient.auth.admin.inviteUserByEmail(parsed.data.email, {
        redirectTo: `${appUrl}/auth/accept-invite`,
        data: {
          staff_member_id: data.id,
          business_id: business.id,
          full_name: parsed.data.name,
        },
      });
    }

    revalidatePath("/settings");
    revalidatePath("/settings/staff");
    return { success: true, data: data.id };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function resendStaffInviteAction(
  staffId: string
): Promise<ActionResult> {
  try {
    const { business, staff } = await requireBusiness();
    if (staff.role !== "owner") {
      return { success: false, error: "Only the business owner can resend invites." };
    }

    const supabase = await createClient();
    const { data: member } = await supabase
      .from("staff_members")
      .select("id, email, name, user_id")
      .eq("id", staffId)
      .eq("business_id", business.id)
      .single();

    if (!member) return { success: false, error: "Staff member not found." };
    if (member.user_id) return { success: false, error: "This staff member already has an active account." };

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const adminClient = createAdminClient();

    // Delete the stale unconfirmed auth user so inviteUserByEmail can create a fresh one.
    // Safe because user_id is null — no password was ever set, nothing to lose.
    const { data: allUsers } = await adminClient.auth.admin.listUsers();
    const staleAuthUser = allUsers?.users?.find(
      (u) => u.email?.toLowerCase() === member.email.toLowerCase()
    );
    if (staleAuthUser) {
      await adminClient.auth.admin.deleteUser(staleAuthUser.id);
    }

    const { error } = await adminClient.auth.admin.inviteUserByEmail(member.email, {
      redirectTo: `${appUrl}/auth/accept-invite`,
      data: { staff_member_id: member.id, business_id: business.id, full_name: member.name },
    });

    if (error) return { success: false, error: error.message };
    return { success: true, data: undefined };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function updateStaffAction(
  id: string,
  rawInput: any
): Promise<ActionResult> {
  try {
    const { business, staff } = await requireBusiness();

    if (staff.role !== "owner") {
      return { success: false, error: "Only the business owner can manage staff members." };
    }

    const parsed = StaffSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("staff_members")
      .update({
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        role: parsed.data.role,
        active: parsed.data.active,
      })
      .eq("id", id)
      .eq("business_id", business.id); // defence-in-depth

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/settings");
    revalidatePath("/settings/staff");
    return { success: true, data: undefined };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function toggleStaffActiveAction(
  id: string,
  active: boolean
): Promise<ActionResult> {
  try {
    const { business, staff } = await requireBusiness();

    if (staff.role !== "owner") {
      return { success: false, error: "Only the business owner can manage staff members." };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("staff_members")
      .update({ active })
      .eq("id", id)
      .eq("business_id", business.id); // defence-in-depth

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/settings");
    revalidatePath("/settings/staff");
    return { success: true, data: undefined };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function deleteStaffAction(
  staffId: string
): Promise<ActionResult> {
  try {
    const { business, staff } = await requireBusiness();

    if (staff.role !== "owner") {
      return { success: false, error: "Only the business owner can remove staff members." };
    }

    if (staff.id === staffId) {
      return { success: false, error: "You cannot remove yourself." };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("staff_members")
      .delete()
      .eq("id", staffId)
      .eq("business_id", business.id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/settings");
    revalidatePath("/settings/staff");
    return { success: true, data: undefined };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function disconnectCalendarAction(
  staffId: string
): Promise<ActionResult> {
  try {
    const { business, staff } = await requireBusiness();

    const supabase = await createClient();
    const { data: targetStaff } = await supabase
      .from("staff_members")
      .select("id, user_id, business_id")
      .eq("id", staffId)
      .single();

    if (!targetStaff) {
      return { success: false, error: "Staff member not found." };
    }

    if (targetStaff.business_id !== business.id) {
      return { success: false, error: "Forbidden: Cross-business operation." };
    }

    if (staff.role !== "owner" && targetStaff.user_id !== staff.user_id) {
      return { success: false, error: "Forbidden: You can only disconnect your own calendar." };
    }

    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from("staff_members")
      .update({
        google_access_token: null,
        google_refresh_token: null,
        google_token_expires_at: null,
        calendar_connected: false,
      })
      .eq("id", staffId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/settings");
    revalidatePath("/settings/staff");
    return { success: true, data: undefined };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function updateOwnProfileAction(
  name: string,
  phone: string
): Promise<ActionResult> {
  try {
    const { business, staff } = await requireBusiness();

    const trimmedName = name.trim();
    if (!trimmedName) return { success: false, error: "Name is required." };

    const supabase = await createClient();
    const { error } = await supabase
      .from("staff_members")
      .update({ name: trimmedName, phone: phone.trim() || null })
      .eq("id", staff.id)
      .eq("business_id", business.id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/settings/profile");
    return { success: true, data: undefined };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}
