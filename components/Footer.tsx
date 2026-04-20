"use client";

import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#EDEDE8] text-gray-700">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-10">
        
        {/* Logo + Description */}
        <div>
          <Image
            src="/logo.png"
            alt="Lakrasa Logo"
            width={160}
            height={60}
            className="mb-4"
          />
          <p className="text-sm leading-relaxed">
            The authentic taste of Ceylon, curated for the modern world.
            Masterfully blended in the Highlands of Sri Lanka.
          </p>
        </div>

        {/* Collections */}
        <div>
          <h3 className="font-semibold mb-4 tracking-wide text-gray-800">
            COLLECTIONS
          </h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="#" className="transition-colors duration-200 hover:text-gray-900 hover:underline underline-offset-4">Heritage Series</Link></li>
            <li><Link href="#" className="transition-colors duration-200 hover:text-gray-900 hover:underline underline-offset-4">Estate Selection</Link></li>
            <li><Link href="#" className="transition-colors duration-200 hover:text-gray-900 hover:underline underline-offset-4">Signature Blends</Link></li>
            <li><Link href="#" className="transition-colors duration-200 hover:text-gray-900 hover:underline underline-offset-4">Accessories</Link></li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h3 className="font-semibold mb-4 tracking-wide text-gray-800">
            COMPANY
          </h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="#" className="transition-colors duration-200 hover:text-gray-900 hover:underline underline-offset-4">About Our Gardens</Link></li>
            <li><Link href="#" className="transition-colors duration-200 hover:text-gray-900 hover:underline underline-offset-4">Sustainability</Link></li>
            <li><Link href="#" className="transition-colors duration-200 hover:text-gray-900 hover:underline underline-offset-4">Wholesale</Link></li>
            <li><Link href="#" className="transition-colors duration-200 hover:text-gray-900 hover:underline underline-offset-4">Contact</Link></li>
          </ul>
        </div>

        {/* Policies */}
        <div>
          <h3 className="font-semibold mb-4 tracking-wide text-gray-800">
            POLICIES
          </h3>
          <ul className="space-y-2 text-sm mb-4">
            <li><Link href="#" className="transition-colors duration-200 hover:text-gray-900 hover:underline underline-offset-4">Privacy Policy</Link></li>
            <li><Link href="#" className="transition-colors duration-200 hover:text-gray-900 hover:underline underline-offset-4">Shipping & Returns</Link></li>
            <li><Link href="#" className="transition-colors duration-200 hover:text-gray-900 hover:underline underline-offset-4">Terms of Service</Link></li>
          </ul>

          {/* Social Icons */}
          <div className="flex space-x-4 text-gray-600">
            <a href="#" className="hover:text-gray-800 transition">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            </a>
            <a href="#" className="hover:text-gray-800 transition">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="#" className="hover:text-gray-800 transition">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="py-4 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col gap-2 sm:grid sm:grid-cols-3 sm:items-center">
          <div className="text-left sm:col-start-2 sm:text-center">
            © 2026 Lakrasa (PVT) Ltd.
          </div>
          <div className="text-left sm:col-start-3 sm:text-right">
            Design &amp; Powered by{" "}
            <a
              href="https://globalpearlventures.com/"
              target="_blank"
              rel="noreferrer"
              className="text-gray-700 hover:text-gray-900 underline underline-offset-4"
            >
              Global Pearl Ventures
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}