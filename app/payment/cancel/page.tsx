import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** Target for WebX `cancel_url` (`WEBX_APP_BASE_URL/payment/cancel`). */
export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h1 className="font-serif text-2xl text-gray-900">Payment cancelled</h1>
        <p className="mt-2 text-sm text-gray-600">You left the WebX checkout. No charge was completed.</p>
        <Link
          href="/checkout"
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-green-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to checkout
        </Link>
      </div>
    </div>
  );
}
