import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { readGatewayBodyAsRecord, webxLog } from "@/lib/webxApi";
import { fulfillWebXWebhook } from "@/lib/webxWebhookFulfillment";

/**
 * POST /api/payment/webhook
 *
 * **Source of truth** for payment success: creates the real `orders` / `order_items` / `tracking` row
 * when WebX confirms payment. Idempotent when `shop_order_id` is already set.
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const flat = await readGatewayBodyAsRecord(request);

    webxLog("webhook", "Received notification", { keys: Object.keys(flat).slice(0, 25) });

    const result = await fulfillWebXWebhook(supabase, flat);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.httpStatus });
    }

    return NextResponse.json({
      ok: true,
      webx_order_id: result.webx_order_id,
      status: result.status,
      ...(result.shop_order_id ? { shop_order_id: result.shop_order_id } : {}),
      ...(result.duplicate ? { duplicate: true } : {}),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("[webx:webhook]", message, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
