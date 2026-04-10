"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type CustomerTag = "vip" | "new" | "at_risk";

type CustomerRow = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  country?: string;
  ordersCount: number;
  lifetimeValueLkr: number;
  lastOrderId?: string;
  lastOrderDate?: string;
  tag?: CustomerTag;
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

function TagBadge({ tag }: { tag: CustomerTag }) {
  const label = tag === "vip" ? "VIP" : tag === "new" ? "New" : "At risk";
  const cls =
    tag === "vip"
      ? "bg-[#033c37]/90 text-white"
      : tag === "new"
        ? "bg-[#bdef86]/70 text-[#002521]"
        : "bg-[#ef4444]/15 text-[#7a1f1f]";

  return (
    <span className={["inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold", cls].join(" ")}>
      {label}
    </span>
  );
}

const SAMPLE_CUSTOMERS: CustomerRow[] = [
  {
    id: "CUST-10012",
    name: "Elena Rodriguez",
    email: "elena.rodriguez@example.com",
    country: "ES",
    ordersCount: 4,
    lifetimeValueLkr: 78250,
    lastOrderId: "#ORD-2845",
    lastOrderDate: "17/03/2026",
    tag: "vip",
  },
  {
    id: "CUST-10019",
    name: "Amara Wickramasinghe",
    email: "amara.w@example.com",
    country: "LK",
    ordersCount: 2,
    lifetimeValueLkr: 21400,
    lastOrderId: "#ORD-2849",
    lastOrderDate: "19/03/2026",
    tag: "new",
  },
  {
    id: "CUST-10008",
    name: "Nimal Perera",
    email: "nimal.perera@example.com",
    country: "LK",
    ordersCount: 7,
    lifetimeValueLkr: 105600,
    lastOrderId: "#ORD-2851",
    lastOrderDate: "31/03/2026",
  },
  {
    id: "CUST-10003",
    name: "Saman Kumara",
    email: "saman.k@example.com",
    country: "LK",
    ordersCount: 1,
    lifetimeValueLkr: 4500,
    lastOrderId: "#ORD-2838",
    lastOrderDate: "15/03/2026",
    tag: "at_risk",
  },
  {
    id: "CUST-10027",
    name: "Priya Fernando",
    email: "priya.fernando@example.com",
    country: "LK",
    ordersCount: 3,
    lifetimeValueLkr: 36200,
    lastOrderId: "#ORD-2832",
    lastOrderDate: "14/03/2026",
  },
];

export function CustomersPageClient() {
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<CustomerTag | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SAMPLE_CUSTOMERS.filter((c) => {
      if (tagFilter !== "all" && c.tag !== tagFilter) return false;
      if (!q) return true;
      return (
        c.id.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.lastOrderId ?? "").toLowerCase().includes(q)
      );
    });
  }, [query, tagFilter]);

  const totals = useMemo(() => {
    const vip = SAMPLE_CUSTOMERS.filter((c) => c.tag === "vip").length;
    const newest = SAMPLE_CUSTOMERS.filter((c) => c.tag === "new").length;
    const atRisk = SAMPLE_CUSTOMERS.filter((c) => c.tag === "at_risk").length;
    const ltv = SAMPLE_CUSTOMERS.reduce((s, c) => s + c.lifetimeValueLkr, 0);
    return { vip, newest, atRisk, count: SAMPLE_CUSTOMERS.length, ltv };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-10 bg-[#f7faf4]">
        <div className="flex items-center justify-between px-6 py-4 sm:px-10">
          <div className="min-w-0">
            <div className="text-base font-semibold tracking-tight">Customers</div>
            <div className="mt-1 text-xs opacity-65">
              Customer identities, contact details, and lifetime value.
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
              placeholder="Customer, email, ID, or last order…"
              aria-label="Search customers"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {(
              [
                { key: "all" as const, label: "All" },
                { key: "vip" as const, label: "VIP" },
                { key: "new" as const, label: "New" },
                { key: "at_risk" as const, label: "At risk" },
              ] as const
            ).map(({ key, label }) => {
              const active = tagFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTagFilter(key)}
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
              Customers
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
              {totals.count}
            </div>
            <div className="mt-1 text-xs opacity-65">Sample records</div>
          </div>
          <div className="rounded-3xl bg-white/70 px-5 py-5 shadow-[0_24px_60px_rgba(0,37,33,0.06)]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-55">
              VIP
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
              {totals.vip}
            </div>
            <div className="mt-1 text-xs opacity-65">High value customers</div>
          </div>
          <div className="rounded-3xl bg-white/70 px-5 py-5 shadow-[0_24px_60px_rgba(0,37,33,0.06)]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-55">
              New
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
              {totals.newest}
            </div>
            <div className="mt-1 text-xs opacity-65">Recently added</div>
          </div>
          <div className="rounded-3xl bg-white/70 px-5 py-5 shadow-[0_24px_60px_rgba(0,37,33,0.06)]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-55">
              LTV (sample)
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
              {formatLkr(totals.ltv)}
            </div>
            <div className="mt-1 text-xs opacity-65">Sum of sample lifetime value</div>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl bg-white/70 shadow-[0_30px_70px_rgba(0,37,33,0.08)]">
          <div className="flex items-center justify-between gap-4 border-b border-black/8 px-5 py-4 sm:px-6">
            <div>
              <div className="text-sm font-semibold">Customer directory</div>
              <div className="mt-0.5 text-xs opacity-65">
                Showing {filtered.length} of {SAMPLE_CUSTOMERS.length}
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
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-black/8 text-[10px] font-semibold uppercase tracking-[0.16em] opacity-55">
                  <th className="px-5 py-3 sm:px-6">Customer</th>
                  <th className="px-5 py-3 sm:px-6">Email</th>
                  <th className="px-5 py-3 sm:px-6">Country</th>
                  <th className="px-5 py-3 sm:px-6 text-right">Orders</th>
                  <th className="px-5 py-3 sm:px-6 text-right">Lifetime value</th>
                  <th className="px-5 py-3 sm:px-6">Last order</th>
                  <th className="px-5 py-3 sm:px-6">Tag</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-black/[0.06] last:border-0 hover:bg-white/40"
                  >
                    <td className="px-5 py-3.5 sm:px-6">
                      <div className="font-semibold">{c.name}</div>
                      <div className="mt-0.5 text-xs opacity-65 tabular-nums">{c.id}</div>
                    </td>
                    <td className="px-5 py-3.5 sm:px-6">{c.email}</td>
                    <td className="px-5 py-3.5 sm:px-6 text-xs opacity-75">
                      {c.country ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold tabular-nums sm:px-6">
                      {c.ordersCount}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold tabular-nums sm:px-6">
                      {formatLkr(c.lifetimeValueLkr)}
                    </td>
                    <td className="px-5 py-3.5 sm:px-6">
                      <div className="font-semibold tabular-nums">{c.lastOrderId ?? "—"}</div>
                      <div className="mt-0.5 text-xs opacity-65">{c.lastOrderDate ?? ""}</div>
                    </td>
                    <td className="px-5 py-3.5 sm:px-6">
                      {c.tag ? <TagBadge tag={c.tag} /> : <span className="text-xs opacity-60">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm opacity-70">
              No customers match your search or filters.
            </div>
          ) : null}
        </div>
      </main>
    </>
  );
}

