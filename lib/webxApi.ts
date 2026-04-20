import type { NextRequest } from "next/server";

export type WebXApiConfig = {
  baseUrl: string;
  username: string;
  password: string;
  merchantId: string;
  appBaseUrl: string;
  testMode: boolean;
  jwtLoginUrl: string;
  initiateUrl: string;
};

/** Optional fields WebX “Pay from session 3DS” expects alongside id/email (see official Tokenize samples). */
export type WebXCustomerProfile = {
  firstName: string;
  lastName: string;
  contactNumber: string;
  addressLineOne: string;
  city: string;
  postalCode: string;
  country: string;
};

function stripTrailingSlashes(s: string): string {
  return s.replace(/\/+$/, "");
}

/**
 * Resolves auth + session3ds URLs. WEBX_JWT_LOGIN_URL and WEBX_INITIATE_URL must share the same
 * origin as the JWT issuer; mixing staging vs commtoken causes HTTP 401 "Unauthenticated".
 */
export function getWebXApiConfig(): WebXApiConfig {
  const username = process.env.WEBX_API_USERNAME?.trim() || "";
  const password = process.env.WEBX_API_PASSWORD?.trim() || "";
  const merchantId = process.env.WEBX_MERCHANT_ID?.trim() || "";
  const appBaseUrl = stripTrailingSlashes(process.env.WEBX_APP_BASE_URL?.trim() || "");
  const testMode = process.env.WEBX_TEST_MODE === "true" || process.env.WEBX_TEST_MODE === "1";

  let baseUrl = stripTrailingSlashes(process.env.WEBX_BASE_URL?.trim() || "");
  let jwtLoginUrl = stripTrailingSlashes(process.env.WEBX_JWT_LOGIN_URL?.trim() || "");
  let initiateUrl = stripTrailingSlashes(process.env.WEBX_INITIATE_URL?.trim() || "");

  if (baseUrl) {
    if (!jwtLoginUrl) jwtLoginUrl = `${baseUrl}/auth`;
    if (!initiateUrl) initiateUrl = `${baseUrl}/cards/pay/session3ds`;
  }
  if (!jwtLoginUrl && initiateUrl && /\/cards\/pay\/session3ds$/i.test(initiateUrl)) {
    jwtLoginUrl = `${initiateUrl.replace(/\/cards\/pay\/session3ds$/i, "")}/auth`;
  }
  if (!initiateUrl && jwtLoginUrl && /\/auth$/i.test(jwtLoginUrl)) {
    initiateUrl = `${jwtLoginUrl.replace(/\/auth$/i, "")}/cards/pay/session3ds`;
  }
  if (!baseUrl && jwtLoginUrl) {
    baseUrl = jwtLoginUrl.replace(/\/auth$/i, "");
  }

  return { baseUrl, username, password, merchantId, appBaseUrl, testMode, jwtLoginUrl, initiateUrl };
}

export function assertWebXApiConfigured(): void {
  const c = getWebXApiConfig();
  if (!c.username || !c.password || !c.merchantId) {
    throw new Error("[webxApi] Missing WEBX_API_USERNAME, WEBX_API_PASSWORD, or WEBX_MERCHANT_ID.");
  }
  if (!c.appBaseUrl) throw new Error("[webxApi] Missing WEBX_APP_BASE_URL.");
  if (!c.jwtLoginUrl) {
    throw new Error("[webxApi] Missing WebX auth URL. Set WEBX_BASE_URL (e.g. …/api) or WEBX_JWT_LOGIN_URL (…/api/auth).");
  }
  if (!c.initiateUrl) {
    throw new Error("[webxApi] Missing session3ds URL. Set WEBX_BASE_URL or WEBX_INITIATE_URL (…/api/cards/pay/session3ds).");
  }
  let jwtOrigin: string;
  let initOrigin: string;
  try {
    jwtOrigin = new URL(c.jwtLoginUrl).origin;
    initOrigin = new URL(c.initiateUrl).origin;
  } catch {
    throw new Error("[webxApi] Invalid WEBX_JWT_LOGIN_URL or WEBX_INITIATE_URL (must be absolute https URLs).");
  }
  if (jwtOrigin !== initOrigin) {
    throw new Error(
      `[webxApi] WEBX_JWT_LOGIN_URL and WEBX_INITIATE_URL must use the same host. Mixed environments return 401 from WebX. jwt origin=${jwtOrigin} session3ds origin=${initOrigin}`
    );
  }
}

