"use client";

import { useState } from "react";
import BrandsMarquee from "@/components/BrandsMarquee";

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire up to your email/API endpoint
    setSubmitted(true);
  };

  return (
    <main className="bg-white min-h-screen">

      {/* ── HERO BANNER ── */}
      <section className="relative bg-green-900 py-24 px-6 overflow-hidden">
        {/* Decorative leaf rings */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full border border-green-700/30" />
        <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full border border-green-700/20" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full border border-green-700/25" />

        <div className="relative max-w-4xl mx-auto text-center">
          <p className="text-xs tracking-[0.35em] text-green-400/80 uppercase font-medium mb-4">
            Get In Touch
          </p>
          <h1 className="text-4xl md:text-6xl font-light italic text-white leading-tight mb-6">
            We&apos;d Love to <br />
            <span className="font-semibold not-italic">Hear From You.</span>
          </h1>
          <p className="text-green-200/70 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Whether you&apos;re a retailer, a culinary enthusiast, or simply curious — our team is ready to help.
          </p>
        </div>
      </section>

      {/* ── CONTACT CARDS ── */}
      <section className="bg-[#f5f2ed] py-16 px-6 md:px-16">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">

          <ContactCard
            icon={<PhoneIcon />}
            title="Call Us"
            line1="+94 11 291 3456"
            line2="Mon – Fri, 8am – 5pm"
          />
          <ContactCard
            icon={<MailIcon />}
            title="Email Us"
            line1="hello@lakrasa.lk"
            line2="We reply within 24 hours"
          />
          <ContactCard
            icon={<PinIcon />}
            title="Visit Us"
            line1="No 528, Kandy Road"
            line2="Dalugama, Kelaniya"
          />

        </div>
      </section>

      {/* ── FORM + MAP ── */}
      <section className="py-20 px-6 md:px-16 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-start">

          {/* FORM */}
          <div>
            <p className="text-xs tracking-[0.3em] text-green-800/60 uppercase font-medium mb-3">
              Send a Message
            </p>
            <h2 className="text-3xl md:text-4xl font-light italic text-gray-900 mb-8 leading-snug">
              Let&apos;s Start a <br />
              <span className="font-semibold not-italic">Conversation.</span>
            </h2>

            {submitted ? (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-10 text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckIcon />
                </div>
                <h3 className="text-lg font-semibold text-green-900 mb-2">Message Sent!</h3>
                <p className="text-sm text-green-700/70">
                  Thank you for reaching out. We&apos;ll get back to you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Full Name" required>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Your full name"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Email Address" required>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="you@example.com"
                      className={inputClass}
                    />
                  </Field>
                </div>

                <Field label="Subject">
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="" disabled>Select a topic</option>
                    <option value="wholesale">Wholesale Enquiry</option>
                    <option value="retail">Retail / Gifting</option>
                    <option value="export">Export & Distribution</option>
                    <option value="other">Other</option>
                  </select>
                </Field>

                <Field label="Message" required>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    placeholder="Tell us how we can help…"
                    className={`${inputClass} resize-none`}
                  />
                </Field>

                <button
                  type="submit"
                  className="w-full py-4 bg-green-800 text-white rounded-xl font-semibold tracking-widest uppercase text-sm hover:bg-green-700 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-green-900/20"
                >
                  Send Message →
                </button>
              </form>
            )}
          </div>

          {/* MAP / ADDRESS PANEL */}
          <div className="space-y-6">
            {/* Embedded Google Map */}
            <div className="w-full h-72 md:h-80 rounded-2xl overflow-hidden border border-gray-100">
              <iframe
                title="Lakrasa Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.5!2d79.9!3d6.95!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwNTcnMDAuMCJOIDc5wrA1NCcwMC4wIkU!5e0!3m2!1sen!2slk!4v1"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            {/* Business hours */}
            <div className="rounded-2xl border border-gray-100 bg-[#f5f2ed] p-7">
              <p className="text-xs tracking-[0.3em] text-green-800/60 uppercase font-medium mb-4">
                Business Hours
              </p>
              <ul className="space-y-3 text-sm text-gray-600">
                {[
                  { day: "Monday – Friday", hours: "8:00 AM – 5:00 PM" },
                  { day: "Saturday", hours: "8:00 AM – 1:00 PM" },
                  { day: "Sunday", hours: "Closed" },
                ].map(({ day, hours }) => (
                  <li key={day} className="flex justify-between items-center border-b border-gray-200/60 pb-3 last:border-0 last:pb-0">
                    <span className="text-gray-800 font-medium">{day}</span>
                    <span className={hours === "Closed" ? "text-red-400 font-medium" : "text-green-700 font-medium"}>
                      {hours}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      </section>
      <BrandsMarquee />

    </main>
  );
}

/* ── SUB-COMPONENTS ── */

function ContactCard({
  icon,
  title,
  line1,
  line2,
}: {
  icon: React.ReactNode;
  title: string;
  line1: string;
  line2: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-7 border border-gray-100 hover:border-green-200 hover:shadow-lg hover:shadow-green-900/5 transition-all duration-300 group">
      <div className="w-11 h-11 rounded-full bg-green-50 flex items-center justify-center mb-5 group-hover:bg-green-100 transition-colors duration-300">
        {icon}
      </div>
      <p className="text-xs tracking-widest uppercase text-green-800/50 font-medium mb-2">{title}</p>
      <p className="text-gray-900 font-semibold text-sm mb-1">{line1}</p>
      <p className="text-gray-400 text-xs">{line2}</p>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
        {required && <span className="text-green-600 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-all duration-200";

/* ── ICONS (inline SVG, no external deps) ── */

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.61 19a19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 3.09 4.18 2 2 0 0 1 5.06 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L9.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}