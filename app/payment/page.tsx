"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { ArrowLeft, Loader2, ShieldCheck, CreditCard } from "lucide-react";
import { readPendingPayment, type PendingPaymentData } from "@/lib/pending-payment";
import { writeWebxCheckoutSession } from "@/lib/webx-client-session";

type GenerateSessionFn = (
  onSuccess: (sessionId: string) => void,
  onError: (error: { code?: string; message?: string; fields?: Record<string, string> }) => void
) => void;

type InitiateResponse = {
  success?: boolean;
  order_id?: string;
  orderNumber?: string;
  payment_url?: string | null;
  html3ds_url?: string | null;
  data?: unknown;
  error?: string;
  hint?: string;
  requestUrl?: string;
};

declare global {
  interface Window {
    WebxpayTokenizeInit?: (options: {
      card: {
        number: string;
        securityCode: string;
        expiryMonth: string;
        expiryYear: string;
        nameOnCard: string;
      };
      ready: (generateSession: GenerateSessionFn) => void;
    }) => void;
  }
}

const MPGS_SCRIPT_URL =
  "https://seylan.gateway.mastercard.com/form/version/82/merchant/MPGS00000251/session.js";
const LOCAL_WRAPPER_URL = "/webxpay.hostedsession.js?v=3";

type FieldErrors = {
  cardNumber?: string;
  expiry?: string;
  cvv?: string;
};

function mapGatewayError(error?: { code?: string; message?: string }) {
  const code = (error?.code || "").toLowerCase();
  const fallback = error?.message || "Payment could not be initialized.";
  switch (code) {
    case "invalid_card":
      return "Please review your card details and try again.";
    case "duplicate_card":
      return "This card was already used in a pending request. Refresh and retry.";
    case "authentication_failed":
      return "Secure payment authentication failed. Please retry.";
    case "request_timeout":
      return "Payment request timed out. Please retry.";
    case "system_error":
      return "Payment gateway is temporarily unavailable. Please retry shortly.";
    default:
      return fallback;
  }
}

function base64UrlDecode(str: string) {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  return atob(base64);
}

function extractHtml3dsUrl(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  const keys = ["html3ds_url", "html3dsUrl", "paymentPageUrl", "payment_url", "redirect_url", "url"];
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  if (obj.data && typeof obj.data === "object") {
    return extractHtml3dsUrl(obj.data);
  }
  return null;
}

