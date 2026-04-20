"use client";

import { motion, useMotionValue, useAnimationFrame, useTransform } from "framer-motion";
import { wrap } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

type Item = {
  id: string;
  name: string;
  priceLkr: number;
  popular?: boolean;
  stock_status?: "in_stock" | "out_of_stock" | "backorder";
  images: string[];
};

type Collection = {
  id: string;
  name: string;
  items: Item[];
};

type CategoryEmbed = {
  id: string;
  name: string;
};

type ProductRow = {
  id: string;
  title: string;
  price_lkr: number;
  stock_status?: string | null;
  category_id?: string | null;
  popular?: boolean | null;
  image_url?: string | null;
  product_images?: {
    image_url?: string | null;
    sort_order?: number | null;
  }[] | null;
  categories: CategoryEmbed | CategoryEmbed[] | null;
};

function normalizeCategory(
  c: ProductRow["categories"]
): CategoryEmbed | null {
  if (!c) return null;
  return Array.isArray(c) ? c[0] ?? null : c;
}

function parseStockStatus(
  value: unknown
): Item["stock_status"] | undefined {
  if (
    value === "in_stock" ||
    value === "out_of_stock" ||
    value === "backorder"
  ) {
    return value;
  }
  return undefined;
}

function stockStatusLabel(status: Item["stock_status"] | undefined): string {
  switch (status) {
    case "in_stock":
      return "In stock";
    case "out_of_stock":
      return "Out of stock";
    case "backorder":
      return "Backorder";
    default:
      return "—";
  }
}

