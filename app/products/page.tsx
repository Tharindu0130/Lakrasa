"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ProductCard, { ProductCardItem } from "@/components/product/ProductCard";
import ProductFilters from "@/components/product/ProductFilters";
import { getSortedImageUrls, ProductImageRow } from "@/lib/product-utils";

type ProductRow = {
  id: string;
  title: string;
  price_lkr: number;
  stock_status?: string | null;
  category_id?: string | null;
  categories?: { id: string; name: string } | { id: string; name: string }[] | null;
  product_images?: ProductImageRow[] | null;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductCardItem[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [maxPossiblePrice, setMaxPossiblePrice] = useState(10000); // Default fallback
  const [sortBy, setSortBy] = useState("default");

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setErrorMessage(null);

      const { data, error } = await supabase
        .from("products")
        .select(`
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

      const categoryRes = await supabase.from("categories").select("id, name").order("name");

      if (error || categoryRes.error) {
        console.error("ERROR:", error);
        setErrorMessage(error?.message ?? categoryRes.error?.message ?? "Failed to load products");
        setProducts([]);
        setCategories([]);
        setLoading(false);
        return;
      }

      const rows = (data ?? []) as ProductRow[];
      const mapped: ProductCardItem[] = rows.map((product) => {
        const category =
          Array.isArray(product.categories) ? product.categories[0] : product.categories;
        const images = getSortedImageUrls(product.product_images);
        return {
          id: String(product.id),
          name: product.title,
          priceLkr: Number(product.price_lkr),
          stock_status: product.stock_status ?? "unknown",
          category_id: product.category_id ?? category?.id ?? null,
          images,
        };
      });

      setProducts(mapped);
      
      // Calculate max price in catalog
      if (mapped.length > 0) {
        const highest = Math.max(...mapped.map(p => p.priceLkr));
        setMaxPossiblePrice(highest);
        setMaxPrice(String(highest));
      }

      setCategories((categoryRes.data ?? []) as { id: string; name: string }[]);
      setLoading(false);
    };

    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (selectedCategory) {
      list = list.filter((p) => p.category_id === selectedCategory);
    }

    const max = Number(maxPrice);
    if (Number.isFinite(max) && maxPrice !== "") {
      list = list.filter((p) => p.priceLkr <= max);
    }

    if (sortBy === "price_asc") {
      list.sort((a, b) => a.priceLkr - b.priceLkr);
    } else if (sortBy === "price_desc") {
      list.sort((a, b) => b.priceLkr - a.priceLkr);
    }

    return list;
  }, [products, selectedCategory, maxPrice, sortBy]);

  return (
    <div className="bg-[#f5f2ed] py-10 px-6 md:px-16">
      <h1 className="text-3xl font-semibold mb-6 text-green-700">Our Products</h1>

      <ProductFilters
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
        maxPossiblePrice={maxPossiblePrice}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      {errorMessage && (
        <p className="text-red-600 mb-6">{errorMessage}</p>
      )}
      {loading && <p className="text-gray-500">Loading products...</p>}
      {!loading && !errorMessage && filteredProducts.length === 0 && (
        <p className="text-gray-500">No products found.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {filteredProducts.map((item) => (
          <ProductCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}