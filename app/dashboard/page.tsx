"use client";

import { useEffect, useState, useCallback } from "react";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Package, Phone, Mail, Edit2, Check, X, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";
import { embeddedTrackingCodeFromOrder } from "@/lib/tracking";

export default function DashboardPage() {
  const { user, profile, updateProfile, signOut, isInitialized } = useStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
  });

  const fetchOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (*),
          tracking (tracking_code)
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isInitialized) return;

    if (!user) {
      router.push("/auth");
    }
  }, [user, isInitialized, router]);

  useEffect(() => {
    if (user) {
      if (profile) {
        setEditForm({
          name: profile.name || "",
          phone: profile.phone || "",
        });
      }
      fetchOrders();
    } else if (isInitialized) {
      setLoading(false);
    }
  }, [user, profile, isInitialized, fetchOrders]);

  const handleUpdateProfile = async () => {
    const { error } = await updateProfile(editForm);
    if (!error) {
      setIsEditing(false);
    } else {
      alert(error.message);
    }
  };

  const mapStatus = (status: string) => {
    switch (status) {
      case "pending": return { label: "Ordered", color: "bg-blue-50 text-blue-600" };
      case "processing": return { label: "Processing", color: "bg-amber-50 text-amber-600" };
      case "shipped": return { label: "Shipped", color: "bg-purple-50 text-purple-600" };
      case "delivered": return { label: "Delivered", color: "bg-green-50 text-green-600" };
      default: return { label: status, color: "bg-gray-50 text-gray-600" };
    }
  };

  if (!isInitialized || (user && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-center px-6">
        <div className="space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-green-700 border-t-transparent rounded-full mx-auto"></div>
          <div className="animate-pulse text-gray-400 tracking-widest uppercase text-xs">Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12 px-6 md:px-10 w-full">
      {/* Header */}
      <div className="mb-16">
        <h1 className="text-4xl md:text-5xl font-serif text-gray-900 mb-4 antialiased">Account</h1>
        <button 
          onClick={signOut}
          className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] uppercase text-gray-400 hover:text-black transition-colors border-b border-transparent hover:border-black pb-0.5"
        >
          <User className="w-3 h-3" />
          Log out
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-x-16 gap-y-16">
        {/* Left: Order History */}
        <div className="lg:col-span-3">
          <h2 className="text-xl md:text-2xl font-serif text-gray-900 mb-8 lowercase first-letter:uppercase">Order history</h2>
          
          {orders.length === 0 ? (
            <p className="text-[11px] tracking-[0.2em] text-gray-400 uppercase font-bold">
              You haven&apos;t placed any orders yet.
            </p>
          ) : (
            <div className="space-y-12">
              {orders.map((order) => {
                const publicTrackingCode = embeddedTrackingCodeFromOrder(order);
                return (
                <div key={order.id} className="border-b border-gray-100 pb-12 last:border-0">
                  <div className="flex flex-col md:flex-row justify-between gap-6 mb-8">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-1 uppercase tracking-widest">Order #{order.id.slice(0, 8)}</h3>
                      {publicTrackingCode && (
                        <p className="text-[10px] text-green-700 uppercase tracking-[0.2em] mb-1">
                          Tracking ID: {publicTrackingCode}
                        </p>
                      )}
                      <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em]">
                        Placed on {new Date(order.created_at).toLocaleDateString("en-GB", { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full ${mapStatus(order.status).color}`}>
                        {mapStatus(order.status).label}
                      </span>
                      <Link
                        href={
                          publicTrackingCode
                            ? `/track?tracking=${encodeURIComponent(publicTrackingCode)}`
                            : "/track"
                        }
                        className="inline-flex items-center gap-2 text-[10px] font-bold text-green-700 uppercase tracking-[0.2em] border-b border-green-700/30 hover:border-green-700 transition-all pb-0.5"
                      >
                        Track Order
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      {order.order_items.map((item: any) => (
                        <div key={item.id} className="flex gap-4 items-center">
                          <div className="w-16 h-16 bg-gray-50 flex-shrink-0 relative overflow-hidden">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name || "Order item"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">
                                No Image
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900 uppercase tracking-wider">{item.name}</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Qty: {item.quantity} • Rs. {item.price.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="md:text-right flex flex-col justify-center">
                      <p className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-1">Total Amount</p>
                      <p className="text-2xl font-serif text-gray-900 whitespace-nowrap">Rs. {order.total_amount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </div>

        {/* Right: Account Details */}
        <div className="lg:col-span-1">
          <h2 className="text-xl md:text-2xl font-serif text-gray-900 mb-8 lowercase first-letter:uppercase">Account details</h2>
          <div className="space-y-6">
            <div className="space-y-1">
              {isEditing ? (
                <div className="space-y-4">
                  <input 
                    type="text" 
                    value={editForm.name} 
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    placeholder="Full Name"
                    className="w-full border-b border-gray-200 py-2 text-sm focus:border-black outline-none transition-colors font-serif"
                  />
                  <input 
                    type="text" 
                    value={editForm.phone} 
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    placeholder="Phone Number"
                    className="w-full border-b border-gray-200 py-2 text-sm focus:border-black outline-none transition-colors font-serif"
                  />
                  <div className="flex gap-4 pt-2">
                    <button onClick={handleUpdateProfile} className="text-[10px] font-bold text-green-700 uppercase tracking-widest">Save</button>
                    <button onClick={() => setIsEditing(false)} className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="group relative">
                  <p className="text-sm text-gray-900 font-serif mb-1 capitalize">{profile?.name || "No name set"}</p>
                  <p className="text-xs text-gray-500 mb-4">{user?.email}</p>
                  <p className="text-xs text-gray-600 mb-6">{profile?.phone || "No phone set"}</p>
                  
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] border-b border-gray-200 hover:border-black hover:text-black transition-all pb-1"
                  >
                    View Addresses (1)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
