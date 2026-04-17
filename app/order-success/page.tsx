"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Package } from "lucide-react";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const tracking = searchParams.get("tracking") || "";
  const amount = searchParams.get("amount") || "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50/40 via-white to-gray-50 px-4 py-16 md:py-24">
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-9 w-9 text-green-700" strokeWidth={2} />
        </div>
        <h1 className="font-serif text-3xl text-gray-900 md:text-4xl">Thank you</h1>
        <p className="mt-3 text-sm text-gray-600">Your payment was successful and your order is confirmed.</p>
        {amount ? (
          <p className="mt-2 text-sm font-semibold tabular-nums text-green-800">Total paid: Rs. {Number(amount).toLocaleString()}</p>
        ) : null}

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {tracking ? (
            <Link
              href={`/track/${encodeURIComponent(tracking)}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-white shadow-md shadow-green-700/20 transition hover:bg-green-800"
            >
              <Package className="h-4 w-4" />
              Track order
            </Link>
          ) : null}
          <Link
            href="/products"
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-gray-700 transition hover:border-gray-300"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

function Fallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <p className="text-sm text-gray-500">Loading…</p>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <OrderSuccessContent />
    </Suspense>
  );
}
