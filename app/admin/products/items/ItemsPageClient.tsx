"use client";

import { supabase } from "@/lib/supabaseClient";
import { useEffect, useMemo, useState } from "react";
import { NewProductModal } from "../NewProductModal";
import { ProductEditPanel } from "../ProductEditPanel";

type Category = { id: string; name: string };
type ProductRow = {
  id: string;
  title: string;
  internal_name: string;
  sku: string;
  price_lkr: number;
  category_id: string;
  created_at: string;
};
type ProductImageRow = {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number | null;
};

function formatLkr(n: number) {
  return `Rs ${Number(n).toLocaleString("en-LK")}`;
}

function formatMmDd(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}`;
}

export function ItemsPageClient() {
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [images, setImages] = useState<ProductImageRow[]>([]);
  const [openNew, setOpenNew] = useState(false);
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  async function load() {
    setErrorText(null);
    setLoading(true);

    const [cRes, pRes, iRes] = await Promise.all([
      supabase.from("categories").select("id,name").order("sort_order", { ascending: true }),
      supabase
        .from("products")
        .select("id,title,internal_name,sku,price_lkr,category_id,created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("product_images")
        .select("id,product_id,image_url,sort_order")
        .order("sort_order", { ascending: true }),
    ]);

    if (cRes.error || pRes.error || iRes.error) {
      setErrorText(
        cRes.error?.message ??
          pRes.error?.message ??
          iRes.error?.message ??
          "Failed to load items."
      );
      setCategories(cRes.data ?? []);
      setProducts(pRes.data ?? []);
      setImages(iRes.data ?? []);
      setLoading(false);
      return;
    }

    setCategories(cRes.data ?? []);
    setProducts(pRes.data ?? []);
    setImages(iRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-items-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => void load())
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "product_images" },
        () => void load()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories" },
        () => void load()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categoryNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of categories) m.set(c.id, c.name);
    return m;
  }, [categories]);

  const coverByProductId = useMemo(() => {
    const m = new Map<string, string>();
    for (const img of images) {
      if (!m.has(img.product_id)) m.set(img.product_id, img.image_url);
    }
    return m;
  }, [images]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryFilter !== "all" && p.category_id !== categoryFilter) return false;
      if (!q) return true;
      const hay = `${p.title} ${p.internal_name} ${p.sku}`.toLowerCase();
      return hay.includes(q);
    });
  }, [products, query, categoryFilter]);

  return (
    <>
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex w-full max-w-sm items-center gap-3 rounded-3xl bg-white/70 px-5 py-3">
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
                placeholder="Search…"
                aria-label="Search items"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-12 rounded-3xl bg-white/70 px-4 pr-9 text-sm font-semibold outline-none"
              >
                <option value="all">All</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpenNew(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-2.5 text-sm font-semibold text-white"
          >
            <span aria-hidden="true">＋</span> New item
          </button>
        </div>

        {loading ? (
          <div className="rounded-3xl bg-white/70 p-6 text-sm opacity-70">
            Loading items…
          </div>
        ) : errorText ? (
          <div className="rounded-3xl bg-white/70 p-6 text-sm">
            <div className="font-semibold text-[#7a1c1c]">Couldn’t load items</div>
            <div className="mt-1 opacity-70">{errorText}</div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl bg-white/70 shadow-[0_30px_70px_rgba(0,37,33,0.08)]">
            <div className="grid grid-cols-[72px_1.4fr_140px_160px_120px_90px] gap-0 border-b border-black/10 px-6 py-4 text-xs font-semibold opacity-70">
              <div>Photo</div>
              <div>Name</div>
              <div>Price</div>
              <div>Category</div>
              <div>Last updated</div>
              <div />
            </div>

            <div className="divide-y divide-black/5">
              {filtered.map((p) => {
                const cover = coverByProductId.get(p.id) ?? null;
                const categoryName = categoryNameById.get(p.category_id) ?? "—";
                return (
                  <div
                    key={p.id}
                    className="grid grid-cols-[72px_1.4fr_140px_160px_120px_90px] items-center px-6 py-4 text-sm"
                  >
                    <div className="pr-3">
                      <div className="h-10 w-10 overflow-hidden rounded-xl bg-[#f1f5ef] ring-1 ring-black/10">
                        {cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cover} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="truncate font-semibold">{p.title}</div>
                      <div className="mt-1 truncate text-xs opacity-60">SKU: {p.sku}</div>
                    </div>

                    <div className="tabular-nums">{formatLkr(Number(p.price_lkr))}</div>
                    <div className="truncate">{categoryName}</div>
                    <div className="tabular-nums opacity-80">{formatMmDd(p.created_at)}</div>

                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => setEditProductId(p.id)}
                        className="rounded-2xl bg-white/60 px-3 py-2 text-sm font-semibold hover:bg-white/80"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })}

              {filtered.length === 0 ? (
                <div className="px-6 py-10 text-sm opacity-70">No items found.</div>
              ) : null}
            </div>
          </div>
        )}
      </section>

      <NewProductModal
        open={openNew}
        onClose={() => setOpenNew(false)}
        categories={categories}
        onCreate={async ({ draft, categoryId }) => {
          const sku = draft.sku.trim();
          if (!sku) return { error: "SKU is required." };

          const existing = await supabase.from("products").select("id").eq("sku", sku).maybeSingle();
          if (existing.error) return { error: existing.error.message };
          if (existing.data) return { error: `SKU "${sku}" already exists. Please use a different SKU.` };

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
            return { error: msg };
          }

          const newProductId = insertRes.data?.id;
          if (!newProductId) return { error: "Product was created but no ID was returned." };

          if (draft.image) {
            const ext =
              draft.image.name.split(".").pop()?.toLowerCase() ||
              (draft.image.type.split("/")[1] || "jpg");
            const path = `${newProductId}/${Date.now()}.${ext}`;

            const uploadRes = await supabase.storage.from("products").upload(path, draft.image, {
              cacheControl: "3600",
              upsert: false,
              contentType: draft.image.type || undefined,
            });

            if (uploadRes.error) {
              await supabase.from("products").delete().eq("id", newProductId);
              return { error: `Image upload failed: ${uploadRes.error.message}` };
            }

            const publicUrl = supabase.storage.from("products").getPublicUrl(path).data.publicUrl;

            const imgRes = await supabase
              .from("product_images")
              .insert({ product_id: newProductId, image_url: publicUrl, sort_order: 0 })
              .select("id")
              .single();

            if (imgRes.error) {
              await supabase.from("products").delete().eq("id", newProductId);
              return { error: `Saving product image failed: ${imgRes.error.message}` };
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