export default function PaymentPage() {
  const router = useRouter();
  const [pending, setPending] = useState<PendingPaymentData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const generateSessionRef = useRef<any>(null);
  const isInitialized = useRef(false);

  const customerEmail = useMemo(
    () => (pending ? (pending.userEmail || pending.guestEmail || "").trim() : ""),
    [pending]
  );

  const itemsPayload = useMemo(() => {
    if (!pending) return [];
    return [
      ...pending.cart.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      ...pending.addOns.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    ];
  }, [pending]);

  const process3DSResult = useCallback(async () => {
    const params = new URLSearchParams(window.location.search);
    const result3dsParam = params.get("result3ds");
    if (!result3dsParam) return;

    try {
      const decoded = JSON.parse(base64UrlDecode(result3dsParam)) as Record<string, unknown>;
      const verifyRes = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          result3ds: result3dsParam,
          ...decoded,
        }),
      });
      const verifyJson = (await verifyRes.json().catch(() => ({}))) as { ok?: boolean; status?: string; error?: string };

      if (!verifyRes.ok || !verifyJson.ok || verifyJson.status === "failed" || decoded.error) {
        const msg = verifyJson.error || "Payment could not be completed.";
        await Swal.fire({
          icon: "error",
          title: "Payment failed",
          text: msg,
          confirmButtonColor: "#15803d",
        });
      } else {
        await Swal.fire({
          icon: "success",
          title: "Payment successful",
          text: "Verifying your order status...",
          confirmButtonColor: "#15803d",
        });
        router.replace("/payment/success");
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch {
      await Swal.fire({
        icon: "error",
        title: "Invalid response",
        text: "Could not process 3DS response.",
        confirmButtonColor: "#15803d",
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [router]);

  useEffect(() => {
    setPending(readPendingPayment());
  }, []);

  useEffect(() => {
    void process3DSResult();
  }, [process3DSResult]);

  // MPGS Initialization - matching your working component exactly
  useEffect(() => {
    if (isInitialized.current) return;

    const loadScript = (src: string) =>
      new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.body.appendChild(script);
      });

    const init = async () => {
      try {
        await loadScript(MPGS_SCRIPT_URL);
        await loadScript(LOCAL_WRAPPER_URL);

        if (!window.WebxpayTokenizeInit) {
          throw new Error("WebxpayTokenizeInit not found");
        }

        window.WebxpayTokenizeInit({
          card: {
            number: "#card-number",
            securityCode: "#security-code",
            expiryMonth: "#expiry-month",
            expiryYear: "#expiry-year",
            nameOnCard: "#cardholder-name",
          },
          ready: (GenerateSession: any) => {
            generateSessionRef.current = GenerateSession;
            isInitialized.current = true;
          },
        });
      } catch (error) {
        console.error("Init error:", error);
        setInlineError("Failed to load payment gateway. Please refresh the page.");
      }
    };

    init();
  }, []);

  const handleErrors = (error: any) => {
    const newErrors: FieldErrors = {};

    if (error.type === "fields_in_error") {
      if (error.details?.cardNumber) newErrors.cardNumber = "Invalid card number";
      if (error.details?.expiryMonth || error.details?.expiryYear)
        newErrors.expiry = "Invalid expiry";
      if (error.details?.securityCode) newErrors.cvv = "Invalid CVV";
    } else {
      setInlineError(error.details || "System error");
    }

    setFieldErrors(newErrors);
  };

  const submitPayment = async () => {
    if (!pending) return;
    if (!generateSessionRef.current) {
      setInlineError("Payment system not ready. Please wait.");
      return;
    }

    setIsSaving(true);
    setInlineError(null);
    setFieldErrors({});

    generateSessionRef.current(
      async (sessionId: string) => {
        try {
          if (!sessionId) {
            throw new Error("No secure card session generated.");
          }
          
          const res = await fetch("/api/payment/initiate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: pending.total,
              email: customerEmail,
              items: itemsPayload,
              user_id: pending.userId,
              guest_id: pending.userId ? null : `guest:${customerEmail}`,
              checkout_snapshot: pending,
              webx_extra: {
                session: sessionId,
              },
            }),
          });

          const json = (await res.json().catch(() => ({}))) as InitiateResponse;
          
          if (!res.ok || !json.success || !json.order_id) {
            const base = json.error || "Payment initiation failed.";
            const suffix = json.hint ? ` ${json.hint}` : json.requestUrl ? ` URL: ${json.requestUrl}` : "";
            const message = `${base}${suffix}`.trim();
            throw new Error(message);
          }

          const html3dsUrl = json.html3ds_url || json.payment_url || extractHtml3dsUrl(json.data);
          
          if (!html3dsUrl) {
            throw new Error("WebX did not return a 3DS redirect URL.");
          }

          writeWebxCheckoutSession({
            webx_order_id: json.order_id,
            html3ds_url: html3dsUrl,
            payment_url: json.payment_url || undefined,
            order_number: json.orderNumber,
          });

          // Redirect to 3DS URL
          window.location.href = html3dsUrl;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Payment request failed.";
          setInlineError(message);
          setIsSaving(false);
        }
      },
      (error: any) => {
        setIsSaving(false);
        handleErrors(error);
      }
    );
  };

  if (!pending) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-16">
        <div className="mx-auto max-w-lg rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
          <h1 className="font-serif text-2xl text-gray-900">No payment session</h1>
          <p className="mt-2 text-sm text-gray-500">Return to checkout to start WebX Pay.</p>
          <Link
            href="/checkout"
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-green-700 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-green-800"
          >
            Back to checkout
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 md:py-14">
      <div className="mx-auto max-w-xl">
        <Link
          href="/checkout"
          className="mb-6 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500 transition hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to checkout
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-full bg-green-50 p-2">
              <CreditCard className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <h1 className="text-2xl font-serif text-gray-900">Secure Card Payment</h1>
              <p className="text-sm text-gray-500">WebX MPGS hosted session with 3DS verification.</p>
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Amount</p>
            <p className="mt-1 text-xl font-semibold text-green-800">Rs. {pending.total.toLocaleString()}</p>
            <p className="mt-2 text-xs text-gray-500">{customerEmail}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Card Holder Name
              </label>
              <input
                id="cardholder-name"
                readOnly
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Card Number
              </label>
              <input
                id="card-number"
                readOnly
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                placeholder="1234 5678 9012 3456"
              />
              {fieldErrors.cardNumber && (
                <span className="text-red-500 text-xs mt-1 block">{fieldErrors.cardNumber}</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Expiry Date
                </label>
                <div className="flex gap-2">
                  <input
                    id="expiry-month"
                    readOnly
                    placeholder="MM"
                    className="w-1/2 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-center"
                  />
                  <input
                    id="expiry-year"
                    readOnly
                    placeholder="YY"
                    className="w-1/2 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-center"
                  />
                </div>
                {fieldErrors.expiry && (
                  <span className="text-red-500 text-xs mt-1 block">{fieldErrors.expiry}</span>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  CVV
                </label>
                <input
                  id="security-code"
                  readOnly
                  placeholder="123"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-center"
                />
                {fieldErrors.cvv && (
                  <span className="text-red-500 text-xs mt-1 block">{fieldErrors.cvv}</span>
                )}
              </div>
            </div>
          </div>

          {inlineError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-4">
              <p className="text-red-600 text-xs text-center">{inlineError}</p>
            </div>
          )}

          <button
            onClick={submitPayment}
            disabled={isSaving}
            className="w-full bg-gradient-to-r from-green-700 to-green-600 hover:from-green-800 hover:to-green-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-6 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              "Pay Now"
            )}
          </button>

          <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            Secured by WebX Pay
          </div>
        </div>
      </div>
    </div>
  );
}