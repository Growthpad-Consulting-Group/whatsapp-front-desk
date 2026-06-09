"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireBusiness } from "@/lib/data/business";

/**
 * Creates an audit log from an authenticated user context (Dashboard UI actions).
 */
export async function createAuditLogAction(
  event: string,
  referenceId: string | null,
  details: any = {}
): Promise<void> {
  try {
    const { business } = await requireBusiness();
    const supabase = await createClient();

    const { error } = await supabase.from("audit_logs").insert({
      business_id: business.id,
      event,
      reference_id: referenceId,
      details,
    });

    if (error) {
      console.error("[Audit Log Action Error]:", error.message);
    }
  } catch (err: any) {
    console.warn("[Audit Log Action Warning] Gracefully skipped audit log:", err.message);
  }
}

/**
 * Creates an audit log from a system/background context (Cron jobs, webhooks).
 * Requires explicit businessId since there is no authenticated user.
 */
export async function createSystemAuditLog(
  businessId: string,
  event: string,
  referenceId: string | null,
  details: any = {}
): Promise<void> {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase.from("audit_logs").insert({
      business_id: businessId,
      event,
      reference_id: referenceId,
      details,
    });

    if (error) {
      console.error("[System Audit Log Error]:", error.message);
    }
  } catch (err: any) {
    console.warn("[System Audit Log Warning] Gracefully skipped system audit log:", err.message);
  }
}
