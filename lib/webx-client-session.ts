/** Browser session for WebX iframe URL + server `webx_orders.id` (UUID). */
export const WEBX_CHECKOUT_SESSION_KEY = "lakrasa_webx_checkout_v1";

export type WebxCheckoutSession = {
  webx_order_id: string;
  payment_url?: string;
  html3ds_url?: string;
  order_number?: string;
};

export function readWebxCheckoutSession(): WebxCheckoutSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(WEBX_CHECKOUT_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WebxCheckoutSession> | null;
    if (!parsed?.webx_order_id) return null;
    return parsed as WebxCheckoutSession;
  } catch {
    return null;
  }
}

export function writeWebxCheckoutSession(data: WebxCheckoutSession): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(WEBX_CHECKOUT_SESSION_KEY, JSON.stringify(data));
}

export function clearWebxCheckoutSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(WEBX_CHECKOUT_SESSION_KEY);
}
