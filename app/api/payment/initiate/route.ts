import { randomUUID } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin, WEBX_PAYMENT_ORDERS_TABLE } from "@/lib/supabaseAdmin";
import {
  assertWebXApiConfigured,
  initiateWebXHostedPayment,
  webxLog,
} from "@/lib/webxApi";

/**
 * POST /api/payment/initiate
 *
 * Persists `webx_orders` (pending) with items + checkout snapshot, then calls
 * WebX `/cards/pay/session3ds` (JWT-authenticated).
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type InitiateBody = {
  amount?: unknown;
  email?: unknown;
  items?: unknown;
  user_id?: unknown;
  guest_id?: unknown;
  currency?: unknown;
  checkout_snapshot?: unknown;
  webx_extra?: unknown;
};

function parseAmount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const fiveDigits = String(Math.floor(Math.random() * 100000)).padStart(5, "0");
  return `TXN-${year}-${fiveDigits}`;
}

export async function POST(request: NextRequest) {
  try {
    assertWebXApiConfigured();
    const supabase = getSupabaseAdmin();

    let body: InitiateBody;
    try {
      body = (await request.json()) as InitiateBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const amount = parseAmount(body.amount);
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const items = Array.isArray(body.items) ? body.items : null;
    const userId = typeof body.user_id === "string" && body.user_id ? body.user_id.trim() : null;
    const guestId = typeof body.guest_id === "string" && body.guest_id ? body.guest_id.trim() : null;
    const currency = typeof body.currency === "string" && body.currency.trim() ? body.currency.trim() : "LKR";
    const checkoutSnapshot = body.checkout_snapshot;
    const webxExtra =
      body.webx_extra && typeof body.webx_extra === "object"
        ? (body.webx_extra as Record<string, unknown>)
        : undefined;

    if (!amount) {
      return NextResponse.json({ error: "`amount` must be a positive number" }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "`email` must be a valid address" }, { status: 400 });
    }
    if (!items || items.length === 0) {
      return NextResponse.json({ error: "`items` must be a non-empty array" }, { status: 400 });
    }
    if (items.length > 500) {
      return NextResponse.json({ error: "`items` exceeds maximum length" }, { status: 400 });
    }
    if (!userId && !guestId) {
      return NextResponse.json({ error: "Provide `user_id` and/or `guest_id`" }, { status: 400 });
    }
    if (checkoutSnapshot && typeof checkoutSnapshot === "object") {
      const snapTotal = Number((checkoutSnapshot as Record<string, unknown>).total);
      if (Number.isFinite(snapTotal) && Number(snapTotal).toFixed(2) !== Number(amount).toFixed(2)) {
        return NextResponse.json({ error: "`amount` must match `checkout_snapshot.total`" }, { status: 400 });
      }
    }
    if (!webxExtra?.session || typeof webxExtra.session !== "string" || !webxExtra.session.trim()) {
      return NextResponse.json(
        {
          error:
            "Missing WebX session id. session3ds requires `webx_extra.session` from hosted card/session initialization.",
        },
        { status: 400 }
      );
    }

    const orderId = randomUUID();
    const orderNumber = generateOrderNumber();

    const { error: insertError } = await supabase.from(WEBX_PAYMENT_ORDERS_TABLE).insert({
      id: orderId,
      email,
      amount,
      status: "pending",
      payment_reference: orderNumber,
      items,
      checkout_snapshot: checkoutSnapshot ?? {},
    });

    if (insertError) {
      console.error("[webx:initiate] Supabase insert failed", insertError.message);
      webxLog("initiate", "Supabase insert failed", { message: insertError.message, code: insertError.code });
      return NextResponse.json(
        { error: "Could not create pending order", details: insertError.message },
        { status: 500 }
      );
    }

    const wx = await initiateWebXHostedPayment({
      orderId,
      orderNumber,
      amount,
      email,
      customerId: userId || guestId || `guest:${email}`,
      currency,
      extraFields: webxExtra,
    });
    if (!wx.ok) {
      await supabase.from(WEBX_PAYMENT_ORDERS_TABLE).delete().eq("id", orderId);
      return NextResponse.json(
        {
          error: wx.error,
          details: wx.raw,
          requestUrl: wx.requestUrl,
          hint: wx.hint,
        },
        { status: wx.httpStatus >= 400 ? wx.httpStatus : 502 }
      );
    }

    webxLog("initiate", "Hosted payment request accepted", { order_id: orderId, order_number: orderNumber });

    const rawObj = wx.raw && typeof wx.raw === "object" ? (wx.raw as Record<string, unknown>) : null;
    const nestedObj = rawObj?.data && typeof rawObj.data === "object" ? (rawObj.data as Record<string, unknown>) : null;
    const html3dsUrl =
      (typeof rawObj?.html3ds_url === "string" && rawObj.html3ds_url) ||
      (typeof rawObj?.html3dsUrl === "string" && rawObj.html3dsUrl) ||
      (typeof rawObj?.paymentPageUrl === "string" && rawObj.paymentPageUrl) ||
      (typeof nestedObj?.html3ds_url === "string" && nestedObj.html3ds_url) ||
      (typeof nestedObj?.html3dsUrl === "string" && nestedObj.html3dsUrl) ||
      (typeof nestedObj?.paymentPageUrl === "string" && nestedObj.paymentPageUrl) ||
      wx.payment_url ||
      null;

    return NextResponse.json({
      success: true,
      data: wx.raw,
      payment_url: wx.payment_url,
      html3ds_url: html3dsUrl,
      order_id: orderId,
      orderNumber,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("[webx:initiate]", message, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
