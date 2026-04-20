import type { SupabaseClient } from "@supabase/supabase-js";

export type TrackedOrderRow = {
  id: string;
  email: string;
  total_amount: number;
  pipeline_stage: string | null;
  status: string | null;
  order_items: Array<{
    id: string;
    name: string | null;
    price: number | null;
    quantity: number | null;
  }>;
};

const TRACKING_SELECT = `
  tracking_code,
  order:orders (
    id,
    email,
    total_amount,
    pipeline_stage,
    status,
    order_items (
      id,
      name,
      price,
      quantity
    )
  )
`;

const ORDER_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isOrderUuid(value: string): boolean {
  return ORDER_UUID_RE.test(value.trim());
}

export function generateTrackingCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < 8; i++) {
    suffix += chars[bytes[i]! % chars.length];
  }
  return `TRK-${suffix}`;
}

export type GetOrderByTrackingCodeResult =
  | { ok: true; order: TrackedOrderRow; trackingCode: string }
  | { ok: false; error: "invalid_code" | "not_found" | "unknown" };

export async function getOrderByTrackingCode(
  client: SupabaseClient,
  trackingCode: string
): Promise<GetOrderByTrackingCodeResult> {
  const code = trackingCode.trim();
  if (!code) {
    return { ok: false, error: "invalid_code" };
  }

  const { data, error } = await client
    .from("tracking")
    .select(TRACKING_SELECT)
    .eq("tracking_code", code)
    .maybeSingle();

  if (error) {
    console.error("getOrderByTrackingCode:", error);
    return { ok: false, error: "unknown" };
  }

  const row = data as unknown as { order: TrackedOrderRow | null; tracking_code: string } | null;
  if (!row) {
    return { ok: false, error: "not_found" };
  }
  const order = row.order ?? null;
  if (!order) {
    return { ok: false, error: "not_found" };
  }

  return { ok: true, order, trackingCode: row.tracking_code };
}

/** Resolve a public tracking_code from an internal order id (for legacy URLs). */
export async function getTrackingCodeByOrderId(
  client: SupabaseClient,
  orderId: string
): Promise<string | null> {
  const { data, error } = await client
    .from("tracking")
    .select("tracking_code")
    .eq("order_id", orderId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }
  return (data as { tracking_code: string }).tracking_code;
}

/** Reads `tracking_code` from a Supabase `orders` row that embeds `tracking(...)`. */
export function embeddedTrackingCodeFromOrder(order: { tracking?: unknown }): string | null {
  const t = order.tracking;
  if (!t) return null;
  if (Array.isArray(t)) return (t[0] as { tracking_code?: string })?.tracking_code ?? null;
  return (t as { tracking_code?: string }).tracking_code ?? null;
}

export async function createTrackingForOrder(
  client: SupabaseClient,
  orderId: string,
  maxAttempts = 8
): Promise<{ trackingCode: string } | { error: string }> {
  const existing = await getTrackingCodeByOrderId(client, orderId);
  if (existing) {
    return { trackingCode: existing };
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const trackingCode = generateTrackingCode();
    const { error } = await client.from("tracking").insert({
      order_id: orderId,
      tracking_code: trackingCode,
    });

    if (!error) {
      return { trackingCode };
    }

    const msg = error.message?.toLowerCase() ?? "";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      const alreadyCreated = await getTrackingCodeByOrderId(client, orderId);
      if (alreadyCreated) {
        return { trackingCode: alreadyCreated };
      }
      continue;
    }
    console.error("createTrackingForOrder:", error);
    return { error: error.message };
  }
  return { error: "Could not generate a unique tracking code" };
}
