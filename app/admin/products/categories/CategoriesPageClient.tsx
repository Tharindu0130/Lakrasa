"use client";

import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CategoryRow = {
  id: string;
  name: string;
  slug: string | null;
  productCount: number;
  coverUrl: string | null;
};

export function CategoriesPageClient() {
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<CategoryRow[]>([]);

  async function load() {
    setErrorText(null);
    setLoading(true);

    const [{ data: categories, error: catErr }, { data: products, error: prodErr }] =
      await Promise.all([
        supabase.from("categories").select("id,name,slug").order("name", { ascending: true }),
        supabase.from("products").select("id,category_id").order("created_at", { ascending: true }),
      ]);

    if (catErr || prodErr) {
      setErrorText(catErr?.message ?? prodErr?.message ?? "Failed to load categories.");
      setRows([]);
      setLoading(false);
      return;
    }

    const safeCategories = (categories ?? []) as Array<{ id: string; name: string; slug?: string | null }>;
    const safeProducts = (products ?? []) as Array<{ id: string; category_id?: string | null }>;

    const countByCategory = new Map<string, number>();
    const firstProductByCategory = new Map<string, string>();
    for (const p of safeProducts) {
      const cid = p.category_id ?? "";
      if (!cid) continue;
      countByCategory.set(cid, (countByCategory.get(cid) ?? 0) + 1);
      if (!firstProductByCategory.has(cid)) firstProductByCategory.set(cid, p.id);
    }

    const productIds = Array.from(new Set(Array.from(firstProductByCategory.values())));
    const imagesRes =
      productIds.length > 0
        ? await supabase
            .from("product_images")
            .select("product_id,image_url,sort_order")
            .in("product_id", productIds)
            .order("sort_order", { ascending: true })
        : { data: [] as Array<{ product_id: string; image_url: string; sort_order?: number | null }>, error: null };

    if ((imagesRes as any).error) {
      setErrorText((imagesRes as any).error.message ?? "Failed to load category covers.");
      setRows([]);
      setLoading(false);
      return;
    }

    const imageByProduct = new Map<string, string>();
    for (const img of imagesRes.data ?? []) {
      if (!imageByProduct.has(img.product_id)) imageByProduct.set(img.product_id, img.image_url);
    }

    const nextRows: CategoryRow[] = safeCategories.map((c) => {
      const firstPid = firstProductByCategory.get(c.id) ?? null;
      const coverUrl = firstPid ? imageByProduct.get(firstPid) ?? null : null;
      return {
        id: c.id,
        name: c.name,
        slug: c.slug ?? null,
        productCount: countByCategory.get(c.id) ?? 0,
        coverUrl,
      };
    });

    setRows(nextRows);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("admin-categories-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "product_images" }, () => void load())
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((c) => `${c.name} ${c.slug ?? ""}`.toLowerCase().includes(q));
  }, [rows, query]);

  return (
    <>
      <div className="mt-4 flex max-w-sm items-center gap-3 rounded-2xl bg-white/70 px-4 py-3">
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 opacity-60" aria-hidden="true">
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
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-transparent text-sm outline-none placeholder:opacity-60"
          placeholder="Search..."
          aria-label="Search categories"
        />
      </div>

      {loading ? (
        <div className="mt-6 rounded-3xl bg-white/70 p-6 text-sm opacity-70">Loading categories…</div>
      ) : errorText ? (
        <div className="mt-6 rounded-3xl bg-white/70 p-6 text-sm">
          <div className="font-semibold text-[#7a1c1c]">Couldn’t load categories</div>
          <div className="mt-1 opacity-70">{errorText}</div>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="rounded-3xl bg-white/70 p-5 shadow-[0_24px_60px_rgba(0,37,33,0.06)]"
            >
              <div className="flex items-center gap-4">
                <div
                  className="h-14 w-14 rounded-2xl bg-white/60 ring-1 ring-black/10 bg-cover bg-center"
                  style={{
                    backgroundImage: c.coverUrl ? `url(${c.coverUrl})` : undefined,
                  }}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{c.name}</div>
                  <div className="mt-1 text-xs opacity-70">
                    {c.productCount} products
                    {c.slug ? <span className="opacity-60"> · {c.slug}</span> : null}
                  </div>
                </div>
                <Link
                  href={`/admin/products?category=${encodeURIComponent(c.id)}`}
                  className="rounded-2xl bg-white/60 px-4 py-2 text-sm font-semibold hover:bg-white/80"
                >
                  View
                </Link>
              </div>
            </div>
          ))}

          {filtered.length === 0 ? (
            <div className="rounded-3xl bg-white/70 p-6 text-sm opacity-70">No categories found.</div>
          ) : null}
        </div>
      )}
    </>
  );
}

