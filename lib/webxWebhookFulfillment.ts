import type { SupabaseClient } from "@supabase/supabase-js";
import { WEBX_PAYMENT_ORDERS_TABLE } from "@/lib/supabaseAdmin";
import { createOrderWithClient } from "@/lib/createOrderWithClient";
import type { PendingPaymentData } from "@/lib/pending-payment";
import {
  extractAmountString,
  extractOrderId,
  extractPaymentReference,
  parseGatewaySuccess,
  webxLog,
} from "@/lib/webxApi";

export type WebhookFulfillmentResult =
  | { ok: true; duplicate?: boolean; webx_order_id: string; status: string; shop_order_id?: string }
  | { ok: false; httpStatus: number; error: string };

function isPendingPaymentData(value: unknown): value is PendingPaymentData {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.cart) &&
    typeof v.total === "number" &&
    v.delivery !== undefined &&
    v.selectedShipping !== undefined
  );
}

/**
 * WebX server-to-server webhook: validate payload, then either fulfill (create shop order) or mark failed.
 * **Idempotent**: if `shop_order_id` is already set, returns success without duplicating inserts.
 *
 * Flow: `pending` → `processing` (claim) → create `orders` / items / tracking → `paid` + `shop_order_id`.
 * If order creation fails, session is reset to `pending` so WebX can retry.
 */
export async function fulfillWebXWebhook(
  admin: SupabaseClient,
  flat: Record<string, string>
): Promise<WebhookFulfillmentResult> {
  const orderId = extractOrderId(flat);
  const amountStr = extractAmountString(flat);

  if (!orderId) {
    return { ok: false, httpStatus: 400, error: "Missing order_id" };
  }
  if (!amountStr) {
    return { ok: false, httpStatus: 400, error: "Missing amount" };
  }

  const { data: row, error: fetchError } = await admin
    .from(WEBX_PAYMENT_ORDERS_TABLE)
    .select("id, amount, status, payment_reference, checkout_snapshot, shop_order_id")
    .eq("id", orderId)
    .maybeSingle();

  if (fetchError || !row) {
    return { ok: false, httpStatus: 404, error: "Order not found" };
  }

  const amountOk = Number(row.amount).toFixed(2) === Number(amountStr).toFixed(2);
  if (!amountOk) {
    webxLog("webhook", "Amount mismatch", { order_id: orderId });
    return { ok: false, httpStatus: 400, error: "Amount mismatch" };
  }

  const refFromGateway = extractPaymentReference(flat);
  if (refFromGateway && row.payment_reference && refFromGateway !== row.payment_reference) {
    return { ok: false, httpStatus: 400, error: "payment_reference mismatch" };
  }

  if (row.shop_order_id) {
    return {
      ok: true,
      duplicate: true,
      webx_order_id: row.id,
      status: "paid",
      shop_order_id: row.shop_order_id as string,
    };
  }

  if (row.status === "paid") {
    return { ok: true, duplicate: true, webx_order_id: row.id, status: "paid" };
  }

  if (row.status === "failed") {
    return { ok: true, duplicate: true, webx_order_id: row.id, status: "failed" };
  }

  const success = parseGatewaySuccess(flat);

  if (!success) {
    await admin
      .from(WEBX_PAYMENT_ORDERS_TABLE)
      .update({ status: "failed" })
      .eq("id", row.id)
      .in("status", ["pending", "processing"]);
    return { ok: true, webx_order_id: row.id, status: "failed" };
  }

  const snapshot = row.checkout_snapshot;
  if (!isPendingPaymentData(snapshot)) {
    console.error("[webx:webhook] Invalid or missing checkout_snapshot", { order_id: row.id });
    return { ok: false, httpStatus: 500, error: "Missing checkout snapshot for fulfillment" };
  }

  const { data: claimed, error: claimError } = await admin
    .from(WEBX_PAYMENT_ORDERS_TABLE)
    .update({ status: "processing" })
    .eq("id", row.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (claimError) {
    console.error("[webx:webhook] Claim failed", claimError.message);
    return { ok: false, httpStatus: 500, error: "Could not claim payment session" };
  }

  if (!claimed) {
    const { data: again } = await admin
      .from(WEBX_PAYMENT_ORDERS_TABLE)
      .select("status, shop_order_id")
      .eq("id", row.id)
      .maybeSingle();

    if (again?.shop_order_id) {
      return {
        ok: true,
        duplicate: true,
        webx_order_id: row.id,
        status: "paid",
        shop_order_id: again.shop_order_id as string,
      };
    }

    return { ok: true, duplicate: true, webx_order_id: row.id, status: again?.status || "unknown" };
  }

  try {
    const completed = await createOrderWithClient(admin, snapshot);

    const { data: finalized, error: finError } = await admin
      .from(WEBX_PAYMENT_ORDERS_TABLE)
      .update({
        status: "paid",
        shop_order_id: completed.orderId,
      })
      .eq("id", row.id)
      .eq("status", "processing")
      .select("id, shop_order_id")
      .maybeSingle();

    if (finError || !finalized) {
      console.error("[webx:webhook] Finalize webx_orders failed", finError?.message);
      return { ok: false, httpStatus: 500, error: "Could not finalize payment session" };
    }

    webxLog("webhook", "Fulfilled", { webx_order_id: row.id, shop_order_id: completed.orderId });

    return {
      ok: true,
      webx_order_id: row.id,
      status: "paid",
      shop_order_id: completed.orderId,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Order creation failed";
    console.error("[webx:webhook] createOrderWithClient", msg);
    await admin.from(WEBX_PAYMENT_ORDERS_TABLE).update({ status: "pending" }).eq("id", row.id).eq("status", "processing");
    return { ok: false, httpStatus: 500, error: msg };
  }
}