export function webxLog(scope: string, message: string, meta?: Record<string, unknown>): void {
  if (!getWebXApiConfig().testMode) return;
  if (meta) console.info(`[webx:${scope}]`, message, meta);
  else console.info(`[webx:${scope}]`, message);
}

export type InitiateHostedPaymentInput = {
  orderId: string;
  orderNumber: string;
  amount: number;
  email: string;
  customerId: string;
  currency?: string;
  /** Billing/shipping-derived profile for session3ds (recommended by WebX samples). */
  customerProfile?: WebXCustomerProfile;
  extraFields?: Record<string, unknown>;
};

export type WebXInitiateResult =
  | { ok: true; payment_url: string | null; html3ds_html: string | null; raw: unknown }
  | { ok: false; error: string; httpStatus: number; raw?: unknown; requestUrl?: string; hint?: string };

function tokenFromJsonObject(obj: Record<string, unknown>): string | null {
  for (const key of ["token", "access_token", "jwt", "auth_token", "authToken", "id_token"]) {
    const val = obj[key];
    if (typeof val === "string" && val.length > 20) return val;
  }
  const nested = obj.data && typeof obj.data === "object" ? (obj.data as Record<string, unknown>) : null;
  if (!nested) return null;
  for (const key of ["token", "access_token", "jwt", "auth_token", "authToken"]) {
    const val = nested[key];
    if (typeof val === "string" && val.length > 20) return val;
  }
  return null;
}

/** Prefer JSON `token` (WebX PHP sample) before treating the body as a raw JWT string. */
function extractToken(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) {
    try {
      const parsed = tokenFromJsonObject(JSON.parse(trimmed) as Record<string, unknown>);
      if (parsed) return parsed;
    } catch {
      /* fall through */
    }
  }
  if (trimmed.split(".").length === 3 && trimmed.length > 40) return trimmed;
  try {
    return tokenFromJsonObject(JSON.parse(trimmed) as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function loginWebXJwt(cfg: WebXApiConfig = getWebXApiConfig()): Promise<string> {
  const response = await fetch(cfg.jwtLoginUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ username: cfg.username, password: cfg.password }),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`WebX auth failed with HTTP ${response.status}`);
  const token = extractToken(text);
  if (!token) throw new Error("WebX auth response missing token");
  return token;
}

function pickString(obj: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === "string" && val.trim()) return val.trim();
  }
  return "";
}

/** WebX returns ACS markup in `html3ds` when `error` is true and `type` is `3ds` (see official PHP samples). */
function pickHtml3dsHtml(obj: Record<string, unknown>, nested: Record<string, unknown> | null): string | null {
  for (const source of [obj, nested].filter(Boolean) as Record<string, unknown>[]) {
    for (const key of ["html3ds", "html3DS"]) {
      const v = source[key];
      if (typeof v === "string" && v.trim().length > 0) return v.trim();
    }
  }
  return null;
}

function pickPaymentRedirectUrl(obj: Record<string, unknown>, nested: Record<string, unknown> | null): string {
  const top = pickString(obj, [
    "payment_url",
    "paymentUrl",
    "paymentPageUrl",
    "payment_page_url",
    "redirect_url",
    "url",
    "html3ds_url",
    "html3dsUrl",
  ]);
  if (top) return top;
  if (!nested) return "";
  return pickString(nested, [
    "payment_url",
    "paymentPageUrl",
    "paymentUrl",
    "redirect_url",
    "url",
    "html3ds_url",
    "html3dsUrl",
  ]);
}

