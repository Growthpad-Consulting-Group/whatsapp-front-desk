import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client for use in Server Components, Server Actions, and Route Handlers.
 * Reads and writes cookies via the Next.js cookies() API.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll called from a Server Component — cookies can only be
            // set in a Server Action or Route Handler. Safe to ignore here.
          }
        },
      },
    }
  );
}

/**
 * Supabase client that uses the service_role key.
 * This bypasses RLS and should be used ONLY on the server for admin/background operations.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
