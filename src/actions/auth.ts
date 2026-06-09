"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignupSchema, LoginSchema, MagicLinkSchema } from "@/lib/validations/auth";
import type { ActionResult } from "@/types";

export async function signupAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = SignupSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0].message,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.name },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/onboarding`,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // If email confirmation is disabled in Supabase, user is immediately active
  if (data.session) {
    redirect("/onboarding");
  }

  return {
    success: true,
    data: undefined,
  };
}

export async function loginAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = LoginSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    // Don't leak whether the email exists
    return { success: false, error: "Invalid email or password" };
  }

  redirect("/dashboard");
}

export async function magicLinkAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const raw = { email: formData.get("email") };
  const parsed = MagicLinkSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: undefined };
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
