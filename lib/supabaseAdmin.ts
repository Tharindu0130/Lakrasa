import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client with the **service role** key.
 *
 * Credentials (add to `.env.local` — never commit real values):
 * - `SUPABASE_URL` — same project URL as Supabase dashboard (or use `NEXT_PUBLIC_SUPABASE_URL` as fallback below).
 * - `SUPABASE_SERVICE_ROLE_KEY` — **service_role** secret from Project Settings → API (bypasses RLS; keep server-only).
 */
const supabaseUrl =
  process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "[supabaseAdmin] Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  if (!cached) {
    cached = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}

/** Table used by WebX API payment routes (see `sql/webx_orders.sql`). */
export const WEBX_PAYMENT_ORDERS_TABLE =
  process.env.SUPABASE_WEBX_ORDERS_TABLE?.trim() || "webx_orders";
