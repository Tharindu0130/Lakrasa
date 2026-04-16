export const CART_STORAGE_KEY = "lakrasa_cart_v1";
export const CART_UPDATED_EVENT = "lakrasa:cart-updated";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export function addToCart(input: Omit<CartItem, "quantity">, quantity = 1): CartItem[] {
  const safeQty = Math.max(1, quantity);
  const current = readCart();
  const existing = current.find((item) => item.id === input.id);

  const next = existing
    ? current.map((item) =>
        item.id === input.id ? { ...item, quantity: item.quantity + safeQty } : item
      )
    : [...current, { ...input, quantity: safeQty }];

  writeCart(next);
  return next;
}

export function updateCartItemQuantity(id: string, quantity: number): CartItem[] {
  const current = readCart();
  const next = current
    .map((item) => (item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item))
    .filter((item) => item.quantity > 0);
  writeCart(next);
  return next;
}

export function removeCartItem(id: string): CartItem[] {
  const current = readCart();
  const next = current.filter((item) => item.id !== id);
  writeCart(next);
  return next;
}

export function getCartCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function getCartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.price, 0);
}
