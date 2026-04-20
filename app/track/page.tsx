"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useStore } from "@/lib/store";
import { Box, CheckCircle2, Truck, ShieldCheck, Search, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  getOrderByTrackingCode,
  getTrackingCodeByOrderId,
  isOrderUuid,
  type TrackedOrderRow,
} from "@/lib/tracking";
import { PIPELINE_STEPS, pipelineStepIndex } from "@/lib/tracking-ui";

function TrackingSearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useStore();

  const [trackingCode, setTrackingCode] = useState("");
  /** Code used for the current result + realtime refreshes (public tracking id only). */
  const [activeTrackingCode, setActiveTrackingCode] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackedOrderRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlResolving, setUrlResolving] = useState(false);

  const fetchByTrackingCode = useCallback(async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) {
      setOrder(null);
      setActiveTrackingCode(null);
      setError(null);
      return;
    }
    if (trimmed.length < 4) {
      setError("Please enter a valid Tracking ID.");
      setOrder(null);
      setActiveTrackingCode(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await getOrderByTrackingCode(supabase, trimmed);
      if (!result.ok) {
        setOrder(null);
        setActiveTrackingCode(null);
        if (result.error === "invalid_code") {
          setError("Please enter a valid Tracking ID.");
        } else {
          setError("No order found for this Tracking ID. Check the code and try again.");
        }
        return;
      }
      setOrder(result.order);
      setActiveTrackingCode(result.trackingCode);
    } catch (err) {
      console.error("Error fetching order:", err);
      setError("Something went wrong. Please try again.");
      setOrder(null);
      setActiveTrackingCode(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // URL + legacy ?id= / ?order= order UUID → resolve to ?tracking=
  useEffect(() => {
    const run = async () => {
      const fromQuery = searchParams.get("tracking");
      const legacy = searchParams.get("id") ?? searchParams.get("order");

      if (fromQuery) {
        setTrackingCode(fromQuery);
        await fetchByTrackingCode(fromQuery);
        return;
      }

      if (legacy?.trim()) {
        const raw = legacy.trim();
        if (isOrderUuid(raw)) {
          setUrlResolving(true);
          try {
            const resolved = await getTrackingCodeByOrderId(supabase, raw);
            if (resolved) {
              router.replace(`/track?tracking=${encodeURIComponent(resolved)}`);
              setTrackingCode(resolved);
              await fetchByTrackingCode(resolved);
            } else {
              setTrackingCode("");
              setOrder(null);
              setActiveTrackingCode(null);
              setError("No tracking record found for this order. Use the Tracking ID from your confirmation email.");
            }
          } finally {
            setUrlResolving(false);
          }
          return;
        }
        setTrackingCode(raw);
        await fetchByTrackingCode(raw);
        return;
      }

      setOrder(null);
      setActiveTrackingCode(null);
      setTrackingCode("");
      setError(null);
    };

    void run();
  }, [searchParams, fetchByTrackingCode, router]);

  useEffect(() => {
    if (!order?.id || !activeTrackingCode) return;
    const channel = supabase
      .channel(`track-live-${order.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `id=eq.${order.id}` },
        () => void fetchByTrackingCode(activeTrackingCode)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_items", filter: `order_id=eq.${order.id}` },
        () => void fetchByTrackingCode(activeTrackingCode)
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [order?.id, activeTrackingCode, fetchByTrackingCode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const code = trackingCode.trim();
    if (!code) return;
    router.push(`/track?tracking=${encodeURIComponent(code)}`);
    void fetchByTrackingCode(code);
  };

  const safeStepIndex = pipelineStepIndex(order?.pipeline_stage);

  return (
    <div className="min-h-screen bg-white py-12 md:py-24 px-6 md:px-10 w-full">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 hover:text-black transition-colors mb-12"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Shop
      </Link>

      <div className="mb-16">
        <h1 className="text-4xl md:text-5xl font-serif text-gray-900 mb-6 antialiased">Track Your Order</h1>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed max-w-lg">
          Enter your Tracking ID to see the real-time status of your spice delivery.
          {user && " Your recent orders are available in your dashboard."}
        </p>

        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <label htmlFor="tracking-code-input" className="sr-only">
              Enter Tracking ID
            </label>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="tracking-code-input"
              type="text"
              placeholder="Enter Tracking ID (e.g. TRK-1A2B3C4D)"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-none text-sm focus:ring-1 focus:ring-black outline-none transition-all font-serif"
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            className="px-8 py-4 bg-green-700 text-white text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-green-800 transition-colors shadow-lg shadow-green-900/10"
          >
            Track Now
          </button>
        </form>
        {error && <p className="mt-4 text-xs text-red-500 font-medium">{error}</p>}
      </div>

      {(loading || urlResolving) && (
        <div className="py-12">
          <div className="animate-pulse text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase">
            Updating status...
          </div>
        </div>
      )}

      {order && !loading && !urlResolving && activeTrackingCode && (
        <div className="mt-20 fade-in">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-gray-100 pb-8">
            <div>
              <p className="text-[10px] font-bold tracking-[0.3em] text-green-700 uppercase mb-2">Order found</p>
              <h2 className="text-2xl font-serif text-gray-900">Tracking ID</h2>
              <p className="mt-2 font-mono text-sm font-semibold text-gray-900">{activeTrackingCode}</p>
            </div>
            <div className="md:text-right">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-1">Current status</p>
              <p className="text-sm font-semibold text-gray-900 uppercase tracking-widest">
                {PIPELINE_STEPS[safeStepIndex].label}
              </p>
            </div>
          </div>

          <div className="bg-gray-50/50 rounded-none p-8 md:p-12 border border-gray-100 mb-16">
            <div className="relative">
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gray-200 -translate-y-1/2 hidden md:block"></div>
              <div
                className="absolute top-1/2 left-0 h-[1px] bg-green-700 -translate-y-1/2 transition-all duration-1000 hidden md:block"
                style={{ width: `${(safeStepIndex / (PIPELINE_STEPS.length - 1)) * 100}%` }}
              ></div>

              <div className="relative flex flex-col md:flex-row justify-between gap-12 md:gap-0">
                {PIPELINE_STEPS.map((step, index) => {
                  const isCompleted = index <= safeStepIndex;
                  const isCurrent = index === safeStepIndex;
                  const Icon = step.icon;

                  return (
                    <div key={step.id} className="flex md:flex-col items-center gap-6 md:gap-6 relative z-10 md:w-1/4">
                      <div
                        className={`
                        w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-500
                        ${isCompleted ? "bg-green-700 text-white" : "bg-white border border-gray-100 text-gray-300"}
                      `}
                      >
                        {isCompleted && !isCurrent ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                      </div>
                      <div className="text-left md:text-center">
                        <p
                          className={`text-[9px] font-bold uppercase tracking-[0.2em] mb-1 ${isCompleted ? "text-black" : "text-gray-300"}`}
                        >
                          Step {index + 1}
                        </p>
                        <p className={`text-xs font-serif ${isCompleted ? "text-gray-900" : "text-gray-300"}`}>
                          {step.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <h3 className="text-xl font-serif text-gray-900 lowercase first-letter:uppercase">Delivery Information</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <Mail className="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">Confirmation Email</p>
                    <p className="text-sm font-serif text-gray-900">{order.email}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Truck className="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">Carrier</p>
                    <p className="text-sm font-serif text-gray-900">Lakrasa Logistics (Standard)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <h3 className="text-xl font-serif text-gray-900 lowercase first-letter:uppercase">Order Content</h3>
              <div className="space-y-4">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm border-b border-gray-50 pb-4">
                    <span className="text-gray-500 font-serif">
                      {item.name ?? "Item"} × {item.quantity ?? 0}
                    </span>
                    <span className="text-gray-900 font-bold">
                      Rs. {(((item.price ?? 0) as number) * (item.quantity ?? 0)).toLocaleString()}
                    </span>
                  </div>
                ))}
                <div className="pt-4 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-1">Total</p>
                    <p className="text-2xl font-serif text-gray-900">Rs. {order.total_amount.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-green-700 uppercase tracking-widest border border-green-700/20 px-3 py-1">
                    <ShieldCheck className="w-3 h-3" />
                    Verified
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {trackingCode.trim() && !order && !loading && !urlResolving && !error && (
        <div className="mt-20 text-center py-20 border border-dashed border-gray-100">
          <Box className="w-12 h-12 text-gray-100 mx-auto mb-4" />
          <p className="text-sm text-gray-400 font-serif">Enter a valid Tracking ID to start tracking.</p>
        </div>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TrackingSearchContent />
    </Suspense>
  );
}
