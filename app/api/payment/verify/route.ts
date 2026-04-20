import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin, WEBX_PAYMENT_ORDERS_TABLE } from "@/lib/supabaseAdmin";
import { getTrackingCodeByOrderId } from "@/lib/tracking";
import { decodeWebX3dsResult, normalizeKeys, webxLog } from "@/lib/webxApi";

/**
 * Poll payment status after redirect from WebX (`/payment/success`) or from the payment page while the iframe loads.
 *
 * **Does not** create orders — reads `webx_orders` updated by the **webhook**.
 *
 * GET /api/payment/verify?order_id={webx_orders.id}
 * POST /api/payment/verify  { "order_id": "uuid" }
 */

async function pollPaymentStatus(orderId: string): Promise<NextResponse> {
  const supabase = getSupabaseAdmin();
  const { data: row, error } = await supabase
    .from(WEBX_PAYMENT_ORDERS_TABLE)
    .select("id, status, shop_order_id, amount")
    .eq("id", orderId)
    .maybeSingle();

  if (error || !row) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  webxLog("verify", "Poll status", { order_id: orderId, status: row.status });

  let tracking_code: string | null = null;
  if (row.shop_order_id) {
    tracking_code = await getTrackingCodeByOrderId(supabase, row.shop_order_id as string);
  }

  return NextResponse.json({
    ok: true,
    webx_order_id: row.id,
    status: row.status,
    amount: row.amount,
    shop_order_id: row.shop_order_id ?? null,
    tracking_code,
  });
}

export async function GET(request: NextRequest) {
  try {
    const orderId = request.nextUrl.searchParams.get("order_id");
    if (!orderId) {
      return NextResponse.json({ error: "Missing order_id query parameter" }, { status: 400 });
    }
    return await pollPaymentStatus(orderId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("[webx:verify:get]", message, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let raw: Record<string, unknown> = {};

    if (contentType.includes("application/json")) {
      try {
        raw = (await request.json()) as Record<string, unknown>;
      } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
      }
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await request.text();
      const params = new URLSearchParams(text);
      params.forEach((value, key) => {
        raw[key] = value;
      });
    } else {
      const form = await request.formData();
      form.forEach((value, key) => {
        raw[key] = typeof value === "string" ? value : value.name;
      });
    }

    const flat = normalizeKeys(raw);
    const decoded = decodeWebX3dsResult(flat);

    // Spring style callback often carries only result3ds(base64) with orderNumber.
    const orderRef =
      decoded.orderNumber ||
      flat["order_id"] ||
      flat["orderid"] ||
      flat["id"] ||
      null;
    if (!orderRef) {
      return NextResponse.json({ error: "Missing order reference in 3DS callback" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: row, error } = await supabase
      .from(WEBX_PAYMENT_ORDERS_TABLE)
      .select("id, status, payment_reference")
      .or(`id.eq.${orderRef},payment_reference.eq.${orderRef}`)
      .maybeSingle();

    if (error || !row) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const nextStatus = decoded.success ? "paid" : "failed";
    const updateRes = await supabase
      .from(WEBX_PAYMENT_ORDERS_TABLE)
      .update({ status: nextStatus })
      .eq("id", row.id)
      .in("status", ["pending", "processing"]);

    if (updateRes.error) {
      console.error("[webx:verify:post] Update failed", updateRes.error.message);
      return NextResponse.json({ error: "Could not update payment status" }, { status: 500 });
    }

    webxLog("verify", "3DS callback processed", {
      order_ref: orderRef,
      webx_order_id: row.id,
      success: decoded.success,
      status_code: decoded.statusCode,
      receipt: decoded.receipt,
    });

    return NextResponse.json({
      ok: true,
      webx_order_id: row.id,
      status: nextStatus,
      decoded: decoded.raw,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("[webx:verify:post]", message, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
