"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type ProductCardItem = {
  id: string;
  name: string;
  priceLkr: number;
  stock_status: string;
  category_id?: string | null;
  images: string[];
};

type ProductCardProps = {
  item: ProductCardItem;
};

export default function ProductCard({ item }: ProductCardProps) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const primaryImage = item.images[0];
  const secondaryImage = item.images[1];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => router.push(`/products/${item.id}`)}
      className="bg-white rounded-2xl p-5 shadow hover:shadow-lg transition cursor-pointer"
    >
      <div className="w-full h-48 rounded-lg mb-4 overflow-hidden">
        {primaryImage ? (
          <div className="relative w-full h-full">
            <img
              src={primaryImage}
              alt={item.name}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-900 ease-out ${
                secondaryImage && hovered ? "opacity-0 scale-105" : "opacity-100 scale-100"
              }`}
            />
            {secondaryImage ? (
              <img
                src={secondaryImage}
                alt={`${item.name} alternate`}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-900 ease-out ${
                  hovered ? "opacity-100 scale-105" : "opacity-0 scale-100"
                }`}
              />
            ) : null}
          </div>
        ) : (
          <div className="w-full h-full bg-gray-200"></div>
        )}
      </div>

      <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
      <p className="text-green-700 font-medium mt-2">
        Rs. {item.priceLkr.toLocaleString("en-LK")}
      </p>
      <p className="text-sm text-gray-500 mt-1 capitalize">
        {item.stock_status.replaceAll("_", " ")}
      </p>
    </div>
  );
}
