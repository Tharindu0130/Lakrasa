"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import {
  Mail,
  ShoppingBag,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Truck,
  Gift,
  Plus,
  Minus,
  MapPin,
  CreditCard,
  Check,
} from "lucide-react";
import Link from "next/link";
import { readCart, CartItem } from "@/lib/cart-storage";
import { useCheckoutStore } from "@/lib/checkout-store";
import { calculateShipping } from "@/lib/shipping";
import { writePendingPayment, type PendingPaymentData } from "@/lib/pending-payment";

const getShippingOptionKey = (
  option: {
    provider_id: string;
    name: string;
    price_lkr: number;
    estimated_days_min: number;
    estimated_days_max: number;
  },
  index: number
) =>
  [
    option.provider_id || "no-provider",
    option.name,
    option.price_lkr,
    option.estimated_days_min,
    option.estimated_days_max,
    index,
  ].join("|");

export default function CheckoutPage() {
  const { user, profile } = useStore();
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [guestEmail, setGuestEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // Checkout store
  const {
    addOns,
    setAddOns,
    delivery,
    setDelivery,
    billing,
    setBilling,
    sameAsDelivery,
    shippingOptions,
    selectedShipping,
    setShippingOptions,
    setSelectedShipping,
    includeMessage,
    setIncludeMessage,
    giftDetails,
    setGiftDetails,
    giftMessage,
    setGiftMessage,
  } = useCheckoutStore();

  const [showAddOns, setShowAddOns] = useState(false);
  const [shippingLoading, setShippingLoading] = useState(false);

  // Load cart and autofill user data
  useEffect(() => {
    setCart(readCart());

    if (user && profile) {
      setDelivery({
        shippingFirstName: profile.name?.split(" ")[0] || "",
        shippingLastName: profile.name?.split(" ").slice(1).join(" ") || "",
        shippingPhone: profile.phone || "",
      });
      // If same as delivery, update billing too
      setBilling({
        billingFirstName: profile.name?.split(" ")[0] || "",
        billingLastName: profile.name?.split(" ").slice(1).join(" ") || "",
        billingPhone: profile.phone || "",
      });
    }
  }, [user, profile]);

  // Auto-fetch shipping on mount
  useEffect(() => {
    if (cart.length > 0) {
      fetchShippingRates();
    }
  }, []);

  const fetchShippingRates = async () => {
    if (cart.length === 0) return;
    
    setShippingLoading(true);
    try {
      const rates = await calculateShipping(cart, delivery.shippingCity || 'Colombo');
      setShippingOptions(rates);
    } catch (error) {
      console.error('Error fetching shipping:', error);
    } finally {
      setShippingLoading(false);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const addOnsTotal = addOns.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = selectedShipping?.price_lkr || 0;
  const total = subtotal + addOnsTotal + shippingCost;

  const updateAddOnQuantity = (id: string, delta: number) => {
    const updated = addOns
      .map((item) =>
        item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
      )
      .filter((item) => item.quantity > 0);
    setAddOns(updated);
  };

  const addAddOn = (item: Omit<CartItem, "quantity"> & { weight_kg: number }) => {
    const existing = addOns.find((a) => a.id === item.id);
    if (existing) {
      updateAddOnQuantity(item.id, 1);
    } else {
      setAddOns([...addOns, { ...item, quantity: 1 }]);
    }
  };

  const validateDelivery = () => {
    if (!delivery.shippingLastName.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Last name is required',
        confirmButtonColor: '#15803d',
      });
      return false;
    }
    if (!delivery.shippingAddressLine.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Address is required',
        confirmButtonColor: '#15803d',
      });
      return false;
    }
    if (!delivery.shippingPhone.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Phone is required',
        confirmButtonColor: '#15803d',
      });
      return false;
    }
    // Sri Lanka phone validation
    const phoneRegex = /^(\+94|0)?[7-9][0-9]{8}$/;
    if (!phoneRegex.test(delivery.shippingPhone.replace(/\s/g, ""))) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Phone Number',
        text: 'Please enter a valid Sri Lankan phone number',
        confirmButtonColor: '#15803d',
      });
      return false;
    }
    if (!selectedShipping) {
      Swal.fire({
        icon: 'warning',
        title: 'Select Shipping',
        text: 'Please select a shipping method',
        confirmButtonColor: '#15803d',
      });
      return false;
    }
    return true;
  };

  const validateContact = () => {
    if (user) return true;

    if (!guestEmail.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Email address is required",
        confirmButtonColor: "#15803d",
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestEmail.trim())) {
      Swal.fire({
        icon: "error",
        title: "Invalid Email",
        text: "Please enter a valid email address",
        confirmButtonColor: "#15803d",
      });
      return false;
    }

    return true;
  };

  const validateGift = () => {
    if (includeMessage) {
      if (!giftDetails.senderName.trim()) {
        Swal.fire({
          icon: 'warning',
          title: 'Missing Information',
          text: 'Sender name is required',
          confirmButtonColor: '#15803d',
        });
        return false;
      }
      if (!giftDetails.recipientName.trim()) {
        Swal.fire({
          icon: 'warning',
          title: 'Missing Information',
          text: 'Recipient name is required',
          confirmButtonColor: '#15803d',
        });
        return false;
      }
      if (!giftDetails.recipientEmail.trim()) {
        Swal.fire({
          icon: 'warning',
          title: 'Missing Information',
          text: 'Recipient email is required for email delivery',
          confirmButtonColor: '#15803d',
        });
        return false;
      }
      if (!giftDetails.relationship) {
        Swal.fire({
          icon: 'warning',
          title: 'Missing Information',
          text: 'Please select your relationship with the recipient',
          confirmButtonColor: '#15803d',
        });
        return false;
      }
    }
    return true;
  };

  const handleProceedToPayment = async () => {
    if (cart.length === 0) return;
    if (!validateContact()) return;
    if (!validateDelivery()) return;
    if (!validateGift()) return;

    setLoading(true);

    try {
      if (!selectedShipping) {
        throw new Error("Please select a shipping method.");
      }

      const tempOrderId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? `pending_${crypto.randomUUID()}`
          : `pending_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

      const pendingPayload: PendingPaymentData = {
        tempOrderId,
        cart,
        addOns,
        guestEmail: guestEmail.trim(),
        userId: user?.id || null,
        userEmail: user?.email || null,
        delivery,
        billing,
        sameAsDelivery,
        selectedShipping,
        includeMessage,
        giftDetails,
        giftMessage,
        subtotal,
        addOnsTotal,
        shippingCost,
        total,
        itemCount:
          cart.reduce((sum, item) => sum + item.quantity, 0) +
          addOns.reduce((sum, item) => sum + item.quantity, 0),
        createdAt: new Date().toISOString(),
      };

      writePendingPayment(pendingPayload);
      router.push("/payment");
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Unable to continue',
        text: err.message || "We couldn't prepare your payment session.",
        confirmButtonColor: '#15803d',
      });
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
          <Link
            href="/products"
            className="text-xs font-bold tracking-widest uppercase border-b border-black pb-1"
          >
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-serif text-gray-900 mb-2">Checkout</h1>
          <p className="text-sm text-gray-500">Complete your order</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Section */}
            <section className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <Mail className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
              </div>

              {user ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800 font-medium">Logged in as {user.email}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                    />
                  </div>
                </div>
              )}
            </section>

            {/* Add-ons Section */}
            <section className="bg-white rounded-xl shadow-sm overflow-hidden">
              <button
                onClick={() => setShowAddOns(!showAddOns)}
                className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  <Plus className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Need Additional Bags?</h2>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    showAddOns ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {showAddOns && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 space-y-4">
                      {/* Sample add-on items */}
                      <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">Premium Gift Bag</p>
                          <p className="text-xs text-gray-500 mt-1">Rs. 250</p>
                        </div>
                        <button
                          onClick={() =>
                            addAddOn({
                              id: "addon-1",
                              name: "Premium Gift Bag",
                              price: 250,
                              image: "",
                              weight_kg: 0.1,
                            })
                          }
                          className="px-4 py-2 bg-green-700 text-white text-xs font-semibold rounded-lg hover:bg-green-800 transition"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* Delivery Details */}
            <section className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <MapPin className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Delivery Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={delivery.shippingFirstName}
                    onChange={(e) => setDelivery({ shippingFirstName: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={delivery.shippingLastName}
                    onChange={(e) => setDelivery({ shippingLastName: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition font-medium"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                    Address *
                  </label>
                  <input
                    type="text"
                    value={delivery.shippingAddressLine}
                    onChange={(e) => setDelivery({ shippingAddressLine: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition font-medium"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                    Apartment, suite, etc. (optional)
                  </label>
                  <input
                    type="text"
                    value={delivery.shippingApartment}
                    onChange={(e) => setDelivery({ shippingApartment: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={delivery.shippingCity}
                    onChange={(e) => setDelivery({ shippingCity: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                    Postal Code (optional)
                  </label>
                  <input
                    type="text"
                    value={delivery.shippingPostalCode}
                    onChange={(e) => setDelivery({ shippingPostalCode: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition font-medium"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={delivery.shippingPhone}
                    onChange={(e) => setDelivery({ shippingPhone: e.target.value })}
                    placeholder="+94 7X XXX XXXX"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition font-medium"
                  />
                </div>
              </div>
            </section>

            {/* Shipping Method */}
            <section className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <Truck className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Shipping Method</h2>
              </div>

              {shippingLoading ? (
                <div className="flex items-center gap-3 p-4">
                  <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-gray-600">Calculating shipping rates...</p>
                </div>
              ) : shippingOptions.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    {!delivery.shippingCity 
                      ? "Enter your city to see shipping options" 
                      : "No shipping options available for your area"}
                  </p>
                  {delivery.shippingCity && (
                    <button
                      onClick={fetchShippingRates}
                      className="text-sm text-green-700 hover:text-green-800 font-medium underline"
                    >
                      Refresh shipping rates
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {shippingOptions.map((option, index) => {
                    const isSelected =
                      !!selectedShipping &&
                      getShippingOptionKey(selectedShipping, -1) ===
                        getShippingOptionKey(option, -1);

                    return (
                    <button
                      key={getShippingOptionKey(option, index)}
                      onClick={() => setSelectedShipping(option)}
                      className={`w-full flex items-center justify-between p-4 border-2 rounded-lg transition ${
                        isSelected
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? "border-green-500 bg-green-500"
                              : "border-gray-300"
                          }`}
                        >
                          {isSelected && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold text-gray-900">
                            {option.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {option.estimated_days_min}-{option.estimated_days_max} business days
                          </p>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-gray-900">
                        Rs. {option.price_lkr.toLocaleString()}
                      </p>
                    </button>
                  );
                  })}
                </div>
              )}
            </section>

            {/* Gift Message Section */}
            <section className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <Gift className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Gift Options</h2>
              </div>

              <label className="flex items-start gap-3 cursor-pointer mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <input
                  type="checkbox"
                  checked={includeMessage}
                  onChange={(e) => setIncludeMessage(e.target.checked)}
                  className="w-5 h-5 text-green-700 border-gray-300 rounded focus:ring-green-500 mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Want to include a special message with your gift?</span>
                  <p className="text-xs text-gray-600 mt-1">Add sender/recipient details and a personal message</p>
                </div>
              </label>

              {includeMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-6"
                >
                  {/* Sender */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">
                      Sender Information
                    </h3>
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Your Name *"
                        value={giftDetails.senderName}
                        onChange={(e) =>
                          setGiftDetails({ senderName: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                      />
                      <input
                        type="email"
                        placeholder="Your Email"
                        value={giftDetails.senderEmail}
                        onChange={(e) =>
                          setGiftDetails({ senderEmail: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                      />
                      <input
                        type="tel"
                        placeholder="Your Phone"
                        value={giftDetails.senderPhone}
                        onChange={(e) =>
                          setGiftDetails({ senderPhone: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Recipient */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">
                      Recipient Information
                    </h3>
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Recipient Name *"
                        value={giftDetails.recipientName}
                        onChange={(e) =>
                          setGiftDetails({ recipientName: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                      />
                      <input
                        type="email"
                        placeholder="Recipient Email *"
                        value={giftDetails.recipientEmail}
                        onChange={(e) =>
                          setGiftDetails({ recipientEmail: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                      />
                      <input
                        type="tel"
                        placeholder="Recipient Phone"
                        value={giftDetails.recipientPhone}
                        onChange={(e) =>
                          setGiftDetails({ recipientPhone: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                        Occasion
                      </label>
                      <select
                        value={giftDetails.occasion}
                        onChange={(e) =>
                          setGiftDetails({ occasion: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                      >
                        <option value="">Select occasion</option>
                        <option value="birthday">Birthday</option>
                        <option value="anniversary">Anniversary</option>
                        <option value="wedding">Wedding</option>
                        <option value="thank-you">Thank You</option>
                        <option value="holiday">Holiday</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                        Relationship *
                      </label>
                      <select
                        value={giftDetails.relationship}
                        onChange={(e) =>
                          setGiftDetails({ relationship: e.target.value })
                        }
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                      >
                        <option value="">Select relationship</option>
                        <option value="family">Family</option>
                        <option value="friend">Friend</option>
                        <option value="partner">Partner</option>
                        <option value="colleague">Colleague</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Message Textarea - Always Visible */}
              <div className="mt-6">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Gift Message
                </label>
                <textarea
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value.slice(0, 500))}
                  placeholder="Leave a heartfelt message..."
                  maxLength={500}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition resize-none"
                />
                <p className="text-xs text-gray-500 mt-2 text-right">
                  {giftMessage.length}/500 characters
                </p>
              </div>
            </section>

            {/* Payment */}
            <section className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Payment</h2>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700 font-medium">WebX Pay</p>
                <p className="text-xs text-gray-500 mt-1">
                  Pay Now opens a secure WebX Pay checkout. Your order is saved only after payment succeeds.
                </p>
              </div>

              <button
                onClick={handleProceedToPayment}
                disabled={loading}
                className="w-full bg-green-700 text-white py-4 rounded-lg text-sm font-bold tracking-wide uppercase hover:bg-green-800 transition-all flex items-center justify-center gap-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Redirecting..." : `Pay Now - Rs. ${total.toLocaleString()}`}
                {!loading && <ChevronRight className="w-4 h-4" />}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                Secure Payment Powered by WebX
              </div>
            </section>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6 max-h-80 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 relative overflow-hidden">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          No Image
                        </div>
                      )}
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-700 text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Rs. {item.price.toLocaleString()}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      Rs. {(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}

                {addOns.map((item) => (
                  <div key={`addon-${item.id}`} className="flex gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 relative overflow-hidden">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          No Image
                        </div>
                      )}
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Add-on</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        Rs. {(item.price * item.quantity).toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateAddOnQuantity(item.id, -1)}
                          className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => updateAddOnQuantity(item.id, 1)}
                          className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-6 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold text-gray-900">
                    Rs. {subtotal.toLocaleString()}
                  </span>
                </div>
                {addOnsTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Add-ons</span>
                    <span className="font-semibold text-gray-900">
                      Rs. {addOnsTotal.toLocaleString()}
                    </span>
                  </div>
                )}
                {shippingCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-semibold text-gray-900">
                      Rs. {shippingCost.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-4 border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-green-700">Rs. {total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
