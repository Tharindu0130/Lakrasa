"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { User, LogOut, LayoutDashboard, ShoppingBag, Menu, X, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabaseClient";
import { readCart } from "@/lib/cart-storage";

export default function Navbar() {
  const pathname = usePathname();
  const { user, profile, setSession, signOut, cart } = useStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCartCount = () => {
      const cart = readCart();
      const count = cart.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(count);
    };

    updateCartCount();
    const interval = setInterval(updateCartCount, 1000);
    return () => clearInterval(interval);
  }, []);

  const linkClass = (href: string) => {
    const isActive = pathname === href;
    return [
      "hover:text-green-700 transition-colors",
      isActive ? "text-green-700 border-b-2 border-green-700 pb-1" : "",
    ]
      .filter(Boolean)
      .join(" ");
  };

  const mobileLinkClass = (href: string) => {
    const isActive = pathname === href;
    return [
      "hover:text-green-700 transition-colors",
      isActive ? "text-green-700" : "",
    ]
      .filter(Boolean)
      .join(" ");
  };

  return (
    <nav className="w-full bg-gray-100 border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto relative flex items-center justify-between px-4 md:px-6 py-4">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Lakrasa Logo"
            width={160}
            height={50}
            priority
            className="h-[48px] md:h-[64px] w-auto"
            style={{ width: "auto" }}
          />
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 text-gray-700 font-medium absolute left-1/2 -translate-x-1/2">
          <Link href="/" className={linkClass("/")}>
            Home
          </Link>
          <Link href="/products" className={linkClass("/products")}>
            Products
          </Link>
          <Link href="/about" className={linkClass("/about")}>
            About
          </Link>
          <Link href="/track" className={linkClass("/track")}>
            Tracking
          </Link>
          <Link href="/contact" className={linkClass("/contact")}>
            Contact
          </Link>
        </div>

        {/* Right Icons */}
        <div className="flex items-center gap-3 md:gap-5 text-gray-700">
          <Link href="/cart" className="relative">
            <ShoppingBag className="cursor-pointer hover:text-green-700 w-5 h-5 md:w-6 md:h-6" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-green-700 text-white text-[10px] flex items-center justify-center animate-in zoom-in duration-300">
                {cartCount}
              </span>
            )}
          </Link>
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-1 hover:text-green-700 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-100">
                  {profile?.name ? (
                    <span className="text-[10px] font-bold uppercase">{profile.name.charAt(0)}</span>
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <ChevronDown className={`w-3 h-3 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-3 w-48 bg-white border border-gray-100 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-gray-50 mb-1">
                    <p className="text-xs font-semibold text-gray-900 truncate">{profile?.name || 'User'}</p>
                    <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                  </div>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowDropdown(false)}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setShowDropdown(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/auth">
              <User className="cursor-pointer hover:text-green-700 w-5 h-5 md:w-6 md:h-6" />
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden flex flex-col gap-4 px-6 pb-4 text-gray-700 font-medium bg-gray-100 border-t">
          <Link href="/" className={mobileLinkClass("/")} onClick={() => setIsOpen(false)}>
            Home
          </Link>
          <Link
            href="/products"
            className={mobileLinkClass("/products")}
            onClick={() => setIsOpen(false)}
          >
            Products
          </Link>
          <Link href="/about" className={mobileLinkClass("/about")} onClick={() => setIsOpen(false)}>
            About
          </Link>
          <Link
            href="/track"
            className={mobileLinkClass("/track")}
            onClick={() => setIsOpen(false)}
          >
            Tracking
          </Link>
          <Link
            href="/contact"
            className={mobileLinkClass("/contact")}
            onClick={() => setIsOpen(false)}
          >
            Contact
          </Link>
        </div>
      )}
    </nav>
  );
}