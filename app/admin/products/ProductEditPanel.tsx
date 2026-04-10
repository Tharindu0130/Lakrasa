"use client";

import { supabase } from "@/lib/supabaseClient";
import { useEffect, useMemo, useState } from "react";

type StockStatus = "in_stock" | "out_of_stock" | "backorder";

type ProductRow = {
  id: string;
  title: string;
  internal_name: string;
  sku: string;
  price_lkr: number;
  stock_quantity: number;
  stock_status: StockStatus;
  category_id: string;
  short_description: string;
  description_full: string | null;
  shipping_class: string;
  free_shipping: boolean;
  min_quantity: number | null;
  max_quantity: number | null;
  increment: number | null;
  allow_backorder: boolean;
  weight: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  related_products: string[];
  upsell_products: string[];
  recommended_products: string[];
};

function parseList(v: string) {
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function toNumber(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function ProductEditPanel({
  productId,
  categories,
  onClose,
  onSaved,
}: {
  productId: string;
  categories: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductRow | null>(null);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<{
    id: string;
    image_url: string;
  } | null>(null);

  function storagePathFromPublicUrl(url: string) {
    // Example:
    // https://<proj>.supabase.co/storage/v1/object/public/products/<path>
    const marker = "/storage/v1/object/public/products/";
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(url.slice(idx + marker.length));
  }

  const canSave = useMemo(() => {
    return !!product && !saving;
  }, [product, saving]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErrorText(null);
    void (async () => {
      const [res, imgRes] = await Promise.all([
        supabase
          .from("products")
          .select(
            "id,title,internal_name,sku,price_lkr,stock_quantity,stock_status,category_id,short_description,description_full,shipping_class,free_shipping,min_quantity,max_quantity,increment,allow_backorder,weight,length,width,height,related_products,upsell_products,recommended_products"
          )
          .eq("id", productId)
          .single(),
        supabase
          .from("product_images")
          .select("id,image_url")
          .eq("product_id", productId)
          .order("sort_order", { ascending: true })
          .limit(1)
          .maybeSingle(),
      ]);

      if (!alive) return;

      if (res.error) {
        setErrorText(res.error.message);
        setProduct(null);
        setExistingImage(null);
        setLoading(false);
        return;
      }

      setProduct(res.data as ProductRow);
      if (imgRes.error) {
        setExistingImage(null);
      } else {
        setExistingImage(imgRes.data ? (imgRes.data as { id: string; image_url: string }) : null);
      }
      setNewImage(null);
      if (newImagePreview) URL.revokeObjectURL(newImagePreview);
      setNewImagePreview(null);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [productId]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40">
      <div
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className="absolute right-0 top-0 h-full w-full max-w-[420px] border-l border-black/10 bg-white shadow-[0_40px_90px_rgba(0,0,0,0.25)]">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-black/10 px-5 py-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold tracking-tight">Edit product</div>
              <div className="mt-1 truncate text-xs opacity-60">{productId}</div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-2xl bg-[#f1f5ef] hover:bg-[#e6e9e3]"
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 opacity-80">
                <path
                  d="M7.5 7.5 16.5 16.5M16.5 7.5 7.5 16.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            {loading ? (
              <div className="rounded-2xl bg-[#f7faf4] px-4 py-3 text-sm opacity-70">
                Loading…
              </div>
            ) : errorText ? (
              <div className="rounded-2xl bg-[#f7faf4] px-4 py-3 text-sm">
                <div className="font-semibold text-[#7a1c1c]">Couldn’t load</div>
                <div className="mt-1 opacity-70">{errorText}</div>
              </div>
            ) : product ? (
              <div className="space-y-4">
                <label className="block">
                  <div className="text-[10px] tracking-[0.2em] uppercase opacity-70">
                    Title
                  </div>
                  <input
                    value={product.title}
                    onChange={(e) =>
                      setProduct((p) => (p ? { ...p, title: e.target.value } : p))
                    }
                    className="mt-2 w-full rounded-2xl bg-[#f7faf4] px-4 py-3 text-sm outline-none"
                  />
                </label>

                <label className="block">
                  <div className="text-[10px] tracking-[0.2em] uppercase opacity-70">
                    Short description
                  </div>
                  <input
                    value={product.short_description}
                    onChange={(e) =>
                      setProduct((p) =>
                        p ? { ...p, short_description: e.target.value } : p
                      )
                    }
                    className="mt-2 w-full rounded-2xl bg-[#f7faf4] px-4 py-3 text-sm outline-none"
                    placeholder="One-line note for listings"
                  />
                </label>

                <label className="block">
                  <div className="text-[10px] tracking-[0.2em] uppercase opacity-70">
                    Internal name
                  </div>
                  <input
                    value={product.internal_name}
                    onChange={(e) =>
                      setProduct((p) =>
                        p ? { ...p, internal_name: e.target.value } : p
                      )
                    }
                    className="mt-2 w-full rounded-2xl bg-[#f7faf4] px-4 py-3 text-sm outline-none"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <div className="text-[10px] tracking-[0.2em] uppercase opacity-70">
                      SKU
                    </div>
                    <input
                      value={product.sku}
                      readOnly
                      className="mt-2 w-full rounded-2xl bg-[#f7faf4] px-4 py-3 text-sm outline-none opacity-70"
                    />
                  </label>

                  <label className="block">
                    <div className="text-[10px] tracking-[0.2em] uppercase opacity-70">
                      Price (LKR)
                    </div>
                    <input
                      inputMode="numeric"
                      value={String(product.price_lkr)}
                      onChange={(e) =>
                        setProduct((p) =>
                          p ? { ...p, price_lkr: toNumber(e.target.value) } : p
                        )
                      }
                      className="mt-2 w-full rounded-2xl bg-[#f7faf4] px-4 py-3 text-sm outline-none tabular-nums"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <div className="text-[10px] tracking-[0.2em] uppercase opacity-70">
                      Stock qty
                    </div>
                    <input
                      inputMode="numeric"
                      value={String(product.stock_quantity)}
                      onChange={(e) =>
                        setProduct((p) =>
                          p
                            ? { ...p, stock_quantity: toNumber(e.target.value) }
                            : p
                        )
                      }
                      className="mt-2 w-full rounded-2xl bg-[#f7faf4] px-4 py-3 text-sm outline-none tabular-nums"
                    />
                  </label>

                  <label className="block">
                    <div className="text-[10px] tracking-[0.2em] uppercase opacity-70">
                      Stock status
                    </div>
                    <select
                      value={product.stock_status}
                      onChange={(e) =>
                        setProduct((p) =>
                          p
                            ? { ...p, stock_status: e.target.value as StockStatus }
                            : p
                        )
                      }
                      className="mt-2 w-full rounded-2xl bg-[#f7faf4] px-4 py-3 text-sm outline-none"
                    >
                      <option value="in_stock">In stock</option>
                      <option value="backorder">Backorder</option>
                      <option value="out_of_stock">Out of stock</option>
                    </select>
                  </label>
                </div>

                <label className="block">
                  <div className="text-[10px] tracking-[0.2em] uppercase opacity-70">
                    Category
                  </div>
                  <select
                    value={product.category_id}
                    onChange={(e) =>
                      setProduct((p) =>
                        p ? { ...p, category_id: e.target.value } : p
                      )
                    }
                    className="mt-2 w-full rounded-2xl bg-[#f7faf4] px-4 py-3 text-sm outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <div className="text-[10px] tracking-[0.2em] uppercase opacity-70">
                    Description
                  </div>
                  <textarea
                    value={product.description_full ?? ""}
                    onChange={(e) =>
                      setProduct((p) =>
                        p ? { ...p, description_full: e.target.value } : p
                      )
                    }
                    className="mt-2 min-h-28 w-full resize-none rounded-2xl bg-[#f7faf4] px-4 py-3 text-sm outline-none"
                  />
                </label>

                <div className="rounded-2xl bg-[#f7faf4] px-4 py-4">
                  <div className="text-sm font-semibold">Image</div>
                  <div className="mt-2 text-xs opacity-70">
                    Upload a new cover image (saved to Storage + product_images).
                  </div>

                  {existingImage && !newImagePreview ? (
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-white/70 px-3 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className="h-12 w-12 shrink-0 rounded-2xl bg-cover bg-center"
                          style={{ backgroundImage: `url(${existingImage.image_url})` }}
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">Current image</div>
                          <div className="mt-1 truncate text-xs opacity-70">
                            {existingImage.image_url}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!existingImage) return;
                          if (!window.confirm("Remove the current image?")) return;
                          setErrorText(null);
                          setSaving(true);
                          try {
                            // Best-effort: delete storage object if the URL looks like a public bucket URL
                            const path = storagePathFromPublicUrl(existingImage.image_url);
                            if (path) {
                              await supabase.storage.from("products").remove([path]);
                            }
                            const del = await supabase
                              .from("product_images")
                              .delete()
                              .eq("id", existingImage.id);
                            if (del.error) {
                              setErrorText(del.error.message);
                              return;
                            }
                            setExistingImage(null);
                            onSaved();
                          } finally {
                            setSaving(false);
                          }
                        }}
                        className="shrink-0 rounded-2xl bg-[#ffe7e7] px-3 py-2 text-sm font-semibold text-[#7a1c1c] hover:bg-[#ffd6d6]"
                      >
                        Remove
                      </button>
                    </div>
                  ) : null}

                  <div className="mt-3">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id={`edit-product-image-${productId}`}
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        setNewImage(f);
                        if (newImagePreview) URL.revokeObjectURL(newImagePreview);
                        setNewImagePreview(f ? URL.createObjectURL(f) : null);
                      }}
                    />
                    <label
                      htmlFor={`edit-product-image-${productId}`}
                      className="inline-flex cursor-pointer items-center justify-center rounded-2xl bg-[#002521] px-4 py-2 text-sm font-semibold text-white hover:bg-[#033c37]"
                    >
                      Add
                    </label>
                  </div>

                  {newImagePreview ? (
                    <div className="mt-3 flex items-center gap-3">
                      <div
                        className="h-12 w-12 rounded-2xl bg-cover bg-center"
                        style={{ backgroundImage: `url(${newImagePreview})` }}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">
                          {newImage?.name}
                        </div>
                        <div className="mt-1 text-xs opacity-70">New image selected</div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-2xl bg-[#f7faf4] px-4 py-4">
                  <div className="text-sm font-semibold">Shipping</div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <label className="block">
                      <div className="text-[10px] tracking-[0.2em] uppercase opacity-70">
                        Weight
                      </div>
                      <input
                        inputMode="numeric"
                        value={String(product.weight ?? 0)}
                        onChange={(e) =>
                          setProduct((p) =>
                            p ? { ...p, weight: toNumber(e.target.value) } : p
                          )
                        }
                        className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none tabular-nums"
                      />
                    </label>
                    <label className="block">
                      <div className="text-[10px] tracking-[0.2em] uppercase opacity-70">
                        Shipping class
                      </div>
                      <input
                        value={product.shipping_class}
                        onChange={(e) =>
                          setProduct((p) =>
                            p ? { ...p, shipping_class: e.target.value } : p
                          )
                        }
                        className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none"
                      />
                    </label>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <label className="block">
                      <div className="text-[10px] tracking-[0.2em] uppercase opacity-70">
                        Length
                      </div>
                      <input
                        inputMode="numeric"
                        value={String(product.length ?? 0)}
                        onChange={(e) =>
                          setProduct((p) =>
                            p ? { ...p, length: toNumber(e.target.value) } : p
                          )
                        }
                        className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none tabular-nums"
                      />
                    </label>
                    <label className="block">
                      <div className="text-[10px] tracking-[0.2em] uppercase opacity-70">
                        Width
                      </div>
                      <input
                        inputMode="numeric"
                        value={String(product.width ?? 0)}
                        onChange={(e) =>
                          setProduct((p) =>
                            p ? { ...p, width: toNumber(e.target.value) } : p
                          )
                        }
                        className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none tabular-nums"
                      />
                    </label>
                    <label className="block">
                      <div className="text-[10px] tracking-[0.2em] uppercase opacity-70">
                        Height
                      </div>
                      <input
                        inputMode="numeric"
                        value={String(product.height ?? 0)}
                        onChange={(e) =>
                          setProduct((p) =>
                            p ? { ...p, height: toNumber(e.target.value) } : p
                          )
                        }
                        className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none tabular-nums"
                      />
                    </label>
                  </div>

                  <label className="mt-4 flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 text-sm">
                    <span className="opacity-80">Free shipping</span>
                    <input
                      type="checkbox"
                      checked={product.free_shipping}
                      onChange={(e) =>
                        setProduct((p) =>
                          p ? { ...p, free_shipping: e.target.checked } : p
                        )
                      }
                      className="h-4 w-4 accent-[#033c37]"
                    />
                  </label>
                </div>

                <div className="rounded-2xl bg-[#f7faf4] px-4 py-4">
                  <div className="text-sm font-semibold">Order limits</div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <label className="block">
                      <div className="text-[10px] tracking-[0.2em] uppercase opacity-70">
                        Min quantity
                      </div>
                      <input
                        inputMode="numeric"
                        value={String(product.min_quantity ?? 1)}
                        onChange={(e) =>
                          setProduct((p) =>
                            p ? { ...p, min_quantity: toNumber(e.target.value) } : p
                          )
                        }
                        className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none tabular-nums"
                      />
                    </label>
                    <label className="block">
                      <div className="text-[10px] tracking-[0.2em] uppercase opacity-70">
                        Max quantity
                      </div>
                      <input
                        inputMode="numeric"
                        value={String(product.max_quantity ?? 10)}
                        onChange={(e) =>
                          setProduct((p) =>
                            p ? { ...p, max_quantity: toNumber(e.target.value) } : p
                          )
                        }
                        className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none tabular-nums"
                      />
                    </label>
                    <label className="block">
                      <div className="text-[10px] tracking-[0.2em] uppercase opacity-70">
                        Increment
                      </div>
                      <input
                        inputMode="numeric"
                        value={String(product.increment ?? 1)}
                        onChange={(e) =>
                          setProduct((p) =>
                            p ? { ...p, increment: toNumber(e.target.value) } : p
                          )
                        }
                        className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none tabular-nums"
                      />
                    </label>
                    <div className="pt-6">
                      <div className="text-[10px] tracking-[0.2em] uppercase opacity-70">
                        Allow backorder
                      </div>
                      <label className="mt-2 flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 text-sm">
                        <span className="opacity-80">Permit pre‑orders</span>
                        <input
                          type="checkbox"
                          checked={product.allow_backorder}
                          onChange={(e) =>
                            setProduct((p) =>
                              p
                                ? { ...p, allow_backorder: e.target.checked }
                                : p
                            )
                          }
                          className="h-4 w-4 accent-[#033c37]"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-[#f7faf4] px-4 py-4">
                  <div className="text-sm font-semibold">Product links</div>
                  <div className="mt-3 space-y-3">
                    <label className="block">
                      <div className="text-[10px] tracking-[0.2em] uppercase opacity-70">
                        Related products (comma separated)
                      </div>
                      <input
                        value={(product.related_products ?? []).join(", ")}
                        onChange={(e) =>
                          setProduct((p) =>
                            p ? { ...p, related_products: parseList(e.target.value) } : p
                          )
                        }
                        className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none"
                      />
                    </label>
                    <label className="block">
                      <div className="text-[10px] tracking-[0.2em] uppercase opacity-70">
                        Upsell products (comma separated)
                      </div>
                      <input
                        value={(product.upsell_products ?? []).join(", ")}
                        onChange={(e) =>
                          setProduct((p) =>
                            p ? { ...p, upsell_products: parseList(e.target.value) } : p
                          )
                        }
                        className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none"
                      />
                    </label>
                    <label className="block">
                      <div className="text-[10px] tracking-[0.2em] uppercase opacity-70">
                        Recommended products (comma separated)
                      </div>
                      <input
                        value={(product.recommended_products ?? []).join(", ")}
                        onChange={(e) =>
                          setProduct((p) =>
                            p
                              ? { ...p, recommended_products: parseList(e.target.value) }
                              : p
                          )
                        }
                        className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none"
                      />
                    </label>
                  </div>
                </div>

                {errorText ? (
                  <div className="rounded-2xl bg-[#f7faf4] px-4 py-3 text-sm">
                    <div className="font-semibold text-[#7a1c1c]">Error</div>
                    <div className="mt-1 opacity-70">{errorText}</div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-black/10 px-5 py-4">
            <button
              type="button"
              onClick={async () => {
                if (!window.confirm("Delete this product?")) return;
                setErrorText(null);
                setSaving(true);
                try {
                  // delete images rows first, then product
                  const imgDel = await supabase
                    .from("product_images")
                    .delete()
                    .eq("product_id", productId);
                  if (imgDel.error) {
                    setErrorText(imgDel.error.message);
                    return;
                  }

                  const pDel = await supabase.from("products").delete().eq("id", productId);
                  if (pDel.error) {
                    setErrorText(pDel.error.message);
                    return;
                  }

                  onSaved();
                  onClose();
                } finally {
                  setSaving(false);
                }
              }}
              className="rounded-2xl bg-[#ffe7e7] px-4 py-2.5 text-sm font-semibold text-[#7a1c1c] hover:bg-[#ffd6d6]"
            >
              Delete
            </button>

            <button
              type="button"
              disabled={!canSave}
              onClick={async () => {
                if (!product) return;
                setErrorText(null);
                setSaving(true);
                try {
                  const res = await supabase
                    .from("products")
                    .update({
                      title: product.title,
                      internal_name: product.internal_name,
                      short_description: product.short_description || "",
                      price_lkr: product.price_lkr,
                      stock_quantity: product.stock_quantity,
                      stock_status: product.stock_status,
                      category_id: product.category_id,
                      description_full: product.description_full ?? "",
                      shipping_class: product.shipping_class || "",
                      free_shipping: product.free_shipping,
                      min_quantity: product.min_quantity ?? 1,
                      max_quantity: product.max_quantity ?? 10,
                      increment: product.increment ?? 1,
                      allow_backorder: product.allow_backorder,
                      weight: product.weight ?? 0,
                      length: product.length ?? 0,
                      width: product.width ?? 0,
                      height: product.height ?? 0,
                      related_products: product.related_products ?? [],
                      upsell_products: product.upsell_products ?? [],
                      recommended_products: product.recommended_products ?? [],
                    })
                    .eq("id", productId);

                  if (res.error) {
                    setErrorText(res.error.message);
                    return;
                  }

                  if (newImage) {
                    const ext =
                      newImage.name.split(".").pop()?.toLowerCase() ||
                      (newImage.type.split("/")[1] || "jpg");
                    const path = `${productId}/${Date.now()}.${ext}`;

                    const uploadRes = await supabase.storage
                      .from("products")
                      .upload(path, newImage, {
                        cacheControl: "3600",
                        upsert: false,
                        contentType: newImage.type || undefined,
                      });

                    if (uploadRes.error) {
                      setErrorText(`Image upload failed: ${uploadRes.error.message}`);
                      return;
                    }

                    const publicUrl = supabase.storage
                      .from("products")
                      .getPublicUrl(path).data.publicUrl;

                    const existingImg = await supabase
                      .from("product_images")
                      .select("id")
                      .eq("product_id", productId)
                      .order("sort_order", { ascending: true })
                      .limit(1)
                      .maybeSingle();

                    if (existingImg.error) {
                      setErrorText(existingImg.error.message);
                      return;
                    }

                    if (existingImg.data?.id) {
                      const up = await supabase
                        .from("product_images")
                        .update({ image_url: publicUrl, sort_order: 0 })
                        .eq("id", existingImg.data.id);
                      if (up.error) {
                        setErrorText(up.error.message);
                        return;
                      }
                    } else {
                      const ins = await supabase
                        .from("product_images")
                        .insert({ product_id: productId, image_url: publicUrl, sort_order: 0 });
                      if (ins.error) {
                        setErrorText(ins.error.message);
                        return;
                      }
                    }
                  }

                  onSaved();
                  onClose();
                } finally {
                  setSaving(false);
                }
              }}
              className={[
                "rounded-2xl bg-[#033c37] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#002521]",
                !canSave ? "opacity-60 pointer-events-none" : "",
              ].join(" ")}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

