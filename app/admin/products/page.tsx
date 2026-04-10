import type { Metadata } from "next";
import Link from "next/link";
import { ProductsPageClient } from "./ProductsPageClient";

export const metadata: Metadata = {
  title: "Products",
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
    | "bell"
    | "clock"
    | "eye";
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
    case "clock":
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
            d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
          />
          <path
            className={common}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 7.5v5l3 1.75"
          />
        </svg>
      );
    case "eye":
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
            d="M2.75 12s3.25-6.75 9.25-6.75S21.25 12 21.25 12 18 18.75 12 18.75 2.75 12 2.75 12Z"
          />
          <path
            className={common}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
          />
        </svg>
      );
  }
}

export default function AdminProductsPage() {
  const nav = [
    { label: "Overview", icon: "overview" as const, href: "/admin/dashboard" },
    { label: "Products", icon: "products" as const, href: "/admin/products" },
    { label: "Orders", icon: "orders" as const, href: "/admin/orders" },
    { label: "Payments", icon: "payments" as const, href: "/admin/payments" },
    { label: "Customers", icon: "customers" as const, href: "/admin/customers" },
    { label: "Settings", icon: "settings" as const, href: "/admin/settings" },
  ];

  const tabs = [
    { label: "Overview", href: "/admin/products" },
    { label: "Categories", href: "/admin/products/categories" },
    { label: "Items", href: "/admin/products/items" },
  ];

  return (
    <div className="h-dvh w-full overflow-hidden bg-[#f7faf4] text-[#191d19]">
      <div className="flex h-full w-full">
        <aside className="hidden h-full w-80 shrink-0 bg-[#f1f5ef] lg:flex lg:flex-col">
          <div className="px-7 pt-10 pb-6 flex items-center justify-center">
            <img
              src="/lakshara-logo.svg"
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
                  item.href === "/admin/products"
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
                Products
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

            <div className="flex items-center justify-between px-6 sm:px-10">
              <nav className="flex min-w-0 items-center gap-6 text-sm">
                {tabs.map((t) => {
                  const active = t.label === "Overview";
                  return (
                    <a
                      key={t.label}
                      href={t.href}
                      className={[
                        "relative py-4 opacity-80 hover:opacity-100",
                        active ? "opacity-100" : "",
                      ].join(" ")}
                    >
                      {t.label}
                      {active ? (
                        <span className="absolute left-0 right-0 bottom-0 h-[2px] rounded-full bg-[#191d19]" />
                      ) : null}
                    </a>
                  );
                })}
              </nav>

              <div className="flex items-center gap-5 text-sm">
                <button type="button" className="opacity-80 hover:opacity-100">
                  Bulk update prices
                </button>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 opacity-80 hover:opacity-100"
                >
                  <Icon name="clock" className="h-4 w-4" />
                  See changes
                </Link>
              </div>
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto px-6 py-8 sm:px-10">
            <ProductsPageClient />
          </main>
        </div>
      </div>
    </div>
  );
}

