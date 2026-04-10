import type { Metadata } from "next";
import Link from "next/link";
import { SalesOverview } from "./SalesOverview";
import { RecentOrdersLive } from "./RecentOrdersLive";

export const metadata: Metadata = {
  title: "Executive Dashboard",
};

function Icon({
  name,
  className,
}: {
  name:
    | "overview"
    | "products"
    | "orders"
    | "payments"
    | "customers"
    | "settings"
    | "bell";
  className?: string;
}) {
  const common = "stroke-current";
  switch (name) {
    case "overview":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          aria-hidden="true"
        >
          <path
            className={common}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 4.5h6.75v6.75H4.5V4.5Zm8.75 0H19.5v6.75h-6.25V4.5ZM4.5 13.25h6.75V19.5H4.5v-6.25Zm8.75 0H19.5V19.5h-6.25v-6.25Z"
          />
        </svg>
      );
    case "products":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          aria-hidden="true"
        >
          <path
            className={common}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.25 10.25 12 12.75l4.75-2.5"
          />
          <path
            className={common}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.25 10.25V16.5L12 19l4.75-2.5v-6.25L12 7.75l-4.75 2.5Z"
          />
          <path
            className={common}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 12.75V19"
          />
          <path
            className={common}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.75 9.5 14.5 12"
          />
        </svg>
      );
    case "orders":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          aria-hidden="true"
        >
          <path
            className={common}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.5 9.25h12l-1.1 10.25H8.6L7.5 9.25Z"
          />
          <path
            className={common}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 9.25 9.75 5.5h7.5L18 9.25"
          />
        </svg>
      );
    case "payments":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          aria-hidden="true"
        >
          <path
            className={common}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.75 7.25h14.5c.83 0 1.5.67 1.5 1.5v8.5c0 .83-.67 1.5-1.5 1.5H4.75c-.83 0-1.5-.67-1.5-1.5v-8.5c0-.83.67-1.5 1.5-1.5Z"
          />
          <path
            className={common}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.25 10h17.5"
          />
        </svg>
      );
    case "customers":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          aria-hidden="true"
        >
          <path
            className={common}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 19.5c0-2.49-2.01-4.5-4.5-4.5s-4.5 2.01-4.5 4.5"
          />
          <path
            className={common}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 12.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z"
          />
        </svg>
      );
    case "settings":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            className={common}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 7h12M6 12h12M6 17h12"
          />
          <circle className={common} cx="9" cy="7" r="1.6" strokeWidth="1.8" />
          <circle className={common} cx="15" cy="12" r="1.6" strokeWidth="1.8" />
          <circle className={common} cx="12" cy="17" r="1.6" strokeWidth="1.8" />
        </svg>
      );
    case "bell":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          aria-hidden="true"
        >
          <path
            className={common}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 21a2.25 2.25 0 0 0 2.2-1.5H9.8A2.25 2.25 0 0 0 12 21Z"
          />
          <path
            className={common}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18.25 17.5H5.75c1.25-1.25 1.25-3.25 1.25-5.25a5 5 0 0 1 10 0c0 2 0 4 1.25 5.25Z"
          />
        </svg>
      );
  }
}

