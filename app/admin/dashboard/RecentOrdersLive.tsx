"use client";

import { supabase } from "@/lib/supabaseClient";
import { useEffect, useMemo, useState } from "react";

type RecentOrder = {
  id: string;
  displayId: string;
  receivedAt: string;
  customer: string;
  initials: string;
  status: string;
  statusTone: string;
  total: number;
};

function formatOrderDisplayId(uuid: string) {
  return `#ORD-${uuid.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

function formatPrettyDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-LK", { year: "numeric", month: "short", day: "2-digit" });
}

function toneForStatus(status: string | null | undefined) {
  const s = (status ?? "").trim().toLowerCase();
  if (s.includes("deliver")) return "bg-[#bdef86]/70 text-[#002521]";
  if (s.includes("ship") || s.includes("ready")) return "bg-[#e3eb36]/40 text-[#1c1d00]";
  if (s.includes("cancel") || s.includes("fail")) return "bg-[#ef4444]/15 text-[#7a1f1f]";
  return "bg-[#e6e9e3] text-[#404847]";
}

function initialsFromName(name: string) {
  const parts = name
    .split(" ")
    .map((p) => p.trim())
    .filter(Boolean);
  const a = parts[0]?.[0] ?? "?";
  const b = parts[1]?.[0] ?? "";
  return `${a}${b}`.toUpperCase();
}

export function RecentOrdersLive({ limit = 6 }: { limit?: number }) {
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [rows, setRows] = useState<RecentOrder[]>([]);

  async function load() {
    setErrorText(null);
    setLoading(true);
    const res = await supabase
      .from("orders")
      .select("id,email,total_amount,status,created_at,pipeline_stage")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (res.error) {
      setErrorText(res.error.message);
      setRows([]);
      setLoading(false);
      return;
    }

    const mapped: RecentOrder[] = (res.data ?? []).map((r) => {
      const email = (r.email ?? "").trim();
      const customer = email || "Guest";
      const status = (r.pipeline_stage ?? r.status ?? "Pending").toString();
      return {
        id: r.id,
        displayId: formatOrderDisplayId(r.id),
        receivedAt: formatPrettyDate(r.created_at),
        customer,
        initials: initialsFromName(customer),
        status,
        statusTone: toneForStatus(status),
        total: Number(r.total_amount ?? 0),
      };
    });

    setRows(mapped);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-dashboard-recent-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => void load()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  const header = useMemo(
    () => (
      <div className="grid grid-cols-5 gap-3 px-3 py-2 text-[10px] tracking-[0.2em] uppercase opacity-60">
        <div>Order ID</div>
        <div>Date</div>
        <div>Customer</div>
        <div>Status</div>
        <div className="text-right">Total</div>
      </div>
    ),
    []
  );

  if (loading) {
    return (
      <div className="mt-5 rounded-3xl bg-white/70 p-5">
        {header}
        <div className="mt-4 text-sm opacity-70">Loading recent orders…</div>
      </div>
    );
  }

  if (errorText) {
    return (
      <div className="mt-5 rounded-3xl bg-white/70 p-5">
        {header}
        <div className="mt-4 rounded-2xl bg-white/55 px-4 py-3 text-sm">
          <div className="font-semibold text-[#7a1c1c]">Couldn’t load recent orders</div>
          <div className="mt-1 opacity-70">{errorText}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-3xl bg-white/70 p-5">
      {header}

      <div className="mt-3 space-y-3">
        {rows.length === 0 ? (
          <div className="rounded-2xl bg-white/55 px-4 py-4 text-sm opacity-70">
            No recent orders yet.
          </div>
        ) : (
          rows.map((row) => (
            <div key={row.id} className="rounded-2xl bg-white/55 px-3 py-3">
              <div className="grid grid-cols-5 items-center gap-3">
                <div className="text-sm font-semibold">{row.displayId}</div>
                <div className="text-sm opacity-80">{row.receivedAt}</div>
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#f1f5ef] text-xs font-semibold">
                    {row.initials}
                  </div>
                  <div className="truncate text-sm opacity-90">{row.customer}</div>
                </div>
                <div>
                  <span
                    className={[
                      "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold",
                      row.statusTone,
                    ].join(" ")}
                  >
                    {row.status}
                  </span>
                </div>
                <div className="text-right text-sm font-semibold tabular-nums">
                  Rs {row.total.toLocaleString("en-LK", { maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

