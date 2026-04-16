import { create } from 'zustand';
import { CartItem } from './cart-storage';

export interface AddOnItem extends CartItem {
  weight_kg: number;
}

export interface DeliveryDetails {
  shippingFirstName: string;
  shippingLastName: string;
  shippingAddressLine: string;
  shippingApartment: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingPhone: string;
}

export interface BillingDetails {
  billingFirstName: string;
  billingLastName: string;
  billingAddressLine: string;
  billingApartment: string;
  billingCity: string;
  billingPostalCode: string;
  billingPhone: string;
}

export interface GiftDetails {
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  occasion: string;
  relationship: string;
  occasionDate: string;
}

export interface ShippingOption {
  provider_id: string;
  name: string;
  price_lkr: number;
  estimated_days_min: number;
  estimated_days_max: number;
}

interface CheckoutState {
  // Cart
  cart: CartItem[];
  
  // Add-ons
  addOns: AddOnItem[];
  setAddOns: (addOns: AddOnItem[]) => void;
  
  // Delivery
  delivery: DeliveryDetails;
  setDelivery: (delivery: Partial<DeliveryDetails>) => void;
  
  // Billing
  billing: BillingDetails;
  setBilling: (billing: Partial<BillingDetails>) => void;
  sameAsDelivery: boolean;
  setSameAsDelivery: (same: boolean) => void;
  
  // Shipping
  shippingOptions: ShippingOption[];
  selectedShipping: ShippingOption | null;
  setShippingOptions: (options: ShippingOption[]) => void;
  setSelectedShipping: (option: ShippingOption) => void;
  
  // Gift
  includeMessage: boolean;
  setIncludeMessage: (include: boolean) => void;
  giftDetails: GiftDetails;
  setGiftDetails: (gift: Partial<GiftDetails>) => void;
  
  // Message
  giftMessage: string;
  setGiftMessage: (message: string) => void;
  
  // Reset
  resetCheckout: () => void;
}

const defaultDelivery: DeliveryDetails = {
  shippingFirstName: '',
  shippingLastName: '',
  shippingAddressLine: '',
  shippingApartment: '',
  shippingCity: '',
  shippingPostalCode: '',
  shippingPhone: '',
};

const defaultBilling: BillingDetails = {
  billingFirstName: '',
  billingLastName: '',
  billingAddressLine: '',
  billingApartment: '',
  billingCity: '',
  billingPostalCode: '',
  billingPhone: '',
};

const defaultGift: GiftDetails = {
  senderName: '',
  senderEmail: '',
  senderPhone: '',
  recipientName: '',
  recipientEmail: '',
  recipientPhone: '',
  occasion: '',
  relationship: '',
  occasionDate: '',
};

export const useCheckoutStore = create<CheckoutState>()((set) => ({
  // Cart
  cart: [],
  
  // Add-ons
  addOns: [],
  setAddOns: (addOns) => set({ addOns }),
  
  // Delivery
  delivery: defaultDelivery,
  setDelivery: (delivery) =>
    set((state) => ({
      delivery: { ...state.delivery, ...delivery },
    })),
  
  // Billing
  billing: defaultBilling,
  setBilling: (billing) =>
    set((state) => ({
      billing: { ...state.billing, ...billing },
    })),
  sameAsDelivery: true,
  setSameAsDelivery: (same) => set({ sameAsDelivery: same }),
  
  // Shipping
  shippingOptions: [],
  selectedShipping: null,
  setShippingOptions: (options) => set({ shippingOptions: options }),
  setSelectedShipping: (option) => set({ selectedShipping: option }),
  
  // Gift
  includeMessage: false,
  setIncludeMessage: (include) => set({ includeMessage: include }),
  giftDetails: defaultGift,
  setGiftDetails: (gift) =>
    set((state) => ({
      giftDetails: { ...state.giftDetails, ...gift },
    })),
  
  // Message
  giftMessage: '',
  setGiftMessage: (message) => set({ giftMessage: message }),
  
  // Reset
  resetCheckout: () =>
    set({
      cart: [],
      addOns: [],
      delivery: defaultDelivery,
      billing: defaultBilling,
      sameAsDelivery: true,
      shippingOptions: [],
      selectedShipping: null,
      includeMessage: false,
      giftDetails: defaultGift,
      giftMessage: '',
    }),
}));
