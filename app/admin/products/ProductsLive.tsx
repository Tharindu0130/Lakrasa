"use client";

import { supabase } from "@/lib/supabaseClient";
import { useEffect, useMemo, useState } from "react";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Product = {
  id: string;
  title: string;
  internal_name: string;
  sku: string;
  price_lkr: number;
  stock_quantity: number;
  stock_status: "in_stock" | "out_of_stock" | "backorder";
  category_id: string;
};

type ProductImage = {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number | null;
};

function formatLkr(n: number) {
  return `Rs ${Number(n).toLocaleString("en-LK")}`;
}

export function ProductsLive({
  query,
  refreshToken,
  onEdit,
}: {
  query: string;
  refreshToken?: number;
  onEdit: (productId: string) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);

  async function load() {
    setErrorText(null);
    setLoading(true);

    const [cRes, pRes, iRes] = await Promise.all([
      supabase.from("categories").select("id,name,slug").order("sort_order", { ascending: true }),
      supabase
        .from("products")
        .select("id,title,internal_name,sku,price_lkr,stock_quantity,stock_status,category_id")
        .order("created_at", { ascending: false }),
      supabase
        .from("product_images")
        .select("id,product_id,image_url,sort_order")
        .order("sort_order", { ascending: true }),
    ]);

    if (cRes.error || pRes.error || iRes.error) {
      setErrorText(
        cRes.error?.message ?? pRes.error?.message ?? iRes.error?.message ?? "Failed to load products."
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
      .channel("admin-products-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => void load()
      )
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

  const coverByProduct = useMemo(() => {
    const m = new Map<string, string>();
    for (const img of images) {
      if (!m.has(img.product_id)) m.set(img.product_id, img.image_url);
    }
    return m;
  }, [images]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const hay = `${p.title} ${p.internal_name} ${p.sku}`.toLowerCase();
      return hay.includes(q);
    });
  }, [products, query]);

  const productsByCategory = useMemo(() => {
    const m = new Map<string, Product[]>();
    for (const p of filteredProducts) {
      const list = m.get(p.category_id) ?? [];
      list.push(p);
      if (!m.has(p.category_id)) m.set(p.category_id, list);
    }
    return m;
  }, [filteredProducts]);

  if (loading) {
    return (
      <div className="rounded-3xl bg-white/70 p-6 text-sm opacity-70">
        Loading products…
      </div>
    );
  }

  if (errorText) {
    return (
      <div className="rounded-3xl bg-white/70 p-6 text-sm">
        <div className="font-semibold text-[#7a1c1c]">Couldn’t load realtime data</div>
        <div className="mt-1 opacity-70">{errorText}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {categories.map((c) => {
        const items = productsByCategory.get(c.id) ?? [];
        if (items.length === 0) return null;

        return (
          <section
            key={c.id}
            className="overflow-hidden rounded-3xl bg-white/70 shadow-[0_30px_70px_rgba(0,37,33,0.08)]"
          >
            <div className="flex items-center justify-between gap-4 px-6 py-5">
              <div>
                <div className="text-sm font-semibold tracking-tight">{c.name}</div>
                <div className="mt-1 text-xs opacity-60">{items.length} items</div>
              </div>
            </div>

            <div className="divide-y divide-black/5">
              {items.map((p) => {
                const cover = coverByProduct.get(p.id) ?? null;
                return (
                  <div key={p.id} className="flex items-center gap-4 px-6 py-4">
                    <div className="h-12 w-12 overflow-hidden rounded-2xl bg-[#f1f5ef]">
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={cover}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{p.title}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs opacity-70">
                        <span className="truncate">SKU: {p.sku}</span>
                        <span>•</span>
                        <span className="truncate">{formatLkr(Number(p.price_lkr))}</span>
                        <span>•</span>
                        <span className="truncate">
                          {p.stock_status === "in_stock"
                            ? "In stock"
                            : p.stock_status === "backorder"
                              ? "Backorder"
                              : "Out of stock"}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <button
                        type="button"
                        onClick={() => onEdit(p.id)}
                        className="rounded-2xl bg-white/60 px-4 py-2 text-sm font-semibold hover:bg-white/80"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {categories.length === 0 ? (
        <div className="rounded-3xl bg-white/70 p-6 text-sm opacity-70">
          No categories yet.
        </div>
      ) : null}
    </div>
  );
}

