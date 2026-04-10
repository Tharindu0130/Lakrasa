"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type DeliveryMode = "courier" | "pickup";
type OfferType = "percentage" | "fixed" | "free_shipping";

type SettingsDraft = {
  store: {
    storeName: string;
    supportEmail: string;
    currency: "LKR" | "USD";
    maintenanceMode: boolean;
  };
  ads: {
    heroEnabled: boolean;
    heroTitle: string;
    heroSubtitle: string;
    heroCtaLabel: string;
    heroCtaHref: string;
    topBarEnabled: boolean;
    topBarText: string;
  };
  offers: {
    enabled: boolean;
    offerName: string;
    offerCode: string;
    type: OfferType;
    value: number;
    minOrderLkr: number;
    startsAt: string;
    endsAt: string;
    limitPerCustomer: number;
  };
  delivery: {
    enabled: boolean;
    mode: DeliveryMode;
    allowCOD: boolean;
    freeShippingEnabled: boolean;
    freeShippingThresholdLkr: number;
    flatRateEnabled: boolean;
    flatRateLkr: number;
    etaMinDays: number;
    etaMaxDays: number;
    notes: string;
  };
};

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

function FieldLabel({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-55">
        {title}
      </div>
      {hint ? <div className="mt-1 text-xs opacity-65">{hint}</div> : null}
    </div>
  );
}

function toNumber(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-2xl bg-white/60 px-4 py-3 text-left hover:bg-white/75"
      aria-pressed={checked}
    >
      <div className="min-w-0">
        <div className="text-sm font-semibold">{label}</div>
        {description ? <div className="mt-1 text-xs opacity-65">{description}</div> : null}
      </div>
      <span
        className={[
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-[#033c37]" : "bg-black/15",
        ].join(" ")}
        aria-hidden="true"
      >
        <span
          className={[
            "h-6 w-6 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-[2px]",
          ].join(" ")}
        />
      </span>
    </button>
  );
}

const initialDraft: SettingsDraft = {
  store: {
    storeName: "Lakrasa",
    supportEmail: "support@lakrasa.com",
    currency: "LKR",
    maintenanceMode: false,
  },
  ads: {
    heroEnabled: true,
    heroTitle: "Estate Selections · April",
    heroSubtitle: "Small-batch spice & tea drops, curated weekly.",
    heroCtaLabel: "Shop the drop",
    heroCtaHref: "/",
    topBarEnabled: true,
    topBarText: "Free shipping above Rs 15,000 · Colombo & suburbs",
  },
  offers: {
    enabled: true,
    offerName: "Welcome Offer",
    offerCode: "LAKRASA10",
    type: "percentage",
    value: 10,
    minOrderLkr: 5000,
    startsAt: "2026-04-01",
    endsAt: "2026-05-01",
    limitPerCustomer: 1,
  },
  delivery: {
    enabled: true,
    mode: "courier",
    allowCOD: true,
    freeShippingEnabled: true,
    freeShippingThresholdLkr: 15000,
    flatRateEnabled: true,
    flatRateLkr: 950,
    etaMinDays: 1,
    etaMaxDays: 4,
    notes: "Deliveries are dispatched Mon–Sat. Same-day available in select areas.",
  },
};

