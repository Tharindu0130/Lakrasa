"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { addToCart } from "@/lib/cart-storage";
import Swal from "sweetalert2";
import { ProductCardItem } from "@/components/product/ProductCard";
import { getSortedImageUrls } from "@/lib/product-utils";
import ProductImages from "@/components/product-detail/ProductImages";
import ProductDetails from "@/components/product-detail/ProductDetails";
import SimilarProducts from "@/components/product-detail/SimilarProducts";
import { ProductRow } from "@/components/product-detail/types";

function getImages(product: ProductRow | null): string[] {
  if (!product) return [];
  const fromGallery = getSortedImageUrls(product.product_images);
  if (fromGallery.length > 0) return fromGallery;
  return [];
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const productId = params?.id;

  const [product, setProduct] = useState<ProductRow | null>(null);
  const [similarProducts, setSimilarProducts] = useState<ProductCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    if (!product) return;
    const images = getImages(product);
    addToCart(
      {
        id: String(product.id),
        name: product.title,
        price: Number(product.price_lkr),
        image: images[0] ?? "",
      },
      quantity
    );
    // Show success feedback with SweetAlert
    Swal.fire({
      icon: 'success',
      title: 'Added to Cart!',
      text: `${quantity} item(s) added to your cart`,
      confirmButtonColor: '#15803d',
      timer: 2000,
      showConfirmButton: false,
    });
  };

  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      setLoading(true);
      setErrorMessage(null);

      // Query 1: current product with ordered gallery data via relation.
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
        `)
        .eq("id", productId)
        .single();

      if (error) {
        setErrorMessage(error.message);
        setProduct(null);
        setLoading(false);
        return;
      }

      const typed = data as ProductRow;
      const imgs = getImages(typed);
      setProduct(typed);
      setSelectedImage(imgs[0] ?? "");

      const category =
        Array.isArray(typed.categories) ? typed.categories[0] : typed.categories;
      const categoryId = typed.category_id ?? category?.id ?? null;

      if (categoryId) {
        setSimilarLoading(true);
        // Query 2: similar products by category, excluding current.
        const similarRes = await supabase
          .from("products")
          .select(`
            id,
            title,
            price_lkr,
            stock_status,
            category_id,
            product_images (
              image_url,
              sort_order
            )
          `)
          .eq("category_id", categoryId)
          .neq("id", productId)
          .limit(6);

        if (!similarRes.error) {
          const mapped: ProductCardItem[] = ((similarRes.data ?? []) as ProductRow[]).map(
            (p) => ({
              id: String(p.id),
              name: p.title,
              priceLkr: Number(p.price_lkr),
              stock_status: p.stock_status ?? "unknown",
              category_id: p.category_id ?? null,
              images: getSortedImageUrls(p.product_images),
            })
          );
          setSimilarProducts(mapped);
        }
        setSimilarLoading(false);
      } else {
        setSimilarProducts([]);
      }

      setLoading(false);
    };

    fetchProduct();
  }, [productId]);

  const images = useMemo(() => getImages(product), [product]);

  if (loading) {
    return (
      <div className="bg-[#f5f2ed] py-10 px-6 md:px-16">
        <p className="text-gray-500">Loading product...</p>
      </div>
    );
  }

  if (errorMessage || !product) {
    return (
      <div className="bg-[#f5f2ed] py-10 px-6 md:px-16">
        <p className="text-red-600">{errorMessage ?? "Product not found."}</p>
      </div>
    );
  }

  return (
    <div className="bg-[#f5f2ed] py-10 px-6 md:px-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 mb-14">
        <ProductImages
          title={product.title}
          images={images}
          selectedImage={selectedImage}
          setSelectedImage={setSelectedImage}
        />

        <ProductDetails
          title={product.title}
          priceLkr={Number(product.price_lkr)}
          stockStatus={String(product.stock_status ?? "unknown")}
          description={product.description_full ?? product.description ?? "No description available."}
          quantity={quantity}
          setQuantity={setQuantity}
          onAddToCart={handleAddToCart}
        />
      </div>

      <SimilarProducts products={similarProducts} loading={similarLoading} />
    </div>
  );
}
