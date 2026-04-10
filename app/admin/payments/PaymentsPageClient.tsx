"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type PaymentStatus = "completed" | "pending" | "failed";

type PaymentRow = {
  id: string;
  orderId: string;
  customer: string;
  amountLkr: number;
  method: "Card" | "Bank transfer" | "COD";
  status: PaymentStatus;
  createdAt: string;
};

function formatLkr(n: number) {
  return `Rs ${n.toLocaleString("en-LK")}`;
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 21a2.25 2.25 0 0 0 2.2-1.5H9.8A2.25 2.25 0 0 0 12 21Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.25 17.5H5.75c1.25-1.25 1.25-3.25 1.25-5.25a5 5 0 0 1 10 0c0 2 0 4 1.25 5.25Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M10.5 18.25a7.75 7.75 0 1 1 0-15.5 7.75 7.75 0 0 1 0 15.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 16.5 21 21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M2.75 12s3.25-6.75 9.25-6.75S21.25 12 21.25 12 18 18.75 12 18.75 2.75 12 2.75 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  const label =
    status === "completed" ? "Completed" : status === "pending" ? "Pending" : "Failed";
  const cls =
    status === "completed"
      ? "bg-[#bdef86]/70 text-[#002521]"
      : status === "pending"
        ? "bg-[#e3eb36]/40 text-[#1c1d00]"
        : "bg-[#ef4444]/15 text-[#7a1f1f]";

  return (
    <span className={["inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold", cls].join(" ")}>
      {label}
    </span>
  );
}

const SAMPLE_PAYMENTS: PaymentRow[] = [
  {
    id: "PM-10421",
    orderId: "#ORD-2849",
    customer: "Amara Wickramasinghe",
    amountLkr: 12450,
    method: "Card",
    status: "completed",
    createdAt: "19/03/2026 · 14:22",
  },
  {
    id: "PM-10420",
    orderId: "#ORD-2851",
    customer: "Nimal Perera",
    amountLkr: 6425,
    method: "Bank transfer",
    status: "pending",
    createdAt: "31/03/2026 · 09:05",
  },
  {
    id: "PM-10418",
    orderId: "#ORD-2845",
    customer: "Elena Rodriguez",
    amountLkr: 21025,
    method: "Card",
    status: "completed",
    createdAt: "17/03/2026 · 11:40",
  },
  {
    id: "PM-10412",
    orderId: "#ORD-2838",
    customer: "Saman Kumara",
    amountLkr: 4500,
    method: "COD",
    status: "completed",
    createdAt: "15/03/2026 · 16:18",
  },
  {
    id: "PM-10409",
    orderId: "#ORD-2832",
    customer: "Priya Fernando",
    amountLkr: 8920,
    method: "Card",
    status: "failed",
    createdAt: "14/03/2026 · 08:12",
  },
  {
    id: "PM-10402",
    orderId: "#ORD-2829",
    customer: "James Olsen",
    amountLkr: 15600,
    method: "Bank transfer",
    status: "completed",
    createdAt: "12/03/2026 · 19:33",
  },
];

