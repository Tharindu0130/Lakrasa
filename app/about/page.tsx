"use client";

import Image from "next/image";
import Footer from "@/components/Footer";
import BrandsMarquee from "@/components/BrandsMarquee";

export default function AboutUs() {
  return (
    <main className="bg-white">

      {/* ── HERO BANNER ── */}
      <section className="relative bg-green-900 py-24 px-6 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full border border-green-700/30" />
        <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full border border-green-700/20" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full border border-green-700/25" />

        <div className="relative max-w-4xl mx-auto text-center">
          <p className="text-xs tracking-[0.35em] text-green-400/80 uppercase font-medium mb-4">
            Lakrasa PVT Ltd.
          </p>
          <h1 className="text-4xl md:text-6xl font-light italic text-white leading-tight mb-6">
            Rooted in Tradition, <br />
            <span className="font-semibold not-italic">Driven by Quality.</span>
          </h1>
          <p className="text-green-200/70 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Over a decade of crafting the finest spices and condiments from the heart of Sri Lanka.
          </p>
        </div>
      </section>

      {/* ── WHO WE ARE ── */}
      <section className="bg-[#f5f2ed] py-24 px-6 md:px-16 lg:px-24">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">

          {/* Image side */}
          <div className="relative">
            <div className="relative w-full h-[340px] md:h-[460px] rounded-2xl overflow-hidden shadow-md">
              <Image
                src="/about.jpg"
                alt="Lakrasa spice production"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/10" />
            </div>

            {/* Founded badge */}
            <div className="absolute -bottom-6 -right-4 md:-bottom-8 md:-right-8 bg-green-800 text-white rounded-2xl px-6 py-5 shadow-xl z-10">
              <p className="text-3xl font-bold leading-none">2009</p>
              <p className="text-xs text-green-200/80 tracking-widest uppercase mt-1">Est. Year</p>
            </div>
          </div>

          {/* Text side */}
          <div>
            <p className="text-xs tracking-[0.3em] text-green-800/60 uppercase font-medium mb-3">
              Who We Are
            </p>
            <h2 className="text-3xl md:text-4xl font-light italic text-gray-900 mb-6 leading-snug">
              About <span className="font-semibold not-italic">Lakrasa PVT Ltd</span>
            </h2>

            <p className="text-gray-600 leading-relaxed mb-5">
              Lakrasa Pvt Ltd has started its operations in the year 2009 as a subsidiary for My Computer Pvt Ltd and now operates its own at No 528, Kandy Road, Dalugama, Kelaniya. We have our own grinding division functioning with automatic grinding machines and the packing division with automated packaging machines.
            </p>

            <p className="text-gray-600 leading-relaxed mb-8">
              Our products are untouchable from raw material status to the finishing point to ensure the quality and hygiene of the products. Our dedicated staff and production supervisors constantly maintain the quality and purity of the products at all levels to give consumers the best quality Lakrasa products.
            </p>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-6 border-t border-gray-200 pt-8">
              {[
                { value: "2009", label: "Founded" },
                { value: "100%", label: "Organic Practice" },
                { value: "5+", label: "Distribution Vehicles" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500 mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── DISTRIBUTION ── */}
      <section className="py-24 px-6 md:px-16 lg:px-24 bg-white">
        <div className="max-w-7xl mx-auto">

          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs tracking-[0.3em] text-green-800/60 uppercase font-medium mb-3">
              Our Reach
            </p>
            <h2 className="text-3xl md:text-4xl font-light italic text-gray-900 leading-snug">
              Serving Sri Lanka <br />
              <span className="font-semibold not-italic">From Farm to Table.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Card 1 */}
            <div className="group bg-[#f5f2ed] rounded-2xl p-8 hover:bg-green-50 hover:border-green-200 border border-transparent transition-all duration-300">
              <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center mb-6 group-hover:bg-green-200 transition-colors duration-300">
                <TruckIcon />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Retail & Wholesale Distribution</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                We operate retail and wholesale distribution across the Gampaha District using 5 dedicated vehicles and a sales force of 5 personnel, supervised by two managers handling corporate and key accounts.
              </p>
            </div>

            {/* Card 2 */}
            <div className="group bg-[#f5f2ed] rounded-2xl p-8 hover:bg-green-50 hover:border-green-200 border border-transparent transition-all duration-300">
              <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center mb-6 group-hover:bg-green-200 transition-colors duration-300">
                <StarIcon />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Exclusive Supplier — Parera & Sons</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                It is our pride to be the exclusive supplier of spices for the well-known food chain Parera & Sons Pvt Ltd island-wide — a testament to our uncompromising quality standards.
              </p>
            </div>

            {/* Card 3 */}
            <div className="group bg-[#f5f2ed] rounded-2xl p-8 hover:bg-green-50 hover:border-green-200 border border-transparent transition-all duration-300">
              <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center mb-6 group-hover:bg-green-200 transition-colors duration-300">
                <BuildingIcon />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Star Hotels & Hospitality</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Our corporate sector proudly extends services to all star-class hotels in Colombo and Negombo, bringing authentic Sri Lankan flavour to the finest dining establishments.
              </p>
            </div>

            {/* Card 4 */}
            <div className="group bg-[#f5f2ed] rounded-2xl p-8 hover:bg-green-50 hover:border-green-200 border border-transparent transition-all duration-300">
              <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center mb-6 group-hover:bg-green-200 transition-colors duration-300">
                <HeartIcon />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Private Sector Hospitals</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                We supply to all private sector hospitals in Colombo and suburbs, reflecting the hygiene and quality standards that make Lakrasa trusted even in healthcare environments.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── VISION & MISSION ── */}
      <section className="py-24 px-6 md:px-16 lg:px-24 bg-green-900 relative overflow-hidden">
        {/* Decorative rings */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full border border-green-700/20 translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full border border-green-700/20 -translate-x-1/3 translate-y-1/3" />

        <div className="relative max-w-7xl mx-auto">

          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.3em] text-green-400/80 uppercase font-medium mb-3">
              Our Purpose
            </p>
            <h2 className="text-3xl md:text-4xl font-light italic text-white leading-snug">
              Vision &amp; <span className="font-semibold not-italic">Mission</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">

            {/* Mission */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-10 hover:bg-white/10 transition-all duration-300">
              <div className="w-11 h-11 rounded-full bg-green-700/50 flex items-center justify-center mb-6">
                <TargetIcon />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Our Mission</h3>
              <p className="text-green-200/70 leading-relaxed text-sm">
                To be among the first 5 Sri Lanka's leading manufacturing and marketing companies of spices & condiment products — delivering excellence to every household and institution we serve.
              </p>
            </div>

            {/* Vision */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-10 hover:bg-white/10 transition-all duration-300">
              <div className="w-11 h-11 rounded-full bg-green-700/50 flex items-center justify-center mb-6">
                <EyeIcon />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Our Vision</h3>
              <p className="text-green-200/70 leading-relaxed text-sm">
                To supply the highest quality and most hygienically manufactured products using state-of-the-art technology — satisfying the needs and wants of every customer we serve.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── TRUSTED BRANDS (reuse from homepage) ── */}
      {/* <section className="py-20 px-6 md:px-16 bg-[#f5f2ed]">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs tracking-[0.3em] text-green-800/60 uppercase font-medium mb-3">
            Contact Us
          </p>
          <h2 className="text-3xl md:text-4xl font-light italic text-gray-900 mb-10 leading-snug">
            Get In <span className="font-semibold not-italic">Touch</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { label: "Address", value: "No 528, Kandy Road, Dalugama, Kelaniya" },
              { label: "Phone", value: "0112 916 795 / 071 884 0112" },
              { label: "Email", value: "info@lakrasa.lk" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-2xl p-7 border border-gray-100">
                <p className="text-xs tracking-widest uppercase text-green-800/50 font-medium mb-2">{label}</p>
                <p className="text-gray-800 text-sm font-medium leading-relaxed">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section> */}
      <section className="py-30 px-6 md:px-16 bg-[#f5f2ed]">
      <div className="max-w-7xl mx-auto max-h-xl text-center">
      <BrandsMarquee/>
      </div>
      </section>

      <Footer />
    </main>
  );
}

/* ── ICONS ── */

function TruckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="1" />
      <path d="M16 8h4l3 5v3h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#86efac" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#86efac" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}