function normalizePublicImageUrl(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const value = raw.trim();
  if (!value) return "";

  // Already a full URL.
  if (/^https?:\/\//i.test(value)) return value;

  // Supabase paths (normalize to full public URL).
  const base = SUPABASE_URL.replace(/\/+$/, "");
  const cleaned = value.replace(/^\/+/, "");

  // If the DB stores "products/filename.png" or just "filename.png"
  if (cleaned.startsWith("products/")) {
    return `${base}/storage/v1/object/public/${cleaned}`;
  }
  if (!cleaned.includes("/")) {
    return `${base}/storage/v1/object/public/products/${cleaned}`;
  }

  // If the DB stores "storage/v1/object/public/...."
  if (cleaned.startsWith("storage/v1/object/public/")) {
    return `${base}/${cleaned}`;
  }

  // Fallback: return as-is so we can see it in logs.
  return value;
}

function rowToItem(row: ProductRow): Item {
  const images = (row.product_images ?? [])
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((img) => normalizePublicImageUrl(img.image_url))
    .filter((url) => !!url);

  // Fallback for older rows that still only have products.image_url
  if (images.length === 0) {
    const fallback = normalizePublicImageUrl(row.image_url);
    if (fallback) images.push(fallback);
  }

  return {
    id: String(row.id),
    name: row.title,
    priceLkr: Number(row.price_lkr),
    popular: row.popular === true,
    stock_status: parseStockStatus(row.stock_status),
    images,
  };
}

function groupProductsIntoCollections(rows: ProductRow[]): Collection[] {
  const byCategory = rows.reduce<Record<string, Collection>>((acc, row) => {
    const cat = normalizeCategory(row.categories);
    const collectionId =
      cat?.id ??
      (row.category_id != null ? String(row.category_id) : "uncategorized");
    const collectionName =
      cat?.name ?? (collectionId === "uncategorized" ? "Uncategorized" : "Category");

    if (!acc[collectionId]) {
      acc[collectionId] = {
        id: collectionId,
        name: collectionName,
        items: [],
      };
    }
    acc[collectionId].items.push(rowToItem(row));
    return acc;
  }, {});

  return Object.values(byCategory);
}

export default function Home() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setCatalogLoading(true);
      setCatalogError(null);

      const { data, error } = await supabase.from("products").select(`
          *,
          categories (
            id,
            name
          ),
          product_images (
            image_url,
            sort_order
          )
        `);

      if (cancelled) return;

      setCatalogLoading(false);

      if (error) {
        console.log("raw data", null);
        console.log("transformed collections", []);
        setCatalogError(error.message);
        setCollections([]);
        return;
      }

      console.log("raw data", data);
      const rows = (data ?? []) as ProductRow[];
      const next = groupProductsIntoCollections(rows);
      console.log("transformed collections", next);
      setCollections(next);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main>
      <section className="relative w-full h-[100svh] text-white overflow-hidden">

        {/* Background Media Container */}
        <div className="absolute inset-0 w-full h-full z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover hidden md:block"
          >
            <source src="/hero.mp4" type="video/mp4" />
          </video>

          <Image
            src="/hero.png"
            alt="Hero Background"
            fill
            priority
            loading="eager"
            sizes="(max-width: 768px) 100vw"
            style={{ objectFit: "cover" }}
            className="md:hidden"
          />
        </div>

        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent z-10"></div>

        {/* Content */}
        <div className="relative z-20 h-full flex items-center px-6 sm:px-10 md:px-20">
          <div className="max-w-4xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-light italic leading-tight mb-4 md:mb-6">
              The Real Taste <br />
              Of Sri Lanka.
            </h1>

            <p className="text-sm md:text-lg text-gray-300 mb-2">
              Savor the Essence of Sri Lankan Excellence
            </p>

            <p className="text-sm md:text-base text-gray-300 mb-6 md:mb-8">
              Where Every Spice Tells a Story of Unrivaled Quality and Unforgettable Flavor.
            </p>

            <button className="bg-green-700 hover:bg-green-800 px-6 py-3 rounded-lg transition flex items-center gap-2 text-sm font-semibold tracking-widest uppercase shadow-lg shadow-green-900/10">
              Read More →
            </button>
          </div>
        </div>
      </section>

      <section className="bg-[#f5f2ed] py-24 px-6 md:px-16 lg:px-24">

        {/* Top Heading Area */}
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-xl">
            <p className="text-sm tracking-[0.3em] text-green-800/60 uppercase font-medium mb-4">
              Curated Selections
            </p>
            <h2 className="text-4xl md:text-5xl font-light italic text-gray-900 leading-tight">
              A Legacy of <br />
              <span className="font-semibold not-italic">Sri Lankan Flavor.</span>
            </h2>
          </div>

          <div className="md:text-right">
            <p className="text-gray-500 max-w-sm text-sm md:text-base leading-relaxed">
              A limited series of seasonal pickings from the finest spice gardens in the central hills of Ceylon.
            </p>
          </div>
        </div>

        {/* Product collections (from Supabase) */}
        <div className="max-w-7xl mx-auto mb-16 space-y-16">
          {catalogError && (
            <p className="text-center text-red-600 text-sm">{catalogError}</p>
          )}
          {catalogLoading && (
            <p className="text-center text-gray-500 text-sm">
              Loading collections…
            </p>
          )}
          {!catalogLoading && !catalogError && collections.length === 0 && (
            <p className="text-center text-gray-500 text-sm">
              No products yet. Add items in Supabase to see them here.
            </p>
          )}
          {!catalogLoading &&
            (() => {
              let count = 0;
              return collections.map((collection) => {
                const remaining = 3 - count;
                if (remaining <= 0) return null;
                const itemsToShow = collection.items.slice(0, remaining);
                count += itemsToShow.length;

                return (
                  <div key={collection.id} className="mb-16 last:mb-0">
                    <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-8 border-b border-green-900/10 pb-3">
                      {collection.name}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                      {itemsToShow.map((item) => {
                        const primaryImage = item.images[0];
                        const secondaryImage = item.images[1];
                        const isHovered = hoveredId === item.id;
                        const showPrimary =
                          !!primaryImage && !brokenImages.has(`${item.id}:${primaryImage}`);
                        const showSecondary =
                          !!secondaryImage && !brokenImages.has(`${item.id}:${secondaryImage}`);
                        const stock = item.stock_status;
                        const stockTone =
                          stock === "in_stock"
                            ? "text-green-800"
                            : stock === "out_of_stock"
                              ? "text-red-700"
                              : stock === "backorder"
                                ? "text-amber-800"
                                : "text-gray-500";

                        return (
                          <Link
                            href={`/products/${item.id}`}
                            key={item.id}
                            className="group relative bg-white/40 p-3 rounded-[2.5rem] transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl hover:shadow-green-900/10 hover:bg-white border border-transparent hover:border-white block"
                            onMouseEnter={() => setHoveredId(item.id)}
                            onMouseLeave={() => setHoveredId(null)}
                          >
                            <div className="relative w-full h-[400px] rounded-[2rem] overflow-hidden shadow-inner bg-gray-100">
                              {showPrimary ? (
                                <div className="relative w-full h-full">
                                  <img
                                    src={primaryImage}
                                    alt={item.name}
                                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-900 ease-out ${
                                      showSecondary && isHovered ? "opacity-0 scale-105" : "opacity-100 scale-100"
                                    }`}
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = "none";
                                      const key = `${item.id}:${primaryImage}`;
                                      setBrokenImages((prev) => {
                                        if (prev.has(key)) return prev;
                                        const next = new Set(prev);
                                        next.add(key);
                                        return next;
                                      });
                                    }}
                                  />
                                  {showSecondary ? (
                                    <img
                                      src={secondaryImage}
                                      alt={`${item.name} alternate`}
                                      className={`absolute inset-0 w-full h-full object-cover transition-all duration-900 ease-out ${
                                        isHovered ? "opacity-100 scale-105" : "opacity-0 scale-100"
                                      }`}
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = "none";
                                        const key = `${item.id}:${secondaryImage}`;
                                        setBrokenImages((prev) => {
                                          if (prev.has(key)) return prev;
                                          const next = new Set(prev);
                                          next.add(key);
                                          return next;
                                        });
                                      }}
                                    />
                                  ) : null}
                                </div>
                              ) : (
                                <div className="w-full h-full bg-gray-200" />
                              )}
                              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                                {item.popular ? (
                                  <span className="bg-white/90 backdrop-blur-sm text-[10px] tracking-widest uppercase font-bold text-green-900 px-3 py-1.5 rounded-full shadow-sm">
                                    Popular
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            <div className="px-5 py-6">
                              <div className="flex justify-between items-start gap-3 mb-2">
                                <h3 className="text-xl font-semibold text-gray-900">
                                  {item.name}
                                </h3>
                              </div>
                              <p className="text-lg font-semibold text-green-800 mb-2">
                                LKR{" "}
                                {Number.isFinite(item.priceLkr)
                                  ? item.priceLkr.toLocaleString("en-LK")
                                  : "—"}
                              </p>
                              <p
                                className={`text-sm font-medium tracking-wide uppercase ${stockTone}`}
                              >
                                {stockStatusLabel(item.stock_status)}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()
          }
        </div>

        {/* Consolidated Action Button */}
        <div className="flex justify-center">
          <Link
            href="/products"
            className="px-10 py-4 bg-green-700 text-white rounded-full font-semibold tracking-widest uppercase text-sm hover:bg-green-800 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 block shadow-lg shadow-green-900/10"
          >
            Explore All Products
          </Link>
        </div>
      </section>

      <section className="bg-gradient-to-br from-green-50 via-[#f5f2ed] to-green-100 py-20 px-6 md:px-16">
        {/* WHO WE ARE */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-24">

          {/* MEDIA */}
          <div className="relative">

            {/* VIDEO */}
            <div className="relative w-full h-[320px] md:h-[420px] rounded-2xl overflow-hidden shadow-md">

              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              >
                <source src="/about-video.mp4" type="video/mp4" />
              </video>

              {/* Optional subtle overlay for premium look */}
              <div className="absolute inset-0 bg-black/10"></div>
            </div>

            {/* SMALL IMAGE (OVERLAY) */}
            <div className="absolute -bottom-8 -right-4 md:-bottom-10 md:-right-8 
                    w-[120px] md:w-[180px] h-[120px] md:h-[180px] 
                    rounded-xl overflow-hidden border-4 border-white 
                    shadow-xl z-10">
              <Image
                src="/about.jpg"
                alt="spices"
                fill
                sizes="(max-width: 768px) 120px, 180px"
                className="object-cover"
              />
            </div>

          </div>

          {/* TEXT */}
          <div>
            <p className="text-sm tracking-widest text-green-700 uppercase mb-2">
              Who We Are
            </p>

            <h2 className="text-3xl md:text-5xl font-semibold text-gray-800 mb-6 leading-tight">
              Rooted in Tradition
            </h2>

            <p className="text-gray-600 mb-4">
              Lakrasa Pvt Ltd has started its operations in the year 2009 as Subsidiary for My Computer Pvt Ltd and now operates its own at No 528, Kandy Road, Dalugama, Kelaniya.
            </p>

            <p className="text-gray-600 mb-6">
              We have our own grinding division functions with Automatic grinding machines and the Packing division with Automated packaging machine and the Products are untouchable from the raw material status to the finishing point to ensure the Quality and the hygienist of the products.
            </p>

            {/* STATS */}
            <div className="flex gap-10">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">2009</h3>
                <p className="text-sm text-gray-500">Founded Year</p>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-gray-800">100%</h3>
                <p className="text-sm text-gray-500">Organic Practice</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Trusted Brands Section */}
      <section className="py-16 bg-white overflow-hidden border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <p className="text-center text-sm tracking-[0.2em] text-gray-400 uppercase font-medium">
            Trusted by Leading Brands
          </p>
        </div>
        
        <BrandsMarquee />
      </section>

    

    </main>
  );
}

function BrandsMarquee() {
  const brands = [
    "brand1.png", "brand2.png", "brand3.png", "brand4.png", "brand5.png",
    "brand6.jpeg", "brand7.png", "brand8.png", "brand9.jpg", "brand10.jpeg",
    "brand11.jpg", "brand12.png", "brand13.png", "brand14.jpg", "brand15.png",
    "brand16.jpeg", "brand17.jpg", "brand18.png", "brand19.jpg", "brand20.png",
    "brand21.jpg", "brand22.jpeg", "brand23.png", "brand24.png", "brand25.jpeg",
    "brand26.png", "brand27.png"
  ];

  const duplicatedBrands = [...brands, ...brands, ...brands]; // Extra padding for ultra-smooth infinite loop
  
  const baseX = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragSurfaceRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);
  const isDraggingRef = useRef(false);
  const lastPointerXRef = useRef<number | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Width of exactly one iteration of the brands
      setContentWidth(containerRef.current.scrollWidth / 3);
    }
  }, []);

  useAnimationFrame((t, delta) => {
    if (contentWidth > 0 && !isDraggingRef.current) {
      const moveBy = -1.2 * (delta / 16); // Normalizing to speed
      baseX.set(baseX.get() + moveBy);
    }
  });

  // Use the wrap function to ensure it loops forever
  const x = useTransform(baseX, (v) => `${wrap(-contentWidth, 0, v)}px`);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    lastPointerXRef.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || lastPointerXRef.current === null) return;
    const deltaX = e.clientX - lastPointerXRef.current;
    baseX.set(baseX.get() + deltaX);
    lastPointerXRef.current = e.clientX;
  };

  const stopDragging = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    lastPointerXRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div
      ref={dragSurfaceRef}
      className="relative overflow-hidden cursor-grab active:cursor-grabbing touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
    >
      <motion.div
        ref={containerRef}
        className="flex items-center py-6 whitespace-nowrap"
        style={{ x }}
      >
        {duplicatedBrands.map((brand, index) => (
          <div
            key={index}
            className="flex-shrink-0 mx-10 md:mx-20 select-none"
          >
            <Image
              src={`/brands/${brand}`}
              alt="Brand Logo"
              width={280}
              height={110}
              className="h-20 md:h-28 w-auto object-contain"
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
 