"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Trash2, Minus, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  CartItem,
  getCartTotal,
  readCart,
  removeCartItem,
  updateCartItemQuantity,
} from "@/lib/cart-storage";

export default function CartPage() {
  const { user } = useStore();
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    // Load cart initially
    setItems(readCart());

    // Listen for cart updates from other components
    const handleCartUpdate = () => {
      setItems(readCart());
    };

    window.addEventListener('lakrasa:cart-updated', handleCartUpdate);
    
    // Also check on focus
    window.addEventListener('focus', handleCartUpdate);

    return () => {
      window.removeEventListener('lakrasa:cart-updated', handleCartUpdate);
      window.removeEventListener('focus', handleCartUpdate);
    };
  }, []);

  const total = useMemo(() => getCartTotal(items), [items]);

  const increase = (id: string, qty: number) => {
    setItems(updateCartItemQuantity(id, qty + 1));
  };

  const decrease = (id: string, qty: number) => {
    if (qty <= 1) {
      setItems(removeCartItem(id));
      return;
    }
    setItems(updateCartItemQuantity(id, qty - 1));
  };

  const remove = (id: string) => {
    setItems(removeCartItem(id));
  };

  return (
    <div className="min-h-screen bg-white py-10 px-6 md:px-16">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-baseline border-b border-gray-100 pb-8 mb-8">
          <h1 className="text-4xl font-serif text-gray-900">Your cart</h1>
          {items.length > 0 && (
            <Link
              href="/products"
              className="text-sm font-medium tracking-widest text-gray-900 border-b border-gray-900 hover:border-gray-400 transition-colors"
            >
              CONTINUE SHOPPING
            </Link>
          )}
        </div>

        {items.length === 0 ? (
          <div className="py-16 text-center max-w-2xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-serif text-gray-900 mb-12">
              Your cart is empty
            </h2>
            <Link
              href="/products"
              className="inline-block bg-green-700 text-white px-12 py-4 rounded-none uppercase tracking-[0.2em] text-sm hover:bg-green-800 transition font-medium"
            >
              Continue Shopping
            </Link>
            
            {!user && (
              <div className="mt-16 space-y-4">
                <h3 className="text-2xl font-serif text-gray-900">Have an account?</h3>
                <p className="text-sm tracking-widest text-gray-600">
                  <Link href="/auth" className="border-b border-gray-400 pb-0.5 hover:border-gray-900 transition-colors uppercase">
                    Log in
                  </Link>
                  {" TO CHECK OUT FASTER."}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Table Headers */}
            <div className="hidden md:grid grid-cols-12 gap-4 text-[10px] tracking-[0.2em] font-semibold text-gray-600 uppercase pb-4 border-b border-gray-200">
              <div className="col-span-6">Product</div>
              <div className="col-span-3 text-center">Quantity</div>
              <div className="col-span-3 text-right">Total</div>
            </div>

            {/* Cart Items */}
            <div className="divide-y divide-gray-100">
              {items.map((item) => (
                <div key={item.id} className="py-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Product Info */}
                  <div className="col-span-1 md:col-span-6 flex gap-6">
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-50 shrink-0 border border-gray-100 overflow-hidden">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col justify-center">
                      <h3 className="text-lg font-serif text-gray-900 leading-tight">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-900 mt-1 font-medium tracking-wider">
                        Rs. {item.price.toLocaleString("en-LK")}
                      </p>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="col-span-1 md:col-span-3 flex justify-center items-center gap-4">
                    <div className="flex items-center border border-black h-11">
                      <button
                        onClick={() => decrease(item.id, item.quantity)}
                        className="w-10 h-full flex items-center justify-center hover:bg-gray-50 transition border-r border-black"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={16} className="text-black" />
                      </button>
                      <span className="w-12 text-center text-base font-bold text-black">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => increase(item.id, item.quantity)}
                        className="w-10 h-full flex items-center justify-center hover:bg-gray-50 transition border-l border-black"
                        aria-label="Increase quantity"
                      >
                        <Plus size={16} className="text-black" />
                      </button>
                    </div>
                    <button
                      onClick={() => remove(item.id)}
                      className="text-gray-400 hover:text-black transition p-2"
                      aria-label="Remove item"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>

                  {/* Total */}
                  <div className="col-span-1 md:col-span-3 text-right">
                    <span className="text-xl font-serif font-bold text-black">
                      Rs. {(item.price * item.quantity).toLocaleString("en-LK")}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Footer */}
            <div className="border-t border-gray-100 pt-12 flex flex-col items-end">
              <div className="flex items-center gap-6 mb-2">
                <span className="text-gray-900 font-serif text-xl">Estimated total</span>
                <span className="text-2xl font-serif text-gray-900">
                  Rs. {total.toLocaleString("en-LK")}
                </span>
              </div>
              <p className="text-[10px] tracking-widest text-gray-500 font-semibold mb-8 text-right max-w-xs uppercase leading-relaxed">
                Taxes, discounts and shipping calculated at checkout
              </p>
              <Link 
                href="/checkout"
                className="w-full md:w-auto md:min-w-[320px] bg-green-700 text-white py-4 px-12 text-sm text-center uppercase tracking-[0.2em] font-medium hover:bg-green-800 transition block"
              >
                Check out
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
