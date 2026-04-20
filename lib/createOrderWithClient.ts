import type { SupabaseClient } from "@supabase/supabase-js";
import { createTrackingForOrder } from "@/lib/tracking";
import type { PendingPaymentData } from "@/lib/pending-payment";

export type CompletedOrder = {
  orderId: string;
  trackingCode: string;
  totalAmount: number;
  itemCount: number;
};

/**
 * Creates `orders`, `order_items`, and `tracking` using any Supabase client (anon or service role).
 * Used from the browser (`lib/orders.ts`) and from the WebX webhook (service role).
 */
export async function createOrderWithClient(
  client: SupabaseClient,
  checkoutData: PendingPaymentData
): Promise<CompletedOrder> {
  const customerEmail =
    checkoutData.userEmail || checkoutData.guestEmail || checkoutData.delivery.shippingPhone;

  if (!customerEmail) {
    throw new Error("Missing customer contact information.");
  }

  const isGuest = !checkoutData.userId;
  const guestId = isGuest
    ? `GUEST-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${checkoutData.delivery.shippingPhone}`
    : null;

  const totalWeight =
    checkoutData.cart.reduce((sum, item) => {
      const weight = item.weight_kg || 0.5;
      return sum + weight * item.quantity;
    }, 0) +
    checkoutData.addOns.reduce((sum, item) => sum + item.weight_kg * item.quantity, 0);

  const { data: order, error: orderError } = await client
    .from("orders")
    .insert({
      user_id: checkoutData.userId,
      guest_id: guestId,
      email: customerEmail,
      total_amount: checkoutData.total,
      status: "paid",
      shipping_first_name: checkoutData.delivery.shippingFirstName || "",
      shipping_last_name: checkoutData.delivery.shippingLastName,
      shipping_address_line: checkoutData.delivery.shippingAddressLine,
      shipping_apartment: checkoutData.delivery.shippingApartment || "",
      shipping_city: checkoutData.delivery.shippingCity,
      shipping_postal_code: checkoutData.delivery.shippingPostalCode || "",
      shipping_phone: checkoutData.delivery.shippingPhone,
      billing_first_name: checkoutData.sameAsDelivery
        ? checkoutData.delivery.shippingFirstName || ""
        : checkoutData.billing.billingFirstName || "",
      billing_last_name: checkoutData.sameAsDelivery
        ? checkoutData.delivery.shippingLastName
        : checkoutData.billing.billingLastName,
      billing_address_line: checkoutData.sameAsDelivery
        ? checkoutData.delivery.shippingAddressLine
        : checkoutData.billing.billingAddressLine,
      billing_apartment: checkoutData.sameAsDelivery
        ? checkoutData.delivery.shippingApartment || ""
        : checkoutData.billing.billingApartment || "",
      billing_city: checkoutData.sameAsDelivery
        ? checkoutData.delivery.shippingCity
        : checkoutData.billing.billingCity,
      billing_postal_code: checkoutData.sameAsDelivery
        ? checkoutData.delivery.shippingPostalCode || ""
        : checkoutData.billing.billingPostalCode || "",
      billing_phone: checkoutData.sameAsDelivery
        ? checkoutData.delivery.shippingPhone
        : checkoutData.billing.billingPhone,
      shipping_provider_id: checkoutData.selectedShipping.provider_id || null,
      shipping_cost: checkoutData.selectedShipping.price_lkr || 0,
      estimated_delivery_min_days: checkoutData.selectedShipping.estimated_days_min || null,
      estimated_delivery_max_days: checkoutData.selectedShipping.estimated_days_max || null,
      total_weight: totalWeight,
      sender_name: checkoutData.includeMessage ? checkoutData.giftDetails.senderName || null : null,
      sender_email: checkoutData.includeMessage ? checkoutData.giftDetails.senderEmail || null : null,
      sender_phone: checkoutData.includeMessage ? checkoutData.giftDetails.senderPhone || null : null,
      recipient_name: checkoutData.includeMessage
        ? checkoutData.giftDetails.recipientName || null
        : null,
      recipient_email: checkoutData.includeMessage
        ? checkoutData.giftDetails.recipientEmail || null
        : null,
      recipient_phone: checkoutData.includeMessage
        ? checkoutData.giftDetails.recipientPhone || null
        : null,
      occasion: checkoutData.includeMessage ? checkoutData.giftDetails.occasion || null : null,
      relationship: checkoutData.includeMessage
        ? checkoutData.giftDetails.relationship || null
        : null,
      occasion_date: checkoutData.includeMessage
        ? checkoutData.giftDetails.occasionDate || null
        : null,
      gift_message: checkoutData.giftMessage || null,
      payment_method: "webx",
      payment_status: "paid",
    })
    .select()
    .single();

  if (orderError) throw orderError;

  const orderItems = [
    ...checkoutData.cart.map((item) => ({
      order_id: order.id,
      product_id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
    })),
    ...checkoutData.addOns.map((item) => ({
      order_id: order.id,
      product_id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
      is_addon: true,
    })),
  ];

  const { error: itemsError } = await client.from("order_items").insert(orderItems);
  if (itemsError) throw itemsError;

  const trackingResult = await createTrackingForOrder(client, order.id);
  if ("error" in trackingResult) {
    throw new Error(trackingResult.error);
  }

  return {
    orderId: order.id as string,
    trackingCode: trackingResult.trackingCode,
    totalAmount: checkoutData.total,
    itemCount: checkoutData.itemCount,
  };
}
