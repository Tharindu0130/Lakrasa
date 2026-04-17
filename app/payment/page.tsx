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
  "https://cbcmpgs.gateway.mastercard.com/form/version/82/merchant/MPGS00000251/session.js";
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

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === "true") return resolve();
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Failed loading ${src}`)), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed loading ${src}`));
    document.head.appendChild(script);
  });
}

export default function PaymentPage() {
  const router = useRouter();
  const [pending, setPending] = useState<PendingPaymentData | null>(null);
  const [scriptsReady, setScriptsReady] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const generateSessionRef = useRef<GenerateSessionFn | null>(null);
  const initOnceRef = useRef(false);
  const initTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    if (initOnceRef.current) return;
    initOnceRef.current = true;

    let cancelled = false;
    (async () => {
      try {
        setInitializing(true);
        await loadScript(MPGS_SCRIPT_URL);
        await loadScript(LOCAL_WRAPPER_URL);
        if (cancelled) return;
        if (!window.WebxpayTokenizeInit) {
          throw new Error("Hosted session wrapper failed to load.");
        }
        window.WebxpayTokenizeInit({
          card: {
            number: "#card-number",
            securityCode: "#security-code",
            expiryMonth: "#expiry-month",
            expiryYear: "#expiry-year",
            nameOnCard: "#cardholder-name",
          },
          ready: (generateSession) => {
            if (initTimerRef.current) {
              clearTimeout(initTimerRef.current);
              initTimerRef.current = null;
            }
            generateSessionRef.current = generateSession;
            setScriptsReady(true);
            setInitializing(false);
          },
        });
        initTimerRef.current = setTimeout(() => {
          if (generateSessionRef.current) return;
          setInitializing(false);
          setInlineError(
            "Secure card fields could not initialize. Please refresh and check that MPGS session.js is reachable."
          );
        }, 12000);
      } catch (error) {
        setInitializing(false);
        setInlineError(error instanceof Error ? error.message : "Could not initialize secure payment fields.");
      }
    })();

    return () => {
      if (initTimerRef.current) {
        clearTimeout(initTimerRef.current);
        initTimerRef.current = null;
      }
      cancelled = true;
    };
  }, []);

  const submitPayment = async () => {
    if (!pending) return;
    if (!generateSessionRef.current) {
      setInlineError("Payment fields are not ready yet.");
      return;
    }

    setProcessing(true);
    setInlineError(null);
    setFieldErrors({});

    generateSessionRef.current(
      async (sessionId) => {
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

          window.location.assign(html3dsUrl);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Payment request failed.";
          setInlineError(message);
          setProcessing(false);
        }
      },
      (error) => {
        const fields = error.fields || {};
        setFieldErrors({
          cardNumber: fields.number || fields.cardNumber,
          expiry: fields.expiryMonth || fields.expiryYear || fields.expiry,
          cvv: fields.securityCode || fields.cvv,
        });
        setInlineError(mapGatewayError(error));
        setProcessing(false);
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
              <label htmlFor="cardholder-name" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                Cardholder Name
              </label>
              <input
                id="cardholder-name"
                readOnly
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none"
                placeholder="Name on card"
              />
            </div>

            <div>
              <label htmlFor="card-number" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                Card Number
              </label>
              <input
                id="card-number"
                readOnly
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none"
                placeholder="Card number"
              />
              {fieldErrors.cardNumber ? <p className="mt-1 text-xs text-red-600">{fieldErrors.cardNumber}</p> : null}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="expiry-month" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Month
                </label>
                <input
                  id="expiry-month"
                  readOnly
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none"
                  placeholder="MM"
                />
              </div>
              <div>
                <label htmlFor="expiry-year" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Year
                </label>
                <input
                  id="expiry-year"
                  readOnly
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none"
                  placeholder="YY"
                />
              </div>
              <div>
                <label htmlFor="security-code" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                  CVV
                </label>
                <input
                  id="security-code"
                  readOnly
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none"
                  placeholder="CVV"
                />
              </div>
            </div>
            {fieldErrors.expiry ? <p className="text-xs text-red-600">{fieldErrors.expiry}</p> : null}
            {fieldErrors.cvv ? <p className="text-xs text-red-600">{fieldErrors.cvv}</p> : null}
          </div>

          {inlineError ? (
            <div className="mt-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {inlineError}
            </div>
          ) : null}

          <button
            type="button"
            onClick={submitPayment}
            disabled={processing || initializing || !scriptsReady}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-700 px-6 py-3.5 text-sm font-bold uppercase tracking-[0.15em] text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {(processing || initializing) && <Loader2 className="h-4 w-4 animate-spin" />}
            {processing ? "Processing..." : initializing ? "Initializing..." : "Pay Now"}
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
