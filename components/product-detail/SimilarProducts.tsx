"use client";

import ProductCard, { ProductCardItem } from "@/components/product/ProductCard";

type SimilarProductsProps = {
  products: ProductCardItem[];
  loading?: boolean;
};

export default function SimilarProducts({ products, loading }: SimilarProductsProps) {
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Similar Products</h2>
        <p className="text-gray-500">Loading similar products...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Similar Products</h2>
        <p className="text-gray-500">No similar products available right now.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Similar Products</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {products.map((item) => (
          <ProductCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
