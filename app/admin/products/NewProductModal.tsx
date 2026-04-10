"use client";

import { useId, useState } from "react";

type ProductDraft = {
  product_name: string;
  product_title: string;
  short_description: string;
  full_description: string;
  sku: string;
  price: number;
  stock_quantity: number;
  stock_status: "in_stock" | "out_of_stock" | "backorder";
  image?: File | null;
  shipping: {
    weight: number;
    dimensions: { length: number; width: number; height: number };
    shipping_class: string;
    free_shipping: boolean;
  };
  order_limits: {
    min_quantity: number;
    max_quantity: number;
    increment: number;
    allow_backorder: boolean;
  };
  product_links: {
    related_products: string[];
    upsell_products: string[];
    recommended_products: string[];
  };
};

const initialDraft: ProductDraft = {
  product_name: "",
  product_title: "",
  short_description: "",
  full_description: "",
  sku: "",
  price: 0,
  stock_quantity: 0,
  stock_status: "in_stock",
  image: null,
  shipping: {
    weight: 0,
    dimensions: { length: 0, width: 0, height: 0 },
    shipping_class: "",
    free_shipping: true,
  },
  order_limits: {
    min_quantity: 1,
    max_quantity: 10,
    increment: 1,
    allow_backorder: false,
  },
  product_links: {
    related_products: [],
    upsell_products: [],
    recommended_products: [],
  },
};

function toNumber(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function LabeledField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-[10px] tracking-[0.2em] uppercase opacity-70">
        {label}
      </div>
      <div className="mt-2">{children}</div>
    </label>
  );
}

