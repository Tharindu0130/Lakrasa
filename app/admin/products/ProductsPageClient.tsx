"use client";

import { supabase } from "@/lib/supabaseClient";
import { useEffect, useMemo, useState } from "react";
import { NewProductModal } from "./NewProductModal";
import { ProductEditPanel } from "./ProductEditPanel";
import { ProductsLive } from "./ProductsLive";

export function ProductsPageClient() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [refreshToken, setRefreshToken] = useState(0);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editProductId, setEditProductId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const res = await supabase
        .from("categories")
        .select("id,name")
        .order("sort_order", { ascending: true });
      if (!alive) return;
      setCategories(res.data ?? []);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const searchPlaceholder = useMemo(() => {
    return categories.length > 0 ? "Search products" : "Search products";
  }, [categories.length]);

  return (
    <>
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 rounded-3xl bg-white/70 px-5 py-4">
              <span className="opacity-60" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
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
              </span>
              <input
                className="w-full bg-transparent text-sm outline-none placeholder:opacity-60"
                placeholder={searchPlaceholder}
                aria-label="Search products"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-2xl bg-white/60 hover:bg-white/80"
                aria-label="Options"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5 opacity-70"
                  aria-hidden="true"
                >
                  <path
                    d="M12 6.5a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5ZM12 13.25a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5ZM12 20a1.25 1.25 0 1 0 0-2.5A1.25 1.25 0 0 0 12 20Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-white/70 px-4 py-3 text-sm font-semibold hover:bg-white/85"
            >
              <span
                className="grid h-6 w-6 place-items-center rounded-xl bg-[#033c37] text-white text-xs"
                aria-hidden="true"
              >
                +
              </span>
              Add
            </button>
            <button
              type="button"
              className="rounded-2xl bg-[#e6e9e3] px-4 py-3 text-sm font-semibold opacity-60"
              aria-disabled="true"
            >
              Save
            </button>
          </div>
        </div>

        {createError ? (
          <div className="rounded-3xl bg-white/70 px-6 py-4 text-sm">
            <div className="font-semibold text-[#7a1c1c]">Couldn’t create product</div>
            <div className="mt-1 opacity-70">{createError}</div>
          </div>
        ) : null}

        <ProductsLive
          query={query}
          refreshToken={refreshToken}
          onEdit={(id) => setEditProductId(id)}
        />
      </section>

      <NewProductModal
        open={open}
        onClose={() => setOpen(false)}
        categories={categories}
        onCreate={async ({ draft, categoryId }) => {
          setCreateError(null);

          const sku = draft.sku.trim();
          if (!sku) return { error: "SKU is required." };

          const existing = await supabase
            .from("products")
            .select("id")
            .eq("sku", sku)
            .maybeSingle();

          if (existing.error) {
            return { error: existing.error.message };
          }

          if (existing.data) {
            const msg = `SKU "${sku}" already exists. Please use a different SKU.`;
            setCreateError(msg);
            return { error: msg };
          }

          const insertRes = await supabase
            .from("products")
            .insert({
              title: draft.product_title,
              internal_name: draft.product_name,
              short_description: draft.short_description || "",
              description_full: draft.full_description || draft.short_description || "",
              sku,
              price_lkr: draft.price,
              stock_quantity: draft.stock_quantity,
              stock_status: draft.stock_status,
              category_id: categoryId,
              min_quantity: draft.order_limits.min_quantity,
              max_quantity: draft.order_limits.max_quantity,
              increment: draft.order_limits.increment,
              allow_backorder: draft.order_limits.allow_backorder,
              weight: draft.shipping.weight,
              length: draft.shipping.dimensions.length,
              width: draft.shipping.dimensions.width,
              height: draft.shipping.dimensions.height,
              shipping_class: draft.shipping.shipping_class || "",
              free_shipping: draft.shipping.free_shipping,
              related_products: draft.product_links.related_products,
              upsell_products: draft.product_links.upsell_products,
              recommended_products: draft.product_links.recommended_products,
            })
            .select("id")
            .single();

          if (insertRes.error) {
            const msg = insertRes.error.message.includes("products_sku_key")
              ? `SKU "${sku}" already exists. Please use a different SKU.`
              : insertRes.error.message;
            setCreateError(msg);
            return { error: msg };
          }

          const newProductId = insertRes.data?.id;
          if (!newProductId) {
            const msg = "Product was created but no ID was returned.";
            setCreateError(msg);
            return { error: msg };
          }

          if (draft.image) {
            const ext =
              draft.image.name.split(".").pop()?.toLowerCase() ||
              (draft.image.type.split("/")[1] || "jpg");
            const path = `${newProductId}/${Date.now()}.${ext}`;

            const uploadRes = await supabase.storage
              .from("products")
              .upload(path, draft.image, {
                cacheControl: "3600",
                upsert: false,
                contentType: draft.image.type || undefined,
              });

            if (uploadRes.error) {
              await supabase.from("products").delete().eq("id", newProductId);
              const msg = `Image upload failed: ${uploadRes.error.message}`;
              setCreateError(msg);
              return { error: msg };
            }

            const publicUrl = supabase.storage
              .from("products")
              .getPublicUrl(path).data.publicUrl;

            const imgRes = await supabase
              .from("product_images")
              .insert({
                product_id: newProductId,
                image_url: publicUrl,
                sort_order: 0,
              })
              .select("id")
              .single();

            if (imgRes.error) {
              await supabase.from("products").delete().eq("id", newProductId);
              const msg = `Saving product image failed: ${imgRes.error.message}`;
              setCreateError(msg);
              return { error: msg };
            }
          }

          setRefreshToken((n) => n + 1);
          return { error: null };
        }}
      />

      {editProductId ? (
        <ProductEditPanel
          productId={editProductId}
          categories={categories}
          onClose={() => setEditProductId(null)}
          onSaved={() => setRefreshToken((n) => n + 1)}
        />
      ) : null}
    </>
  );
}