export function PaymentsPageClient() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SAMPLE_PAYMENTS.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        p.id.toLowerCase().includes(q) ||
        p.orderId.toLowerCase().includes(q) ||
        p.customer.toLowerCase().includes(q)
      );
    });
  }, [query, statusFilter]);

  const totals = useMemo(() => {
    const completed = SAMPLE_PAYMENTS.filter((p) => p.status === "completed");
    const settled = completed.reduce((s, p) => s + p.amountLkr, 0);
    const pending = SAMPLE_PAYMENTS.filter((p) => p.status === "pending").length;
    const failed = SAMPLE_PAYMENTS.filter((p) => p.status === "failed").length;
    return { settled, pending, failed, count: SAMPLE_PAYMENTS.length };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-10 bg-[#f7faf4]">
        <div className="flex items-center justify-between px-6 py-4 sm:px-10">
          <div className="min-w-0">
            <div className="text-base font-semibold tracking-tight">Payments</div>
            <div className="mt-1 text-xs opacity-65">
              Settlement activity, methods, and order references in one place.
            </div>
          </div>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-2xl bg-white/65 hover:bg-white/80"
            aria-label="Notifications"
          >
            <BellIcon className="h-6 w-6 opacity-80" />
          </button>
        </div>
        <div className="h-[1px] bg-black/10" />

        <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl bg-white/70 px-4 py-3 sm:max-w-md">
            <span className="opacity-60" aria-hidden="true">
              <SearchIcon />
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:opacity-60"
              placeholder="Payment ID, order, or customer…"
              aria-label="Search payments"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {(
              [
                { key: "all" as const, label: "All" },
                { key: "completed" as const, label: "Completed" },
                { key: "pending" as const, label: "Pending" },
                { key: "failed" as const, label: "Failed" },
              ] as const
            ).map(({ key, label }) => {
              const active = statusFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={[
                    "rounded-2xl px-4 py-2 text-sm font-semibold transition-colors",
                    active
                      ? "bg-[#033c37] text-white shadow-[0_12px_28px_rgba(0,37,33,0.18)]"
                      : "bg-white/70 text-[#191d19] hover:bg-white/85",
                  ].join(" ")}
                  aria-pressed={active}
                >
                  {label}
                </button>
              );
            })}

            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-2xl bg-white/70 px-4 py-2 text-sm font-semibold hover:bg-white/85"
            >
              <EyeIcon />
              View online
            </Link>
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-6 pb-10 pt-8 sm:px-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl bg-white/70 px-5 py-5 shadow-[0_24px_60px_rgba(0,37,33,0.06)]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-55">
              Settled (sample)
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
              {formatLkr(totals.settled)}
            </div>
            <div className="mt-1 text-xs opacity-65">
              From completed payments in this list
            </div>
          </div>
          <div className="rounded-3xl bg-white/70 px-5 py-5 shadow-[0_24px_60px_rgba(0,37,33,0.06)]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-55">
              Pending
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
              {totals.pending}
            </div>
            <div className="mt-1 text-xs opacity-65">Awaiting confirmation</div>
          </div>
          <div className="rounded-3xl bg-white/70 px-5 py-5 shadow-[0_24px_60px_rgba(0,37,33,0.06)]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-55">
              Failed
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
              {totals.failed}
            </div>
            <div className="mt-1 text-xs opacity-65">Needs follow-up</div>
          </div>
          <div className="rounded-3xl bg-white/70 px-5 py-5 shadow-[0_24px_60px_rgba(0,37,33,0.06)]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-55">
              Records
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
              {totals.count}
            </div>
            <div className="mt-1 text-xs opacity-65">Sample transactions</div>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl bg-white/70 shadow-[0_30px_70px_rgba(0,37,33,0.08)]">
          <div className="flex items-center justify-between gap-4 border-b border-black/8 px-5 py-4 sm:px-6">
            <div>
              <div className="text-sm font-semibold">Recent transactions</div>
              <div className="mt-0.5 text-xs opacity-65">
                Showing {filtered.length} of {SAMPLE_PAYMENTS.length}
              </div>
            </div>
            <button
              type="button"
              className="rounded-2xl bg-[#f1f5ef] px-4 py-2 text-sm font-semibold opacity-60"
              disabled
            >
              Export CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-black/8 text-[10px] font-semibold uppercase tracking-[0.16em] opacity-55">
                  <th className="px-5 py-3 sm:px-6">Payment</th>
                  <th className="px-5 py-3 sm:px-6">Order</th>
                  <th className="px-5 py-3 sm:px-6">Customer</th>
                  <th className="px-5 py-3 sm:px-6">Method</th>
                  <th className="px-5 py-3 sm:px-6 text-right">Amount</th>
                  <th className="px-5 py-3 sm:px-6">Status</th>
                  <th className="px-5 py-3 sm:px-6">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-black/[0.06] last:border-0 hover:bg-white/40"
                  >
                    <td className="px-5 py-3.5 font-semibold tabular-nums sm:px-6">
                      {p.id}
                    </td>
                    <td className="px-5 py-3.5 tabular-nums opacity-90 sm:px-6">
                      {p.orderId}
                    </td>
                    <td className="max-w-[200px] truncate px-5 py-3.5 sm:max-w-none sm:px-6">
                      {p.customer}
                    </td>
                    <td className="px-5 py-3.5 sm:px-6">{p.method}</td>
                    <td className="px-5 py-3.5 text-right font-semibold tabular-nums sm:px-6">
                      {formatLkr(p.amountLkr)}
                    </td>
                    <td className="px-5 py-3.5 sm:px-6">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-xs opacity-75 sm:px-6">
                      {p.createdAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm opacity-70">
              No payments match your search or filters.
            </div>
          ) : null}
        </div>
      </main>
    </>
  );
}