export async function initiateWebXHostedPayment(input: InitiateHostedPaymentInput): Promise<WebXInitiateResult> {
  const cfg = getWebXApiConfig();
  const verifyUrl = `${cfg.appBaseUrl}/payment`;

  let jwt = "";
  try {
    jwt = await loginWebXJwt(cfg);
  } catch (error) {
    const message = error instanceof Error ? error.message : "WebX authentication failed";
    return { ok: false, error: message, httpStatus: 401, requestUrl: cfg.jwtLoginUrl };
  }

  const customer: Record<string, unknown> = { email: input.email, id: input.customerId };
  if (input.customerProfile) {
    Object.assign(customer, input.customerProfile);
  }

  const body: Record<string, unknown> = {
    amount: input.amount,
    currency: input.currency?.trim() || "LKR",
    orderNumber: input.orderNumber,
    bankMID: cfg.merchantId,
    secure3dResponseURL: verifyUrl,
    customer,
  };
  if (input.extraFields) Object.assign(body, input.extraFields);

  const attemptInitiate = async (token: string, mode: "bearer" | "jwt" | "raw"): Promise<Response> => {
    const authValue =
      mode === "bearer" ? `Bearer ${token}` : mode === "jwt" ? `JWT ${token}` : token;
    return fetch(cfg.initiateUrl, {
      method: "POST",
      headers: {
        Authorization: authValue,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });
  };

  let response: Response;
  try {
    response = await attemptInitiate(jwt, "bearer");
    if (response.status === 401 || response.status === 403) {
      // Some WebX environments expect JWT/raw token prefix instead of Bearer.
      response = await attemptInitiate(jwt, "jwt");
    }
    if (response.status === 401 || response.status === 403) {
      response = await attemptInitiate(jwt, "raw");
    }
    if (response.status === 401 || response.status === 403) {
      // Refresh token once, then retry standard bearer.
      jwt = await loginWebXJwt(cfg);
      response = await attemptInitiate(jwt, "bearer");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network error calling WebX";
    return { ok: false, error: message, httpStatus: 503, requestUrl: cfg.initiateUrl };
  }

  const text = await response.text();
  let raw: unknown = {};
  try {
    raw = text ? JSON.parse(text) : {};
  } catch {
    raw = { _raw: text };
  }

  if (!response.ok) {
    const rawObj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null;
    const authHint =
      response.status === 401 || response.status === 403
        ? (() => {
            const base =
              rawObj?.message ??
              rawObj?.error_description ??
              rawObj?.explanation ??
              "WebX rejected this request. Verify WEBX_API_USERNAME/PASSWORD, WEBX_MERCHANT_ID, and that JWT login + session3ds URLs share the same host as your WebX environment.";
            const extra =
              String(base).toLowerCase() === "unauthenticated"
                ? " (Common cause: JWT from one base URL, e.g. staging, while calling session3ds on another, e.g. commtoken.)"
                : "";
            return String(base) + extra;
          })()
        : undefined;
    return {
      ok: false,
      error: `WebX returned HTTP ${response.status}`,
      httpStatus: response.status,
      raw,
      requestUrl: cfg.initiateUrl,
      hint: authHint,
    };
  }

  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const nested = obj.data && typeof obj.data === "object" ? (obj.data as Record<string, unknown>) : null;

  const errFlag = obj.error === true || String(obj.error).toLowerCase() === "true";
  const typeIs3ds = String(obj.type ?? nested?.type ?? "").toLowerCase() === "3ds";
  const html3dsChunk = pickHtml3dsHtml(obj, nested);
  const redirectUrl = pickPaymentRedirectUrl(obj, nested);

  // WebX uses error=true + type=3ds for the normal “continue to bank OTP” path (message text may contain a typo: “Rediret”).
  const continue3ds =
    errFlag && (typeIs3ds || Boolean(html3dsChunk)) && (Boolean(redirectUrl) || Boolean(html3dsChunk));
  if (continue3ds) {
    return {
      ok: true,
      payment_url: redirectUrl || null,
      html3ds_html: html3dsChunk,
      raw,
    };
  }

  if (errFlag) {
    return {
      ok: false,
      error: String(obj.explanation ?? obj.message ?? "WebX returned an error"),
      httpStatus: 422,
      raw,
      requestUrl: cfg.initiateUrl,
    };
  }

  return {
    ok: true,
    payment_url: redirectUrl || null,
    html3ds_html: html3dsChunk,
    raw,
  };
}

export type Decoded3dsResult = {
  success: boolean;
  orderNumber: string | null;
  receipt: string | null;
  statusCode: string | null;
  raw: Record<string, unknown>;
};

export function decodeWebX3dsResult(payload: Record<string, string>): Decoded3dsResult {
  const result3ds = payload.result3ds || payload.result_3ds || payload.result || "";
  let decoded: Record<string, unknown> = {};
  if (result3ds) {
    try {
      const base64 = result3ds.replace(/-/g, "+").replace(/_/g, "/");
      const padded = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`;
      decoded = JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as Record<string, unknown>;
    } catch {
      decoded = {};
    }
  }

  const merged = { ...decoded, ...payload };
  const successRaw = merged.Success ?? merged.success ?? merged.isSuccess ?? merged.paid;
  const success = successRaw === true || String(successRaw).toLowerCase() === "true" || String(successRaw) === "1";
  const orderNumber = String(
    merged.MerchantProvidedOrderNumber ?? merged.orderNumber ?? merged.order_number ?? merged.order_id ?? ""
  ).trim();
  const receipt = String(merged.Receipt ?? merged.receipt ?? merged.transaction_id ?? "").trim();
  const statusCode = String(merged.statusCode ?? merged.status_code ?? merged.StatusCode ?? "").trim();

  return { success, orderNumber: orderNumber || null, receipt: receipt || null, statusCode: statusCode || null, raw: merged };
}

export async function initiateWebXSession3dsPayment(
  input: InitiateHostedPaymentInput
): Promise<WebXInitiateResult> {
  return initiateWebXHostedPayment(input);
}

export function normalizeKeys(record: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(record)) {
    if (value === undefined || value === null) continue;
    out[key.toLowerCase()] = typeof value === "string" ? value : String(value);
  }
  return out;
}

export async function readGatewayBodyAsRecord(request: NextRequest): Promise<Record<string, string>> {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const json = (await request.json()) as Record<string, unknown>;
    return normalizeKeys(json);
  }
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await request.text();
    const params = new URLSearchParams(text);
    const obj: Record<string, unknown> = {};
    params.forEach((value, key) => {
      obj[key] = value;
    });
    return normalizeKeys(obj);
  }
  const form = await request.formData();
  const obj: Record<string, unknown> = {};
  form.forEach((value, key) => {
    obj[key] = typeof value === "string" ? value : value.name;
  });
  return normalizeKeys(obj);
}

function first(record: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key.toLowerCase()];
    if (value !== undefined && value !== "") return value;
  }
  return "";
}

export function extractOrderId(record: Record<string, string>): string {
  return first(record, ["order_id", "orderid", "order_uuid", "id"]);
}

export function extractAmountString(record: Record<string, string>): string {
  return first(record, ["amount", "pay_amount", "total", "paid_amount", "transaction_amount"]);
}

export function extractPaymentReference(record: Record<string, string>): string {
  return first(record, ["payment_reference", "reference", "ref", "paymentref", "merchant_ref"]);
}

export function parseGatewaySuccess(record: Record<string, string>): boolean {
  const status = first(record, ["status", "payment_status", "result", "gateway_status", "payment_status_message"]).toLowerCase();
  if (["failed", "fail", "cancelled", "canceled", "declined", "0", "false"].includes(status)) return false;
  if (["success", "paid", "completed", "1", "ok", "true"].includes(status)) return true;
  return Boolean(first(record, ["transaction_id", "webx_transaction_id", "txn_id", "pay_id"]));
}