export function NewProductModal({
  open,
  onClose,
  categories,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  categories: Array<{ id: string; name: string }>;
  onCreate: (args: {
    draft: ProductDraft;
    categoryId: string;
  }) => Promise<{ error: string | null }> | { error: string | null };
}) {
  const titleId = useId();
  const [draft, setDraft] = useState<ProductDraft>(initialDraft);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="absolute inset-0 overflow-y-auto">
        <div className="min-h-full px-4 py-6 sm:px-10 sm:py-10">
          <div className="mx-auto w-full max-w-5xl rounded-[28px] bg-[#f1f5ef] shadow-[0_60px_120px_rgba(0,37,33,0.25)]">
            <div className="flex items-center justify-between px-6 py-5 sm:px-8">
              <div>
                <div
                  id={titleId}
                  className="text-2xl font-semibold tracking-tight"
                >
                  New Product Curation
                </div>
                <div className="mt-1 text-xs opacity-70">
                  The editorial organicist · Lakrasa admin
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDraft(initialDraft);
                    setPreviewUrl(null);
                    setCategoryId("");
                  }}
                  className="rounded-2xl bg-white/60 px-4 py-2 text-sm font-semibold hover:bg-white/80"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSaving(false);
                    onClose();
                  }}
                  className="rounded-2xl bg-[#002521] px-4 py-2 text-sm font-semibold text-white hover:bg-[#033c37]"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="px-6 pb-6 sm:px-8 sm:pb-8">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="lg:col-span-7">
                  <div className="rounded-3xl bg-white/65 px-6 py-6">
                    <LabeledField label="Category">
                      <select
                        value={categoryId || (categories[0]?.id ? categories[0]!.id : "")}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none"
                      >
                        {categories.length === 0 ? (
                          <option value="">No categories</option>
                        ) : null}
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </LabeledField>

                    <LabeledField label="Product title">
                      <input
                        value={draft.product_title}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            product_title: e.target.value,
                          }))
                        }
                        placeholder="e.g. Vintage Highland Pekoe"
                        className="w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none"
                      />
                    </LabeledField>

                    <div className="mt-5">
                      <LabeledField label="Product name">
                        <input
                          value={draft.product_name}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              product_name: e.target.value,
                            }))
                          }
                          placeholder="Internal name (optional)"
                          className="w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none"
                        />
                      </LabeledField>
                    </div>

                    <div className="mt-5">
                      <LabeledField label="Short description">
                        <input
                          value={draft.short_description}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              short_description: e.target.value,
                            }))
                          }
                          placeholder="One-line note for listings"
                          className="w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none"
                        />
                      </LabeledField>
                    </div>

                    <div className="mt-5">
                      <LabeledField label="Full description">
                        <textarea
                          value={draft.full_description}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              full_description: e.target.value,
                            }))
                          }
                          placeholder="Describe the terroir, notes, and heritage of this product…"
                          className="min-h-32 w-full resize-none rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none"
                        />
                      </LabeledField>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <LabeledField label="SKU">
                        <input
                          value={draft.sku}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, sku: e.target.value }))
                          }
                          placeholder="LAK-001"
                          className="w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none"
                        />
                      </LabeledField>

                      <LabeledField label="Price (LKR)">
                        <input
                          inputMode="numeric"
                          value={String(draft.price)}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              price: toNumber(e.target.value),
                            }))
                          }
                          className="w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none tabular-nums"
                        />
                      </LabeledField>

                      <LabeledField label="Inventory (units)">
                        <input
                          inputMode="numeric"
                          value={String(draft.stock_quantity)}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              stock_quantity: toNumber(e.target.value),
                            }))
                          }
                          className="w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none tabular-nums"
                        />
                      </LabeledField>
                    </div>

                    <div className="mt-5">
                      <LabeledField label="Stock status">
                        <select
                          value={draft.stock_status}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              stock_status: e.target.value as ProductDraft["stock_status"],
                            }))
                          }
                          className="w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none"
                        >
                          <option value="in_stock">In stock</option>
                          <option value="out_of_stock">Out of stock</option>
                          <option value="backorder">Backorder</option>
                        </select>
                      </LabeledField>
                    </div>
                  </div>

                </div>

                <div className="lg:col-span-5">
                  <div className="rounded-3xl bg-white/65 px-6 py-6">
                    <div className="text-[10px] tracking-[0.2em] uppercase opacity-70">
                      Product imagery
                    </div>

                    <div className="mt-4 rounded-3xl bg-white/55 p-5">
                      <div className="rounded-3xl border border-dashed border-black/20 bg-white/40 px-6 py-8 text-center">
                        <div className="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-[#bdef86] text-[#002521]">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            className="h-6 w-6"
                            aria-hidden="true"
                          >
                            <path
                              d="M12 3v12"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                            <path
                              d="M7.5 7.5 12 3l4.5 4.5"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M7 21h10a2 2 0 0 0 2-2v-6"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                            <path
                              d="M5 13v6a2 2 0 0 0 2 2"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>

                        <div className="mt-4 text-sm font-semibold">
                          Upload Curator&apos;s Choice
                        </div>
                        <div className="mt-2 text-xs opacity-70">
                          Drop high‑resolution product photography here. Minimum
                          2000px width recommended.
                        </div>

                        <div className="mt-4">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const f = e.target.files?.[0] ?? null;
                              setDraft((d) => ({ ...d, image: f }));
                              if (previewUrl) URL.revokeObjectURL(previewUrl);
                              setPreviewUrl(f ? URL.createObjectURL(f) : null);
                            }}
                            className="hidden"
                            id="product-image"
                          />
                          <label
                            htmlFor="product-image"
                            className="inline-flex cursor-pointer items-center justify-center rounded-2xl bg-[#002521] px-4 py-2 text-sm font-semibold text-white hover:bg-[#033c37]"
                          >
                            Browse Files
                          </label>
                        </div>
                      </div>

                      {previewUrl ? (
                        <div className="mt-4 flex items-center gap-3">
                          <div
                            className="h-12 w-12 rounded-2xl bg-cover bg-center"
                            style={{ backgroundImage: `url(${previewUrl})` }}
                          />
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">
                              {draft.image?.name}
                            </div>
                            <div className="mt-1 text-xs opacity-70">
                              Selected image
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-6">
                      <div className="rounded-3xl bg-white/55 px-6 py-6">
                        <div className="text-sm font-semibold">Shipping</div>
                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <LabeledField label="Weight">
                            <input
                              inputMode="numeric"
                              value={String(draft.shipping.weight)}
                              onChange={(e) =>
                                setDraft((d) => ({
                                  ...d,
                                  shipping: {
                                    ...d.shipping,
                                    weight: toNumber(e.target.value),
                                  },
                                }))
                              }
                              className="w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none tabular-nums"
                            />
                          </LabeledField>
                          <LabeledField label="Shipping class">
                            <input
                              value={draft.shipping.shipping_class}
                              onChange={(e) =>
                                setDraft((d) => ({
                                  ...d,
                                  shipping: {
                                    ...d.shipping,
                                    shipping_class: e.target.value,
                                  },
                                }))
                              }
                              className="w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none"
                            />
                          </LabeledField>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-4">
                          <LabeledField label="Length">
                            <input
                              inputMode="numeric"
                              value={String(draft.shipping.dimensions.length)}
                              onChange={(e) =>
                                setDraft((d) => ({
                                  ...d,
                                  shipping: {
                                    ...d.shipping,
                                    dimensions: {
                                      ...d.shipping.dimensions,
                                      length: toNumber(e.target.value),
                                    },
                                  },
                                }))
                              }
                              className="w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none tabular-nums"
                            />
                          </LabeledField>
                          <LabeledField label="Width">
                            <input
                              inputMode="numeric"
                              value={String(draft.shipping.dimensions.width)}
                              onChange={(e) =>
                                setDraft((d) => ({
                                  ...d,
                                  shipping: {
                                    ...d.shipping,
                                    dimensions: {
                                      ...d.shipping.dimensions,
                                      width: toNumber(e.target.value),
                                    },
                                  },
                                }))
                              }
                              className="w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none tabular-nums"
                            />
                          </LabeledField>
                          <LabeledField label="Height">
                            <input
                              inputMode="numeric"
                              value={String(draft.shipping.dimensions.height)}
                              onChange={(e) =>
                                setDraft((d) => ({
                                  ...d,
                                  shipping: {
                                    ...d.shipping,
                                    dimensions: {
                                      ...d.shipping.dimensions,
                                      height: toNumber(e.target.value),
                                    },
                                  },
                                }))
                              }
                              className="w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none tabular-nums"
                            />
                          </LabeledField>
                        </div>

                        <label className="mt-4 flex items-center justify-between rounded-2xl bg-white/60 px-4 py-3 text-sm">
                          <span className="opacity-80">Free shipping</span>
                          <input
                            type="checkbox"
                            checked={draft.shipping.free_shipping}
                            onChange={(e) =>
                              setDraft((d) => ({
                                ...d,
                                shipping: {
                                  ...d.shipping,
                                  free_shipping: e.target.checked,
                                },
                              }))
                            }
                            className="h-4 w-4 accent-[#033c37]"
                          />
                        </label>
                      </div>

                      <div className="rounded-3xl bg-white/55 px-6 py-6">
                        <div className="text-sm font-semibold">Order limits</div>
                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <LabeledField label="Min quantity">
                            <input
                              inputMode="numeric"
                              value={String(draft.order_limits.min_quantity)}
                              onChange={(e) =>
                                setDraft((d) => ({
                                  ...d,
                                  order_limits: {
                                    ...d.order_limits,
                                    min_quantity: toNumber(e.target.value),
                                  },
                                }))
                              }
                              className="w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none tabular-nums"
                            />
                          </LabeledField>
                          <LabeledField label="Max quantity">
                            <input
                              inputMode="numeric"
                              value={String(draft.order_limits.max_quantity)}
                              onChange={(e) =>
                                setDraft((d) => ({
                                  ...d,
                                  order_limits: {
                                    ...d.order_limits,
                                    max_quantity: toNumber(e.target.value),
                                  },
                                }))
                              }
                              className="w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none tabular-nums"
                            />
                          </LabeledField>
                        </div>

                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-2xl bg-white/60 px-4 py-3 text-sm font-semibold hover:bg-white/80"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={saving || categories.length === 0}
                        onClick={async () => {
                          setCreateError(null);
                          const resolvedCategoryId = categoryId || categories[0]?.id || "";
                          if (!resolvedCategoryId) return;
                          setSaving(true);
                          try {
                            const res = await onCreate({
                              draft,
                              categoryId: resolvedCategoryId,
                            });
                            if (res.error) {
                              setCreateError(res.error);
                              return;
                            }
                            setDraft(initialDraft);
                            setPreviewUrl(null);
                            setCategoryId("");
                            onClose();
                          } catch (e) {
                            setCreateError(
                              e instanceof Error ? e.message : "Failed to create product."
                            );
                          } finally {
                            setSaving(false);
                          }
                        }}
                        className={[
                          "rounded-2xl bg-[#033c37] px-5 py-3 text-sm font-semibold text-white hover:bg-[#002521]",
                          saving || categories.length === 0
                            ? "opacity-60 pointer-events-none"
                            : "",
                        ].join(" ")}
                      >
                        {saving ? "Creating…" : "Create product"}
                      </button>
                    </div>

                    {createError ? (
                      <div className="mt-4 rounded-2xl bg-white/60 px-4 py-3 text-sm">
                        <div className="font-semibold text-[#7a1c1c]">
                          Couldn’t create product
                        </div>
                        <div className="mt-1 opacity-70">{createError}</div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