export default function AdminDashboardPage() {
  const nav = [
    { label: "Overview", icon: "overview" as const, href: "/admin/dashboard" },
    { label: "Products", icon: "products" as const, href: "/admin/products" },
    { label: "Orders", icon: "orders" as const, href: "/admin/orders" },
    { label: "Payments", icon: "payments" as const, href: "/admin/payments" },
    { label: "Customers", icon: "customers" as const, href: "/admin/customers" },
    { label: "Settings", icon: "settings" as const, href: "/admin/settings" },
  ];

  return (
    <div className="h-dvh w-full overflow-hidden bg-[#f7faf4] text-[#191d19]">
      <div className="flex h-full w-full">
        <aside className="hidden h-full w-80 shrink-0 bg-[#f1f5ef] lg:flex lg:flex-col">
          <div className="px-7 pt-10 pb-6 flex items-center justify-center">
            <img
              src="/Lakshara.logo.svg"
              alt="Lakshara"
              className="h-16 w-auto max-w-[260px] object-contain"
            />
          </div>

          <nav className="mt-8 space-y-2 px-5">
            {nav.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={[
                  "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm",
                  item.href === "/admin/dashboard"
                    ? "bg-white/75"
                    : "hover:bg-white/60",
                ].join(" ")}
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/65 group-hover:bg-white/85">
                  <Icon name={item.icon} className="h-6 w-6 opacity-80" />
                </span>
                <span className="opacity-90">{item.label}</span>
              </a>
            ))}
          </nav>

          <div className="mt-auto px-6 pb-7">
            <div className="flex items-center gap-3 rounded-2xl bg-white/60 px-4 py-4">
              <div className="h-10 w-10 rounded-xl bg-[#033c37] text-white grid place-items-center text-sm font-semibold">
                CA
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold leading-tight">
                  Curator Admin
                </div>
                <div className="text-xs tracking-wide uppercase opacity-70">
                  System manager
                </div>
              </div>
            </div>
            <Link
              href="/"
              className="mt-3 inline-flex w-full items-center justify-center rounded-2xl bg-white/60 px-4 py-2.5 text-sm font-semibold opacity-85 hover:bg-white/80 hover:opacity-100"
            >
              Log out
            </Link>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 bg-[#f7faf4]">
            <div className="flex items-center justify-between px-6 py-4 sm:px-10">
              <div className="text-base font-semibold tracking-tight">
                Overview
              </div>
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-2xl bg-white/65 hover:bg-white/80"
                aria-label="Notifications"
              >
                <Icon name="bell" className="h-6 w-6 opacity-80" />
              </button>
            </div>
            <div className="h-[1px] bg-black/10" />
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto px-6 pb-10 sm:px-10">
            <section className="mt-2 grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="rounded-3xl bg-white/70 px-7 py-6">
              <div className="text-[10px] tracking-[0.2em] uppercase opacity-70">
                Total revenue
              </div>
              <div className="mt-3 text-4xl font-semibold tabular-nums">
                $128,430
              </div>
              <div className="mt-3 text-sm">
                <span className="font-semibold text-[#2f6b2a]">+12.4%</span>{" "}
                <span className="opacity-70">from last month</span>
              </div>
            </div>

            <div className="rounded-3xl bg-[#033c37] px-7 py-6 text-white shadow-[0_40px_80px_rgba(0,37,33,0.12)]">
              <div className="text-[10px] tracking-[0.2em] uppercase opacity-80">
                Total orders
              </div>
              <div className="mt-3 text-4xl font-semibold tabular-nums">
                1,842
              </div>
              <div className="mt-3 text-sm">
                <span className="font-semibold text-[#bdef86]">+8.1%</span>{" "}
                <span className="opacity-80">processed today</span>
              </div>
            </div>

            <div className="rounded-3xl bg-white/70 px-7 py-6">
              <div className="text-[10px] tracking-[0.2em] uppercase opacity-70">
                Active customers
              </div>
              <div className="mt-3 text-4xl font-semibold tabular-nums">
                4,210
              </div>
              <div className="mt-3 flex items-center gap-3 text-sm">
                <span className="rounded-full bg-[#e3eb36] px-2.5 py-1 text-[11px] font-semibold text-[#1c1d00]">
                  Premium
                </span>
                <span className="opacity-70">85% retention rate</span>
              </div>
            </div>
          </section>

            <SalesOverview />

            <section className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="flex items-baseline justify-between">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Recent Orders
                </h2>
                <a
                  href="/admin/orders"
                  className="text-xs tracking-[0.18em] uppercase opacity-70 hover:opacity-100"
                >
                  View all orders
                </a>
              </div>

              <RecentOrdersLive />
            </div>

            <div className="lg:col-span-4">
              <h2 className="text-2xl font-semibold tracking-tight">
                Payment History
              </h2>
              <div className="mt-5 space-y-4">
                {[
                  {
                    title: "Transfer to Main",
                    time: "Today · 2:45 PM",
                    amount: "-$1,200.00",
                    tone: "text-[#7a1f1f]",
                    badge: "Bank • 8842",
                    iconBg: "bg-white/65",
                  },
                  {
                    title: "Stripe Payout",
                    time: "Yesterday · 10:15 AM",
                    amount: "+$4,560.00",
                    tone: "text-[#2f6b2a]",
                    badge: "ID • STR-992",
                    iconBg: "bg-[#bdef86]/60",
                  },
                  {
                    title: "Refund Processed",
                    time: "Oct 10 · 4:20 PM",
                    amount: "-$45.00",
                    tone: "text-[#7a1f1f]",
                    badge: "Ref • RF-009",
                    iconBg: "bg-white/65",
                  },
                ].map((p) => (
                  <div
                    key={p.title}
                    className="rounded-3xl bg-white/70 px-5 py-4"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={[
                          "grid h-11 w-11 place-items-center rounded-2xl",
                          p.iconBg,
                        ].join(" ")}
                      >
                        <span className="text-sm font-semibold opacity-80">
                          ₵
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">
                              {p.title}
                            </div>
                            <div className="mt-1 text-xs opacity-70">
                              {p.time}
                            </div>
                          </div>
                          <div
                            className={[
                              "shrink-0 text-sm font-semibold tabular-nums",
                              p.tone,
                            ].join(" ")}
                          >
                            {p.amount}
                          </div>
                        </div>
                        <div className="mt-2 text-[11px] tracking-wide uppercase opacity-60">
                          {p.badge}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
          </main>
        </div>
      </div>
    </div>
  );
}

