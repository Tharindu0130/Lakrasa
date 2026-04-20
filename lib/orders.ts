"use client";

import { supabase } from "@/lib/supabaseClient";
import { createOrderWithClient, type CompletedOrder } from "@/lib/createOrderWithClient";
import type { PendingPaymentData } from "@/lib/pending-payment";

export type { CompletedOrder };

export async function createOrderFromPendingPayment(
  checkoutData: PendingPaymentData
): Promise<CompletedOrder> {
  return createOrderWithClient(supabase, checkoutData);
}
