"use client";

import type {
  AddOnItem,
  BillingDetails,
  DeliveryDetails,
  GiftDetails,
  ShippingOption,
} from "@/lib/checkout-store";
import type { CartItem } from "@/lib/cart-storage";

export const PENDING_PAYMENT_STORAGE_KEY = "lakrasa_pending_payment_v1";

export type PaymentCartItem = CartItem & {
  weight_kg?: number;
};

export type PendingPaymentData = {
  /** Client-generated id for WebX / payment iframe (not a DB row until checkout completes). */
  tempOrderId: string;
  cart: PaymentCartItem[];
  addOns: AddOnItem[];
  guestEmail: string;
  userId: string | null;
  userEmail: string | null;
  delivery: DeliveryDetails;
  billing: BillingDetails;
  sameAsDelivery: boolean;
  selectedShipping: ShippingOption;
  includeMessage: boolean;
  giftDetails: GiftDetails;
  giftMessage: string;
  subtotal: number;
  addOnsTotal: number;
  shippingCost: number;
  total: number;
  itemCount: number;
  createdAt: string;
};

export function readPendingPayment(): PendingPaymentData | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(PENDING_PAYMENT_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<PendingPaymentData> | null;
    if (!parsed || !Array.isArray(parsed.cart) || !parsed.selectedShipping || !parsed.tempOrderId) {
      return null;
    }

    return parsed as PendingPaymentData;
  } catch {
    return null;
  }
}

export function writePendingPayment(data: PendingPaymentData): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PENDING_PAYMENT_STORAGE_KEY, JSON.stringify(data));
}

export function clearPendingPayment(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PENDING_PAYMENT_STORAGE_KEY);
}
