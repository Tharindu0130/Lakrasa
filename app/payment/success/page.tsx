"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { clearPendingPayment } from "@/lib/pending-payment";
import { writeCart } from "@/lib/cart-storage";
import { useCheckoutStore } from "@/lib/checkout-store";
import { clearWebxCheckoutSession, readWebxCheckoutSession } from "@/lib/webx-client-session";

const POLL_MS = 2000;
const POLL_MAX = 120;

type VerifyPollJson = {
  ok?: boolean;
  status?: string;
  tracking_code?: string | null;
  shop_order_id?: string | null;
  amount?: number;
};

function PaymentSuccessInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetCheckout = useCheckoutStore((state) => state.resetCheckout);
  const [message, setMessage] = useState("Confirming your payment…");
  const attempts = useRef(0);
  const stopped = useRef(false);

  useEffect(() => {
    const fromQuery =
      searchParams.get("order_id") ||
      searchParams.get("orderid") ||
      searchParams.get("id") ||
      readWebxCheckoutSession()?.webx_order_id;

    if (!fromQuery) {
      setMessage("Missing payment reference. Return to checkout.");
      return;
    }

    const tick = async () => {
      if (stopped.current) return;
      attempts.current += 1;
      if (attempts.current > POLL_MAX) {
        stopped.current = true;
        setMessage("We could not confirm payment yet. Check your email or order history, or contact support.");
        return;
      }

      try {
        const res = await fetch(`/api/payment/verify?order_id=${encodeURIComponent(fromQuery)}`, {
          cache: "no-store",
        });
        const data = (await res.json()) as VerifyPollJson;

        if (data.ok && data.status === "paid" && data.tracking_code && data.shop_order_id) {
          stopped.current = true;
          clearWebxCheckoutSession();
          clearPendingPayment();
          writeCart([]);
          resetCheckout();
          const q = new URLSearchParams({
            tracking: data.tracking_code,
            order: data.shop_order_id,
            amount: String(data.amount ?? ""),
          });
          router.replace(`/order-success?${q.toString()}`);
          return;
        }

        if (data.ok && data.status === "failed") {
          stopped.current = true;
          setMessage("Payment was not completed.");
          return;
        }
      } catch {
        /* continue polling */
      }
    };

    void tick();
    const id = setInterval(() => void tick(), POLL_MS);
    return () => {
      stopped.current = true;
      clearInterval(id);
    };
  }, [resetCheckout, router, searchParams]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 py-16">
      <Loader2 className="mb-4 h-10 w-10 animate-spin text-green-700" />
      <p className="max-w-md text-center text-sm text-gray-600">{message}</p>
      <Link href="/checkout" className="mt-8 text-xs font-bold uppercase tracking-widest text-green-800 underline">
        Back to checkout
      </Link>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <Loader2 className="h-8 w-8 animate-spin text-green-700" />
        </div>
      }
    >
      <PaymentSuccessInner />
    </Suspense>
  );
}
