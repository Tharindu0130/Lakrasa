"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ShoppingBag, ChevronDown, ChevronRight, MessageSquare, ShieldCheck, Truck } from "lucide-react";
import Link from "next/link";
import { readCart, writeCart, CartItem } from "@/lib/cart-storage";

export default function CheckoutPage() {
  const { user, profile } = useStore();
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddons, setShowAddons] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    message: "",
  });

  useEffect(() => {
    // Load cart from localStorage
    setCart(readCart());

    if (user && profile) {
      setFormData((prev) => ({
        ...prev,
        email: user.email || "",
        phone: profile.phone || "",
      }));
    }
  }, [user, profile]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setLoading(true);

    try {
      // Simulate Payment Logic (Since PayHere is paused)
      console.log("Simulating payment...");
      await new Promise(resolve => setTimeout(resolve, 1500));

      const isGuest = !user;
      const guestId = isGuest ? `GUEST-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${formData.phone}` : null;

      // 1. Create Order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user?.id || null,
          guest_id: guestId,
          email: formData.email,
          total_amount: subtotal,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Create Order Items
      const orderItems = cart.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      // 3. Clear Cart & Redirect
      writeCart([]);
      console.log(`Order Created! Use tracking URL with tracking_code from tracking table`);
      router.push(`/track`);
    } catch (err: any) {
      alert(`Error creating order: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-gray-100 mx-auto mb-6" />
          <h1 className="text-3xl font-serif text-gray-900 mb-4">Your cart is empty</h1>
          <Link href="/products" className="text-xs font-bold tracking-widest uppercase border-b border-black pb-1">
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 pb-24">
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 py-12 md:py-20">
        
        {/* Left Side: Checkout Form */}
        <div className="space-y-12">
          <header>
            <h1 className="text-4xl font-serif mb-2">Checkout</h1>
            <p className="text-gray-400 text-sm tracking-widest uppercase">Complete your luxury experience</p>
          </header>

          {!user && (
            <div className="bg-gray-50 rounded-2xl p-6 flex items-center justify-between">
              <p className="text-sm text-gray-600">Have an account?</p>
              <Link href="/auth" className="text-xs font-bold tracking-widest uppercase text-black hover:underline">
                Sign in
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Contact Info */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <Mail className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-medium">Contact Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.com"
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-4 text-sm outline-none focus:ring-2 focus:ring-black/5 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+94 7X XXX XXXX"
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-4 text-sm outline-none focus:ring-2 focus:ring-black/5 transition-all"
                  />
                </div>
              </div>
            </section>

            {/* Delivery Info (Simplified placeholder as per rules: Keep Contact + Delivery) */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <Truck className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-medium">Delivery Details</h2>
              </div>
              <p className="text-xs text-gray-400 italic font-medium">Detailed shipping address will be confirmed via phone call after order placement.</p>
            </section>

            {/* Add-ons Section */}
            <section className="space-y-4">
              <button
                type="button"
                onClick={() => setShowAddons(!showAddons)}
                className="flex items-center justify-between w-full hover:bg-gray-50 p-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium">Add a message or instruction</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showAddons ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {showAddons && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Special instructions for your order..."
                      rows={4}
                      className="w-full bg-gray-50 border-none rounded-xl px-4 py-4 text-sm outline-none focus:ring-2 focus:ring-black/5 transition-all resize-none"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-700 text-white py-5 rounded-2xl text-sm font-bold tracking-[0.2em] uppercase hover:bg-green-800 transition-all flex items-center justify-center gap-3 shadow-xl shadow-green-900/10"
              >
                {loading ? "Processing..." : "Pay Now"}
                {!loading && <ChevronRight className="w-4 h-4" />}
              </button>
              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                <ShieldCheck className="w-3 h-3 text-green-500" />
                Secure Payment Powered by PayHere
              </div>
            </div>
          </form>
        </div>

        {/* Right Side: Order Summary */}
        <div className="lg:sticky lg:top-32 h-fit bg-gray-50/50 rounded-3xl p-8 md:p-10 border border-gray-100">
          <h2 className="text-xl font-serif mb-8 flex items-center gap-3">
            Order Summary
            <span className="text-xs font-sans bg-green-700 text-white px-2 py-1 rounded-full">{cart.length}</span>
          </h2>

          <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
            {cart.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="w-16 h-16 bg-white rounded-xl overflow-hidden shrink-0 border border-gray-100 relative">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-black text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                    {item.quantity}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900 line-clamp-1">{item.name}</p>
                  <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Rs. {item.price.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">Rs. {(item.price * item.quantity).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 space-y-4 pt-8 border-t border-gray-100">
            <div className="flex justify-between text-sm text-gray-500 uppercase tracking-widest font-medium">
              <span>Subtotal</span>
              <span>Rs. {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500 uppercase tracking-widest font-medium">
              <span>Shipping</span>
              <span className="text-green-600 font-bold">Calculated later</span>
            </div>
            <div className="flex justify-between items-end pt-4">
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase">Total Amount</p>
                <p className="text-3xl font-serif text-gray-900">Rs. {subtotal.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
