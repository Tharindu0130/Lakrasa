"use client";

import { supabase } from "@/lib/supabaseClient";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type BadgeTone = "green" | "lime" | "gray" | "dark" | "red" | "blue" | "yellow";

type FilterKey =
  | "stage_received"
  | "stage_packaging"
  | "stage_ready"
  | "status_priority"
  | "status_express";

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: BadgeTone;
}) {
  const cls =
    tone === "green"
      ? "bg-[#bdef86]/70 text-[#002521]"
      : tone === "lime"
        ? "bg-[#e3eb36]/40 text-[#1c1d00]"
        : tone === "dark"
          ? "bg-[#033c37]/90 text-white"
          : tone === "blue"
            ? "bg-[#2b6eea]/15 text-[#18408b]"
            : tone === "yellow"
              ? "bg-[#f7c948]/25 text-[#5a3d00]"
              : tone === "red"
                ? "bg-[#ef4444]/15 text-[#7a1f1f]"
                : "bg-[#e6e9e3] text-[#404847]";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold",
        cls,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function Money({ value }: { value: number }) {
  return (
    <span className="tabular-nums">Rs {value.toLocaleString("en-LK", { maximumFractionDigits: 2 })}</span>
  );
}

function KebabButton() {
  return (
    <button
      type="button"
      className="grid h-9 w-9 place-items-center rounded-2xl bg-white/60 hover:bg-white/80"
      aria-label="More options"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5 opacity-70"
        aria-hidden="true"
      >
        <path
          d="M12 6.5a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5ZM12 13.25a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5ZM12 20a1.25 1.25 0 1 0 0-2.5A1.25 1.25 0 0 0 12 20Z"
          fill="currentColor"
        />
      </svg>
    </button>
  );
}

type OrderStage = "Received" | "Packaging" | "Ready for delivery" | "Delivered";

type Order = {
  /** Supabase row id (uuid) */
  id: string;
  displayId: string;
  customer: string;
  email: string;
  total: number;
  stage: OrderStage;
  createdDate: string;
  closedDate?: string;
  status?: { label: string; tone: BadgeTone };
  tag?: { label: string; tone: BadgeTone };
  progress?: number;
};

function formatOrderDisplayId(uuid: string) {
  return `#ORD-${uuid.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

function formatOrderDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function normalizePipelineStage(
  pipelineStage: string | null | undefined,
  status: string | null | undefined
): OrderStage {
  const p = (pipelineStage ?? "").trim();
  const allowed: OrderStage[] = [
    "Received",
    "Packaging",
    "Ready for delivery",
    "Delivered",
  ];
  if (allowed.includes(p as OrderStage)) return p as OrderStage;

  const s = (status ?? "").trim().toLowerCase();
  if (s === "packaging" || s === "processing") return "Packaging";
  if (s === "ready" || s === "shipped" || s === "ready_for_delivery")
    return "Ready for delivery";
  if (s === "delivered" || s === "completed") return "Delivered";
  if (s === "pending" || s === "received" || s === "") return "Received";
  return "Received";
}

function statusToOrderBadge(status: string | null | undefined): Order["status"] {
  const raw = status ?? "";
  const s = raw.trim().toLowerCase();
  if (!s) return { label: "PENDING", tone: "gray" };
  if (s.includes("express")) return { label: "EXPRESS", tone: "yellow" };
  if (s.includes("priority")) return { label: "PRIORITY", tone: "lime" };
  if (s.includes("standard")) return { label: "STANDARD", tone: "gray" };
  return {
    label: raw.replace(/_/g, " ").toUpperCase().slice(0, 24),
    tone: "gray",
  };
}

type DbOrderRow = {
  id: string;
  email: string;
  total_amount: number | string;
  status: string | null;
  created_at: string | null;
  pipeline_stage: string | null;
};

function mapDbOrder(row: DbOrderRow): Order {
  const stage = normalizePipelineStage(row.pipeline_stage, row.status);
  const email = row.email?.trim() || "";
  return {
    id: row.id,
    displayId: formatOrderDisplayId(row.id),
    customer: email || "Guest",
    email,
    total: Number(row.total_amount),
    stage,
    createdDate: formatOrderDate(row.created_at),
    status: statusToOrderBadge(row.status),
    tag: undefined,
  };
}

function stageTone(stage: OrderStage): BadgeTone {
  switch (stage) {
    case "Received":
      return "yellow";
    case "Packaging":
      return "blue";
    case "Ready for delivery":
      return "lime";
    case "Delivered":
      return "green";
  }
}

function parseKanbanDropStage(el: Element | null): OrderStage | null {
  let n: Element | null = el;
  while (n) {
    const v = n.getAttribute("data-kanban-drop");
    if (
      v === "Received" ||
      v === "Packaging" ||
      v === "Ready for delivery" ||
      v === "Delivered"
    ) {
      return v;
    }
    n = n.parentElement;
  }
  return null;
}

function PipelineCard({
  item,
  isDragging,
  onGrabPointer,
  onOpenDetails,
}: {
  item: Order;
  isDragging: boolean;
  onGrabPointer: () => void;
  onOpenDetails: () => void;
}) {
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const startedDragRef = useRef(false);

  return (
    <div
      className={[
        "rounded-3xl bg-white/70 px-5 py-4 shadow-[0_30px_70px_rgba(0,37,33,0.08)]",
        "cursor-grab touch-none select-none active:cursor-grabbing",
        isDragging ? "opacity-50 ring-2 ring-[#033c37]/20" : "",
      ].join(" ")}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        if ((e.target as HTMLElement).closest("button")) return;
        startRef.current = { x: e.clientX, y: e.clientY };
        startedDragRef.current = false;
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!startRef.current) return;
        if (startedDragRef.current) return;
        const dx = Math.abs(e.clientX - startRef.current.x);
        const dy = Math.abs(e.clientY - startRef.current.y);
        if (dx + dy < 8) return;
        startedDragRef.current = true;
        onGrabPointer();
      }}
      onPointerUp={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
        const didStartDrag = startedDragRef.current;
        startRef.current = null;
        startedDragRef.current = false;
        if (didStartDrag) return;
        if (isDragging) return;
        onOpenDetails();
      }}
      onPointerCancel={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
        startRef.current = null;
        startedDragRef.current = false;
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[10px] tracking-[0.2em] uppercase opacity-60">
            {item.displayId}
          </div>
          <div className="mt-2 truncate text-sm font-semibold">{item.customer}</div>
          <div className="mt-1 text-xs opacity-65">Created: {item.createdDate}</div>
        </div>
        <KebabButton />
      </div>

      {typeof item.progress === "number" ? (
        <div className="mt-4">
          <div className="h-1.5 w-full rounded-full bg-black/10">
            <div
              className="h-1.5 rounded-full bg-[#bdef86]"
              style={{ width: `${Math.max(0, Math.min(100, item.progress))}%` }}
              aria-hidden="true"
            />
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={stageTone(item.stage)}>{item.stage.toUpperCase()}</Badge>
          {item.status ? (
            <Badge tone={item.status.tone}>{item.status.label}</Badge>
          ) : null}
          {item.tag ? <Badge tone={item.tag.tone}>{item.tag.label}</Badge> : null}
        </div>
        <div className="text-sm font-semibold">
          <Money value={item.total} />
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({
  title,
  stage,
  count,
  isDropHighlight,
  children,
}: {
  title: string;
  stage: OrderStage;
  count: number;
  isDropHighlight: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className="min-w-[280px] max-w-[340px] flex-1"
      data-kanban-drop={stage}
    >
      <div className="flex items-center justify-between gap-4 px-2">
        <div className="text-[10px] tracking-[0.2em] uppercase opacity-60">{title}</div>
        <span className="grid h-6 min-w-[28px] place-items-center rounded-full bg-white/60 px-2 text-[11px] font-semibold opacity-70">
          {count}
        </span>
      </div>
      <div
        className={[
          "mt-4 min-h-[160px] space-y-4 rounded-2xl p-2 transition-[box-shadow,background-color]",
          isDropHighlight
            ? "bg-white/50 ring-2 ring-[#033c37]/30 ring-offset-2 ring-offset-[#f7faf4]"
            : "",
        ].join(" ")}
      >
        {children}
      </div>
    </section>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M10.5 18.25a7.75 7.75 0 1 1 0-15.5 7.75 7.75 0 0 1 0 15.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 16.5 21 21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 opacity-80" aria-hidden="true">
      <path
        d="M12 21a2.25 2.25 0 0 0 2.2-1.5H9.8A2.25 2.25 0 0 0 12 21Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.25 17.5H5.75c1.25-1.25 1.25-3.25 1.25-5.25a5 5 0 0 1 10 0c0 2 0 4 1.25 5.25Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FiltersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 opacity-70" aria-hidden="true">
      <path
        d="M4.5 6.75h15M7.5 12h9M10.5 17.25h3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function OrdersTable({ rows }: { rows: Order[] }) {
  return (
    <div className="rounded-3xl bg-white/70 p-4 shadow-[0_30px_70px_rgba(0,37,33,0.06)]">
      <div className="overflow-x-auto">
        <table className="min-w-[860px] w-full border-separate border-spacing-0">
          <thead>
            <tr className="text-left text-[11px] tracking-[0.18em] uppercase opacity-60">
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-black/20 bg-white"
                  aria-label="Select all"
                />
              </th>
              <th className="px-3 py-3">Order ID</th>
              <th className="px-3 py-3">Customer</th>
              <th className="px-3 py-3">Total</th>
              <th className="px-3 py-3">Stage</th>
              <th className="px-3 py-3">Created date</th>
              <th className="px-3 py-3">Closed date</th>
              <th className="w-12 px-3 py-3 text-right"> </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="text-sm">
                <td className="border-t border-black/10 px-3 py-4 align-middle">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-black/20 bg-white"
                    aria-label={`Select ${r.displayId}`}
                  />
                </td>
                <td className="border-t border-black/10 px-3 py-4 font-semibold">
                  {r.displayId}
                </td>
                <td className="border-t border-black/10 px-3 py-4 opacity-90">
                  {r.customer}
                </td>
                <td className="border-t border-black/10 px-3 py-4 font-semibold">
                  <Money value={r.total} />
                </td>
                <td className="border-t border-black/10 px-3 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={stageTone(r.stage)}>{r.stage}</Badge>
                    {r.status ? <Badge tone={r.status.tone}>{r.status.label}</Badge> : null}
                  </div>
                </td>
                <td className="border-t border-black/10 px-3 py-4 opacity-80">
                  {r.createdDate}
                </td>
                <td className="border-t border-black/10 px-3 py-4 opacity-80">
                  {r.closedDate ?? "—"}
                </td>
                <td className="border-t border-black/10 px-3 py-4 text-right">
                  <KebabButton />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function OrdersPageClient() {
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<FilterKey>>(() => new Set());
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<OrderStage | null>(null);
  const [detailsOrderId, setDetailsOrderId] = useState<string | null>(null);
  const [detailsTab, setDetailsTab] = useState<"details" | "contacts" | "notes">("details");
  const draggingOrderIdRef = useRef<string | null>(null);

  const loadOrders = useCallback(async (opts?: { quiet?: boolean }) => {
    setOrdersError(null);
    if (!opts?.quiet) setOrdersLoading(true);
    const res = await supabase
      .from("orders")
      .select("id,email,total_amount,status,created_at,pipeline_stage")
      .order("created_at", { ascending: false });

    if (res.error) {
      setOrdersError(res.error.message);
      setOrders([]);
      setOrdersLoading(false);
      return;
    }

    setOrders((res.data ?? []).map((row) => mapDbOrder(row as DbOrderRow)));
    setOrdersLoading(false);
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-orders-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => void loadOrders({ quiet: true })
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadOrders]);

  /** Pointer-based Kanban (HTML5 DnD is unreliable in embedded / in-app browsers). */
  useEffect(() => {
    if (!draggingId) return;

    const finish = (clientX: number, clientY: number) => {
      const id = draggingOrderIdRef.current;
      draggingOrderIdRef.current = null;
      setDraggingId(null);
      setDragOverStage(null);
      if (!id) return;
      const under = document.elementFromPoint(clientX, clientY);
      const stage = parseKanbanDropStage(under);
      if (!stage) return;
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, stage } : o)));
      void supabase.from("orders").update({ pipeline_stage: stage }).eq("id", id);
    };

    const onMove = (e: PointerEvent) => {
      const under = document.elementFromPoint(e.clientX, e.clientY);
      setDragOverStage(parseKanbanDropStage(under));
    };

    const onUp = (e: PointerEvent) => {
      finish(e.clientX, e.clientY);
    };

    const onCancel = () => {
      draggingOrderIdRef.current = null;
      setDraggingId(null);
      setDragOverStage(null);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
  }, [draggingId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let base =
      !q
        ? orders
        : orders.filter(
            (o) =>
              o.displayId.toLowerCase().includes(q) ||
              o.customer.toLowerCase().includes(q) ||
              o.email.toLowerCase().includes(q)
          );

    if (activeFilters.size) {
      const has = (k: FilterKey) => activeFilters.has(k);
      base = base.filter((o) => {
        const stageOk =
          !has("stage_received") && !has("stage_packaging") && !has("stage_ready")
            ? true
            : (has("stage_received") && o.stage === "Received") ||
              (has("stage_packaging") && o.stage === "Packaging") ||
              (has("stage_ready") && o.stage === "Ready for delivery");

        const statusLabel = o.status?.label?.toLowerCase() ?? "";
        const statusOk =
          !has("status_priority") && !has("status_express")
            ? true
            : (has("status_priority") && statusLabel === "priority") ||
              (has("status_express") && statusLabel === "express");

        return stageOk && statusOk;
      });
    }

    return base;
  }, [orders, query, activeFilters]);

  const received = filtered.filter((o) => o.stage === "Received");
  const packaging = filtered.filter((o) => o.stage === "Packaging");
  const ready = filtered.filter((o) => o.stage === "Ready for delivery");
  const delivered = filtered.filter((o) => o.stage === "Delivered");
  const selected = detailsOrderId
    ? orders.find((o) => o.id === detailsOrderId) ?? null
    : null;

  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetailsOrderId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  return (
    <>
      <header className="sticky top-0 z-10 bg-[#f7faf4]">
        <div className="flex items-center justify-between px-6 py-4 sm:px-10">
          <div className="min-w-0">
            <div className="text-base font-semibold tracking-tight">Order Pipeline</div>
            <div className="mt-1 text-xs opacity-65">
              Manage and track {orders.length} order{orders.length === 1 ? "" : "s"} across Ceylon
              estates.
            </div>
          </div>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-2xl bg-white/65 hover:bg-white/80"
            aria-label="Notifications"
          >
            <BellIcon />
          </button>
        </div>
        <div className="h-[1px] bg-black/10" />

        <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <div className="inline-flex w-fit rounded-2xl bg-white/60 p-1 text-sm">
            <button
              type="button"
              onClick={() => setView("kanban")}
              className={[
                "rounded-2xl px-4 py-2",
                view === "kanban"
                  ? "bg-white/85 font-semibold shadow-[0_20px_40px_rgba(0,37,33,0.08)]"
                  : "opacity-70 hover:opacity-100",
              ].join(" ")}
              aria-pressed={view === "kanban"}
            >
              Kanban View
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={[
                "rounded-2xl px-4 py-2",
                view === "list"
                  ? "bg-white/85 font-semibold shadow-[0_20px_40px_rgba(0,37,33,0.08)]"
                  : "opacity-70 hover:opacity-100",
              ].join(" ")}
              aria-pressed={view === "list"}
            >
              List View
            </button>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl bg-white/70 px-4 py-3 sm:w-[420px]">
              <span className="opacity-60" aria-hidden="true">
                <SearchIcon />
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent text-sm outline-none placeholder:opacity-60"
                placeholder="Search Order ID or Customer..."
                aria-label="Search orders"
              />
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setFiltersOpen((v) => !v)}
                className="inline-flex items-center justify-center gap-3 rounded-2xl bg-white/70 px-4 py-3 text-sm font-semibold hover:bg-white/85"
                aria-haspopup="menu"
                aria-expanded={filtersOpen}
              >
                <FiltersIcon />
                Filters
              </button>

              {filtersOpen ? (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 cursor-default"
                    aria-label="Close filters menu"
                    onClick={() => setFiltersOpen(false)}
                  />
                  <div
                    className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl bg-[#f7faf4] shadow-[0_30px_70px_rgba(0,37,33,0.16)] ring-1 ring-black/10 z-30"
                    role="menu"
                    aria-label="Predefined filters"
                  >
                    <div className="divide-y divide-black/10 max-h-[320px] overflow-auto bg-white/70">
                      {[
                        { key: "stage_received" as const, label: "Received" },
                        { key: "stage_packaging" as const, label: "Packaging" },
                        { key: "stage_ready" as const, label: "Ready for delivery" },
                        { key: "status_priority" as const, label: "Priority" },
                        { key: "status_express" as const, label: "Express" },
                      ].map((opt) => {
                        const checked = activeFilters.has(opt.key);
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            role="menuitemcheckbox"
                            aria-checked={checked}
                            onClick={() => {
                              setActiveFilters((prev) => {
                                const next = new Set(prev);
                                if (next.has(opt.key)) next.delete(opt.key);
                                else next.add(opt.key);
                                return next;
                              });
                            }}
                            className={[
                              "w-full px-4 py-2.5 text-left text-sm hover:bg-[#f1f5ef]/70 flex items-center justify-between gap-3",
                              checked ? "bg-[#f1f5ef] font-semibold" : "",
                            ].join(" ")}
                          >
                            <span className="truncate">{opt.label}</span>
                            <span
                              className={[
                                "grid h-5 w-5 shrink-0 place-items-center rounded-md border",
                                checked
                                  ? "border-[#033c37] bg-[#033c37] text-white"
                                  : "border-black/15 bg-white",
                              ].join(" ")}
                              aria-hidden="true"
                            >
                              {checked ? "✓" : ""}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="p-3 bg-[#f7faf4]">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveFilters(new Set());
                          setFiltersOpen(false);
                        }}
                        className="w-full rounded-2xl bg-[#f1f5ef] px-4 py-2.5 text-sm font-semibold hover:bg-[#e6e9e3]"
                      >
                        Clear filters
                      </button>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-6 pb-10 pt-8 sm:px-10">
        {ordersError ? (
          <div className="mb-4 rounded-3xl bg-white/70 p-4 text-sm">
            <div className="font-semibold text-[#7a1c1c]">Couldn’t load orders</div>
            <div className="mt-1 opacity-70">{ordersError}</div>
          </div>
        ) : null}
        {ordersLoading ? (
          <div className="rounded-3xl bg-white/70 p-6 text-sm opacity-70">Loading orders…</div>
        ) : view === "kanban" ? (
          <div className="flex gap-8 overflow-x-auto pb-6">
            <KanbanColumn
              title="RECEIVED"
              stage="Received"
              count={received.length}
              isDropHighlight={dragOverStage === "Received"}
            >
              {received.map((o) => (
                <PipelineCard
                  key={o.id}
                  item={o}
                  isDragging={draggingId === o.id}
                  onGrabPointer={() => {
                    draggingOrderIdRef.current = o.id;
                    setDraggingId(o.id);
                  }}
                  onOpenDetails={() => {
                    setDetailsTab("details");
                    setDetailsOrderId(o.id);
                  }}
                />
              ))}
            </KanbanColumn>
            <KanbanColumn
              title="PACKAGING"
              stage="Packaging"
              count={packaging.length}
              isDropHighlight={dragOverStage === "Packaging"}
            >
              {packaging.map((o) => (
                <PipelineCard
                  key={o.id}
                  item={o}
                  isDragging={draggingId === o.id}
                  onGrabPointer={() => {
                    draggingOrderIdRef.current = o.id;
                    setDraggingId(o.id);
                  }}
                  onOpenDetails={() => {
                    setDetailsTab("details");
                    setDetailsOrderId(o.id);
                  }}
                />
              ))}
            </KanbanColumn>
            <KanbanColumn
              title="READY FOR DELIVERY"
              stage="Ready for delivery"
              count={ready.length}
              isDropHighlight={dragOverStage === "Ready for delivery"}
            >
              {ready.map((o) => (
                <PipelineCard
                  key={o.id}
                  item={o}
                  isDragging={draggingId === o.id}
                  onGrabPointer={() => {
                    draggingOrderIdRef.current = o.id;
                    setDraggingId(o.id);
                  }}
                  onOpenDetails={() => {
                    setDetailsTab("details");
                    setDetailsOrderId(o.id);
                  }}
                />
              ))}
            </KanbanColumn>
            <KanbanColumn
              title="DELIVERED"
              stage="Delivered"
              count={delivered.length}
              isDropHighlight={dragOverStage === "Delivered"}
            >
              {delivered.map((o) => (
                <PipelineCard
                  key={o.id}
                  item={o}
                  isDragging={draggingId === o.id}
                  onGrabPointer={() => {
                    draggingOrderIdRef.current = o.id;
                    setDraggingId(o.id);
                  }}
                  onOpenDetails={() => {
                    setDetailsTab("details");
                    setDetailsOrderId(o.id);
                  }}
                />
              ))}
            </KanbanColumn>
          </div>
        ) : (
          <OrdersTable rows={filtered} />
        )}
      </main>

      {selected ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[1px]"
            aria-label="Close order details"
            onClick={() => setDetailsOrderId(null)}
          />

          <aside
            className={[
              "fixed right-0 top-0 z-50 h-dvh w-full max-w-[420px] overflow-y-auto",
              "bg-white shadow-[0_40px_120px_rgba(0,0,0,0.28)]",
              "border-l border-black/10",
            ].join(" ")}
            role="dialog"
            aria-modal="true"
            aria-label={`Order details ${selected.displayId}`}
          >
            <div className="sticky top-0 bg-white">
              <div className="flex items-center justify-between px-5 py-4">
                <button
                  type="button"
                  className="grid h-10 w-10 place-items-center rounded-2xl hover:bg-black/[0.04]"
                  aria-label="Back"
                  onClick={() => setDetailsOrderId(null)}
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
                    <path
                      d="M14.5 6.5 9 12l5.5 5.5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                <div className="text-sm font-semibold tracking-tight">Order</div>

                <button
                  type="button"
                  className="grid h-10 w-10 place-items-center rounded-2xl hover:bg-black/[0.04]"
                  aria-label="More"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 opacity-80" aria-hidden="true">
                    <path
                      d="M12 6.5a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5ZM12 13.25a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5ZM12 20a1.25 1.25 0 1 0 0-2.5A1.25 1.25 0 0 0 12 20Z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
              </div>

              <div className="px-6 pb-3">
                <div className="text-xs font-semibold opacity-60">{selected.displayId}</div>
                <div className="mt-1 text-sm font-semibold">{selected.customer}</div>
              </div>

              <div className="flex items-center gap-6 px-6">
                {(
                  [
                    { key: "details" as const, label: "Details" },
                    { key: "contacts" as const, label: "Contacts" },
                    { key: "notes" as const, label: "Notes" },
                  ] as const
                ).map((t) => {
                  const active = detailsTab === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setDetailsTab(t.key)}
                      className={[
                        "relative py-3 text-sm font-semibold",
                        active ? "text-[#033c37]" : "opacity-55 hover:opacity-80",
                      ].join(" ")}
                      aria-pressed={active}
                    >
                      {t.label}
                      {active ? (
                        <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] rounded-full bg-[#033c37]" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
              <div className="h-[1px] bg-black/10" />
            </div>

            <div className="px-6 py-5">
              {detailsTab === "details" ? (
                <div className="rounded-3xl bg-[#f7faf4] p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-sm font-semibold">Order Details</div>
                    <button type="button" className="inline-flex items-center gap-2 text-sm font-semibold text-[#033c37]">
                      <span aria-hidden="true">✎</span> Edit
                    </button>
                  </div>

                  <div className="mt-5 space-y-4 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="opacity-70">Order Amount</span>
                      <span className="font-semibold tabular-nums">
                        <Money value={selected.total} />
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="opacity-70">Order Stage</span>
                      <span className="font-semibold">{selected.stage}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="opacity-70">Status</span>
                      <span className="font-semibold">{selected.status?.label ?? "—"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="opacity-70">Tag</span>
                      <span className="font-semibold">{selected.tag?.label ?? "—"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="opacity-70">Created Date</span>
                      <span className="font-semibold">{selected.createdDate}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="opacity-70">Closed Date</span>
                      <span className="font-semibold">{selected.closedDate ?? "—"}</span>
                    </div>

                    {typeof selected.progress === "number" ? (
                      <div className="pt-2">
                        <div className="flex items-center justify-between gap-4 text-xs opacity-70">
                          <span>Progress</span>
                          <span className="tabular-nums">{Math.round(selected.progress)}%</span>
                        </div>
                        <div className="mt-2 h-2 w-full rounded-full bg-black/10">
                          <div
                            className="h-2 rounded-full bg-[#bdef86]"
                            style={{ width: `${Math.max(0, Math.min(100, selected.progress))}%` }}
                            aria-hidden="true"
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {detailsTab === "contacts" ? (
                <div className="rounded-3xl bg-[#f7faf4] p-5 text-sm">
                  <div className="text-sm font-semibold">Contacts</div>
                  <div className="mt-4 space-y-3 opacity-75">
                    <div>Email: {selected.email || "—"}</div>
                    <div>Phone: —</div>
                    <div>Address: —</div>
                  </div>
                </div>
              ) : null}

              {detailsTab === "notes" ? (
                <div className="rounded-3xl bg-[#f7faf4] p-5 text-sm">
                  <div className="text-sm font-semibold">Notes</div>
                  <div className="mt-4 text-sm opacity-75">No notes yet.</div>
                  <button
                    type="button"
                    className="mt-4 w-full rounded-2xl bg-white/70 px-4 py-3 text-sm font-semibold hover:bg-white/85"
                  >
                    Add note
                  </button>
                </div>
              ) : null}
            </div>
          </aside>
        </>
      ) : null}
    </>
  );
}

