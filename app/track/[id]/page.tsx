"use client";

import { useEffect, useState, use, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Box, CheckCircle2, Truck, ShieldCheck, ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";
import { getOrderByTrackingCode, type TrackedOrderRow } from "@/lib/tracking";
import { PIPELINE_STEPS, pipelineStepIndex } from "@/lib/tracking-ui";

export default function TrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<TrackedOrderRow | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const result = await getOrderByTrackingCode(supabase, id);
    if (result.ok) {
      setOrder(result.order);
      setTrackingCode(result.trackingCode);
    } else {
      setOrder(null);
      setTrackingCode(null);
    }
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await refresh();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, refresh]);

  const safeStepIndex = pipelineStepIndex(order?.pipeline_stage);

  useEffect(() => {
    if (!order?.id || !trackingCode) return;
    const channel = supabase
      .channel(`track-route-live-${order.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `id=eq.${order.id}` },
        () => void refresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_items", filter: `order_id=eq.${order.id}` },
        () => void refresh()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [order?.id, trackingCode, refresh]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-gray-400 tracking-widest uppercase text-sm">Tracking your package...</div>
      </div>
    );
  }

  if (!order || !trackingCode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
        <div className="text-center">
          <Box className="w-16 h-16 text-gray-100 mx-auto mb-6" />
          <h1 className="text-3xl font-serif text-gray-900 mb-4">Order not found</h1>
          <p className="text-gray-500 text-sm mb-8">Please check your tracking ID and try again.</p>
          <Link href="/" className="text-xs font-bold tracking-widest uppercase border-b border-black pb-1">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-12 md:py-24 px-6 md:px-12 lg:px-24">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-gray-400 hover:text-black transition-colors mb-12"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Shop
        </Link>

        <header className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <p className="text-[10px] font-bold tracking-[0.3em] text-green-700 uppercase mb-2">Real-time tracking</p>
              <h1 className="text-4xl font-serif text-gray-900">Tracking ID</h1>
              <p className="mt-2 font-mono text-lg font-semibold text-gray-900">{trackingCode}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Status</p>
              <p className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                {PIPELINE_STEPS[safeStepIndex].label}
              </p>
            </div>
          </div>
        </header>

        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 mb-12">
          <div className="relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 hidden md:block"></div>
            <div
              className="absolute top-1/2 left-0 h-1 bg-green-700 -translate-y-1/2 transition-all duration-1000 hidden md:block"
              style={{ width: `${(safeStepIndex / (PIPELINE_STEPS.length - 1)) * 100}%` }}
            ></div>

            <div className="relative flex flex-col md:flex-row justify-between gap-12 md:gap-0">
              {PIPELINE_STEPS.map((step, index) => {
                const isCompleted = index <= safeStepIndex;
                const isCurrent = index === safeStepIndex;
                const Icon = step.icon;

                return (
                  <div key={step.id} className="flex md:flex-col items-center gap-6 md:gap-4 relative z-10 md:w-1/4">
                    <div
                      className={`
                      w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-500
                      ${isCompleted ? "bg-green-700 text-white" : "bg-white border-2 border-gray-100 text-gray-300"}
                      ${isCurrent ? "ring-8 ring-green-700/5" : ""}
                    `}
                    >
                      {isCompleted && !isCurrent ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <Icon className="w-5 h-5 md:w-6 md:h-6" />
                      )}
                    </div>
                    <div className="text-left md:text-center">
                      <p
                        className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isCompleted ? "text-black" : "text-gray-300"}`}
                      >
                        Step 0{index + 1}
                      </p>
                      <p className={`text-sm font-semibold ${isCompleted ? "text-gray-900" : "text-gray-300"}`}>
                        {step.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl p-8 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Delivery Information</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <Mail className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Email Address</p>
                  <p className="text-sm font-medium text-gray-900">{order.email}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Truck className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Delivery Method</p>
                  <p className="text-sm font-medium text-gray-900">Standard Delivery (Door-to-Door)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Summary</h2>
            <div className="space-y-4 mb-6">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">
                    {item.name ?? "Item"} × {item.quantity ?? 0}
                  </span>
                  <span className="text-gray-900 font-semibold">
                    Rs. {(((item.price ?? 0) as number) * (item.quantity ?? 0)).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-6 border-t border-gray-50 flex justify-between items-end">
              <div>
                <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Total Amount</p>
                <p className="text-2xl font-serif text-gray-900">Rs. {order.total_amount.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase tracking-widest">
                <ShieldCheck className="w-3 h-3" />
                Paid
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
