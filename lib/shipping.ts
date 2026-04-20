import { supabase } from './supabaseClient';
import { CartItem } from './cart-storage';

export interface ShippingOption {
  provider_id: string;
  name: string;
  price_lkr: number;
  estimated_days_min: number;
  estimated_days_max: number;
}

export async function calculateShipping(
  cart: CartItem[],
  city: string
): Promise<ShippingOption[]> {
  // Simple hardcoded shipping options for Sri Lanka only
  // provider_id is null since we're not using database providers yet
  return [
    {
      provider_id: '', // Empty string, will be saved as null
      name: 'Standard Delivery (3-5 days)',
      price_lkr: 350,
      estimated_days_min: 3,
      estimated_days_max: 5,
    },
    {
      provider_id: '', // Empty string, will be saved as null
      name: 'Express Delivery (1-2 days)',
      price_lkr: 650,
      estimated_days_min: 1,
      estimated_days_max: 2,
    },
    {
      provider_id: '', // Empty string, will be saved as null
      name: 'Free Pickup - Kelaniya',
      price_lkr: 0,
      estimated_days_min: 1,
      estimated_days_max: 1,
    },
  ];
}

function getFallbackShippingRates(totalWeight: number): ShippingOption[] {
  // Fallback rates if database tables don't exist
  if (totalWeight <= 1) {
    return [
      {
        provider_id: 'standard',
        name: 'Standard Delivery',
        price_lkr: 350,
        estimated_days_min: 3,
        estimated_days_max: 5,
      },
      {
        provider_id: 'express',
        name: 'Express Delivery',
        price_lkr: 650,
        estimated_days_min: 1,
        estimated_days_max: 2,
      },
    ];
  }

  return [
    {
      provider_id: 'standard',
      name: 'Standard Delivery',
      price_lkr: 550,
      estimated_days_min: 4,
      estimated_days_max: 7,
    },
    {
      provider_id: 'express',
      name: 'Express Delivery',
      price_lkr: 950,
      estimated_days_min: 2,
      estimated_days_max: 3,
    },
  ];
}