export function SettingsPageClient() {
  const [draft, setDraft] = useState<SettingsDraft>(initialDraft);
  const [active, setActive] = useState<"ads" | "offers" | "delivery" | "store">("ads");

  const sectionTitle = useMemo(() => {
    return active === "ads"
      ? "Ads & Banners"
      : active === "offers"
        ? "Offers & Discounts"
        : active === "delivery"
          ? "Delivery & Fulfillment"
          : "Store Settings";
  }, [active]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="sticky top-0 z-10 bg-[#f7faf4]">
        <div className="flex items-center justify-between px-6 py-4 sm:px-10">
          <div className="min-w-0">
            <div className="text-base font-semibold tracking-tight">Settings</div>
            <div className="mt-1 text-xs opacity-65">
              Configure homepage ads, offers, and delivery rules without touching code.
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
      </div>

      <div className="px-6 pb-10 pt-8 sm:px-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="rounded-3xl bg-[#f1f5ef] px-5 py-5 shadow-[0_30px_70px_rgba(0,37,33,0.08)]">
              <div className="text-sm font-semibold">Configuration</div>
              <div className="mt-1 text-xs opacity-65">
                Pick a section and adjust toggles & rules.
              </div>

              <div className="mt-4 space-y-2">
                {(
                  [
                    { key: "ads" as const, label: "Ads & Banners" },
                    { key: "offers" as const, label: "Offers & Discounts" },
                    { key: "delivery" as const, label: "Delivery" },
                    { key: "store" as const, label: "Store" },
                  ] as const
                ).map((t) => {
                  const isActive = active === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setActive(t.key)}
                      className={[
                        "w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-colors",
                        isActive ? "bg-white/80 shadow" : "bg-white/55 hover:bg-white/70",
                      ].join(" ")}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-2xl bg-white/60 px-4 py-2 text-sm font-semibold hover:bg-white/80"
                >
                  <EyeIcon />
                  Preview storefront
                </Link>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Toggle
                checked={!draft.store.maintenanceMode}
                onChange={(v) =>
                  setDraft((d) => ({ ...d, store: { ...d.store, maintenanceMode: !v } }))
                }
                label="Storefront open"
                description="If off, customer pages should show a maintenance screen."
              />
              <Toggle
                checked={draft.delivery.allowCOD}
                onChange={(v) =>
                  setDraft((d) => ({ ...d, delivery: { ...d.delivery, allowCOD: v } }))
                }
                label="Cash on delivery"
                description="Enable COD as an available payment method at checkout."
              />
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-2xl font-semibold tracking-tight">{sectionTitle}</div>
                <div className="mt-1 text-xs opacity-65">
                  Draft changes are local only (UI). Hook to DB later.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDraft(initialDraft)}
                  className="rounded-2xl bg-white/70 px-4 py-2 text-sm font-semibold hover:bg-white/85"
                >
                  Reset
                </button>
                <button
                  type="button"
                  className="rounded-2xl bg-[#033c37] px-5 py-2 text-sm font-semibold text-white opacity-60"
                  aria-disabled="true"
                >
                  Save changes
                </button>
              </div>
            </div>

            {active === "ads" ? (
              <div className="mt-5 space-y-5">
                <div className="rounded-3xl bg-white/70 p-6 shadow-[0_30px_70px_rgba(0,37,33,0.08)]">
                  <div className="flex items-start justify-between gap-4">
                    <FieldLabel
                      title="Hero banner"
                      hint="Controls the main homepage banner (title, subtitle, CTA)."
                    />
                    <Toggle
                      checked={draft.ads.heroEnabled}
                      onChange={(v) => setDraft((d) => ({ ...d, ads: { ...d.ads, heroEnabled: v } }))}
                      label={draft.ads.heroEnabled ? "Enabled" : "Disabled"}
                    />
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="block">
                      <FieldLabel title="Title" />
                      <input
                        value={draft.ads.heroTitle}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, ads: { ...d.ads, heroTitle: e.target.value } }))
                        }
                        className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none"
                      />
                    </label>
                    <label className="block">
                      <FieldLabel title="CTA label" />
                      <input
                        value={draft.ads.heroCtaLabel}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            ads: { ...d.ads, heroCtaLabel: e.target.value },
                          }))
                        }
                        className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none"
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <FieldLabel title="Subtitle" />
                      <input
                        value={draft.ads.heroSubtitle}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            ads: { ...d.ads, heroSubtitle: e.target.value },
                          }))
                        }
                        className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none"
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <FieldLabel title="CTA link" hint="Example: /collections/new-drop" />
                      <input
                        value={draft.ads.heroCtaHref}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, ads: { ...d.ads, heroCtaHref: e.target.value } }))
                        }
                        className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none"
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-3xl bg-white/70 p-6 shadow-[0_30px_70px_rgba(0,37,33,0.08)]">
                  <div className="flex items-start justify-between gap-4">
                    <FieldLabel
                      title="Top bar announcement"
                      hint="Small banner above the storefront (shipping, promos, announcements)."
                    />
                    <Toggle
                      checked={draft.ads.topBarEnabled}
                      onChange={(v) =>
                        setDraft((d) => ({ ...d, ads: { ...d.ads, topBarEnabled: v } }))
                      }
                      label={draft.ads.topBarEnabled ? "Enabled" : "Disabled"}
                    />
                  </div>
                  <label className="mt-5 block">
                    <FieldLabel title="Text" />
                    <input
                      value={draft.ads.topBarText}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, ads: { ...d.ads, topBarText: e.target.value } }))
                      }
                      className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none"
                    />
                  </label>
                </div>
              </div>
            ) : null}

            {active === "offers" ? (
              <div className="mt-5 space-y-5">
                <div className="rounded-3xl bg-white/70 p-6 shadow-[0_30px_70px_rgba(0,37,33,0.08)]">
                  <div className="flex items-start justify-between gap-4">
                    <FieldLabel
                      title="Offer rule"
                      hint="Create a promotion using a code and eligibility rules."
                    />
                    <Toggle
                      checked={draft.offers.enabled}
                      onChange={(v) => setDraft((d) => ({ ...d, offers: { ...d.offers, enabled: v } }))}
                      label={draft.offers.enabled ? "Enabled" : "Disabled"}
                    />
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="block">
                      <FieldLabel title="Offer name" />
                      <input
                        value={draft.offers.offerName}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, offers: { ...d.offers, offerName: e.target.value } }))
                        }
                        className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none"
                      />
                    </label>
                    <label className="block">
                      <FieldLabel title="Code" hint="What the customer types at checkout." />
                      <input
                        value={draft.offers.offerCode}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, offers: { ...d.offers, offerCode: e.target.value } }))
                        }
                        className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none"
                      />
                    </label>

                    <label className="block">
                      <FieldLabel title="Type" />
                      <select
                        value={draft.offers.type}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            offers: { ...d.offers, type: e.target.value as OfferType },
                          }))
                        }
                        className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed amount (LKR)</option>
                        <option value="free_shipping">Free shipping</option>
                      </select>
                    </label>

                    <label className="block">
                      <FieldLabel
                        title={draft.offers.type === "percentage" ? "Value (%)" : "Value (LKR)"}
                        hint={draft.offers.type === "free_shipping" ? "Ignored for free shipping offers." : undefined}
                      />
                      <input
                        inputMode="numeric"
                        value={String(draft.offers.value)}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            offers: { ...d.offers, value: toNumber(e.target.value) },
                          }))
                        }
                        className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none tabular-nums"
                      />
                    </label>

                    <label className="block">
                      <FieldLabel title="Min order (LKR)" />
                      <input
                        inputMode="numeric"
                        value={String(draft.offers.minOrderLkr)}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            offers: { ...d.offers, minOrderLkr: toNumber(e.target.value) },
                          }))
                        }
                        className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none tabular-nums"
                      />
                    </label>

                    <label className="block">
                      <FieldLabel title="Limit per customer" />
                      <input
                        inputMode="numeric"
                        value={String(draft.offers.limitPerCustomer)}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            offers: { ...d.offers, limitPerCustomer: toNumber(e.target.value) },
                          }))
                        }
                        className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none tabular-nums"
                      />
                    </label>

                    <label className="block">
                      <FieldLabel title="Starts at" />
                      <input
                        type="date"
                        value={draft.offers.startsAt}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, offers: { ...d.offers, startsAt: e.target.value } }))
                        }
                        className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none"
                      />
                    </label>
                    <label className="block">
                      <FieldLabel title="Ends at" />
                      <input
                        type="date"
                        value={draft.offers.endsAt}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, offers: { ...d.offers, endsAt: e.target.value } }))
                        }
                        className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none"
                      />
                    </label>
                  </div>
                </div>
              </div>
            ) : null}

            {active === "delivery" ? (
              <div className="mt-5 space-y-5">
                <div className="rounded-3xl bg-white/70 p-6 shadow-[0_30px_70px_rgba(0,37,33,0.08)]">
                  <div className="flex items-start justify-between gap-4">
                    <FieldLabel
                      title="Delivery rules"
                      hint="Control enabled modes, pricing rules, free shipping, and ETA."
                    />
                    <Toggle
                      checked={draft.delivery.enabled}
                      onChange={(v) =>
                        setDraft((d) => ({ ...d, delivery: { ...d.delivery, enabled: v } }))
                      }
                      label={draft.delivery.enabled ? "Enabled" : "Disabled"}
                    />
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="block">
                      <FieldLabel title="Mode" hint="Courier means ship to address; pickup enables store pickup." />
                      <select
                        value={draft.delivery.mode}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            delivery: { ...d.delivery, mode: e.target.value as DeliveryMode },
                          }))
                        }
                        className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none"
                      >
                        <option value="courier">Courier</option>
                        <option value="pickup">Pickup</option>
                      </select>
                    </label>

                    <label className="block">
                      <FieldLabel title="ETA (days)" hint="Shown to customers on checkout/order confirmation." />
                      <div className="mt-2 grid grid-cols-2 gap-3">
                        <input
                          inputMode="numeric"
                          value={String(draft.delivery.etaMinDays)}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              delivery: { ...d.delivery, etaMinDays: toNumber(e.target.value) },
                            }))
                          }
                          className="w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none tabular-nums"
                          aria-label="Minimum ETA in days"
                        />
                        <input
                          inputMode="numeric"
                          value={String(draft.delivery.etaMaxDays)}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              delivery: { ...d.delivery, etaMaxDays: toNumber(e.target.value) },
                            }))
                          }
                          className="w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none tabular-nums"
                          aria-label="Maximum ETA in days"
                        />
                      </div>
                    </label>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="rounded-3xl bg-white/60 p-5">
                      <div className="text-sm font-semibold">Free shipping</div>
                      <div className="mt-1 text-xs opacity-65">Enable a cart threshold for free delivery.</div>
                      <div className="mt-4 space-y-3">
                        <Toggle
                          checked={draft.delivery.freeShippingEnabled}
                          onChange={(v) =>
                            setDraft((d) => ({
                              ...d,
                              delivery: { ...d.delivery, freeShippingEnabled: v },
                            }))
                          }
                          label={draft.delivery.freeShippingEnabled ? "Enabled" : "Disabled"}
                        />
                        <label className="block">
                          <FieldLabel title="Threshold (LKR)" />
                          <input
                            inputMode="numeric"
                            value={String(draft.delivery.freeShippingThresholdLkr)}
                            onChange={(e) =>
                              setDraft((d) => ({
                                ...d,
                                delivery: {
                                  ...d.delivery,
                                  freeShippingThresholdLkr: toNumber(e.target.value),
                                },
                              }))
                            }
                            className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none tabular-nums"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="rounded-3xl bg-white/60 p-5">
                      <div className="text-sm font-semibold">Flat rate</div>
                      <div className="mt-1 text-xs opacity-65">
                        Charge a standard delivery fee when free shipping doesn&apos;t apply.
                      </div>
                      <div className="mt-4 space-y-3">
                        <Toggle
                          checked={draft.delivery.flatRateEnabled}
                          onChange={(v) =>
                            setDraft((d) => ({
                              ...d,
                              delivery: { ...d.delivery, flatRateEnabled: v },
                            }))
                          }
                          label={draft.delivery.flatRateEnabled ? "Enabled" : "Disabled"}
                        />
                        <label className="block">
                          <FieldLabel title="Rate (LKR)" />
                          <input
                            inputMode="numeric"
                            value={String(draft.delivery.flatRateLkr)}
                            onChange={(e) =>
                              setDraft((d) => ({
                                ...d,
                                delivery: { ...d.delivery, flatRateLkr: toNumber(e.target.value) },
                              }))
                            }
                            className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none tabular-nums"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <label className="mt-5 block">
                    <FieldLabel title="Customer-facing delivery note" hint="Shown on checkout and order confirmation." />
                    <textarea
                      value={draft.delivery.notes}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          delivery: { ...d.delivery, notes: e.target.value },
                        }))
                      }
                      className="mt-2 min-h-28 w-full resize-none rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none"
                    />
                  </label>
                </div>
              </div>
            ) : null}

            {active === "store" ? (
              <div className="mt-5 space-y-5">
                <div className="rounded-3xl bg-white/70 p-6 shadow-[0_30px_70px_rgba(0,37,33,0.08)]">
                  <FieldLabel
                    title="Store identity"
                    hint="Used in receipts, email templates, and basic storefront metadata."
                  />

                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="block">
                      <FieldLabel title="Store name" />
                      <input
                        value={draft.store.storeName}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            store: { ...d.store, storeName: e.target.value },
                          }))
                        }
                        className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none"
                      />
                    </label>
                    <label className="block">
                      <FieldLabel title="Support email" />
                      <input
                        value={draft.store.supportEmail}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            store: { ...d.store, supportEmail: e.target.value },
                          }))
                        }
                        className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none"
                      />
                    </label>
                    <label className="block">
                      <FieldLabel title="Currency" hint="What the storefront displays for totals." />
                      <select
                        value={draft.store.currency}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            store: { ...d.store, currency: e.target.value as SettingsDraft["store"]["currency"] },
                          }))
                        }
                        className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none"
                      >
                        <option value="LKR">LKR</option>
                        <option value="USD">USD</option>
                      </select>
                    </label>
                    <div className="pt-6">
                      <Toggle
                        checked={draft.store.maintenanceMode}
                        onChange={(v) =>
                          setDraft((d) => ({ ...d, store: { ...d.store, maintenanceMode: v } }))
                        }
                        label={draft.store.maintenanceMode ? "Maintenance mode ON" : "Maintenance mode OFF"}
                        description="When ON, customer pages should be blocked."
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

