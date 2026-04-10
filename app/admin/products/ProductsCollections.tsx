"use client";

import { useMemo, useState } from "react";

type Item = {
  id: string;
  name: string;
  priceLkr: number;
  popular?: boolean;
  stock_status?: "in_stock" | "out_of_stock" | "backorder";
};

type Collection = {
  id: string;
  name: string;
  items: Item[];
};

function formatLkr(n: number) {
  return `Rs ${n.toLocaleString("en-LK")}`;
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={[
        "h-5 w-5 transition-transform duration-200",
        open ? "rotate-180" : "rotate-0",
      ].join(" ")}
      aria-hidden="true"
    >
      <path
        d="M7.5 10 12 14.5 16.5 10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DragHandle() {
  return (
    <div
      className="grid h-10 w-10 place-items-center rounded-2xl bg-[#f1f5ef] opacity-80"
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M8 7h8M8 12h8M8 17h8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function StockStatusSelect({
  value,
  onChange,
}: {
  value: NonNullable<Item["stock_status"]>;
  onChange: (v: NonNullable<Item["stock_status"]>) => void;
}) {
  const styles =
    value === "in_stock"
      ? "bg-[#033c37] text-white"
      : value === "backorder"
        ? "bg-[#e3eb36] text-[#1c1d00]"
        : "bg-[#e6e9e3] text-[#404847]";

  return (
    <div className="relative shrink-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as NonNullable<Item["stock_status"]>)}
        className={[
          "h-9 w-[140px] sm:w-[160px] max-w-full rounded-2xl px-3 text-center text-xs font-semibold outline-none leading-[2.25rem] truncate",
          styles,
        ].join(" ")}
        aria-label="Stock status"
      >
        <option value="in_stock">In stock</option>
        <option value="out_of_stock">Out of stock</option>
        <option value="backorder">Backorder</option>
      </select>
    </div>
  );
}

function Thumb({ seed }: { seed: string }) {
  const tint = useMemo(() => {
    let x = 0;
    for (let i = 0; i < seed.length; i++) x = (x * 31 + seed.charCodeAt(i)) >>> 0;
    const hues = [120, 95, 155, 45, 20];
    const h = hues[x % hues.length];
    return `hsl(${h} 45% 35%)`;
  }, [seed]);

  return (
    <div
      className="h-9 w-9 rounded-2xl shadow-[0_20px_45px_rgba(0,37,33,0.12)]"
      style={{
        background:
          `radial-gradient(circle at 30% 25%, rgba(227,235,54,0.28), transparent 55%), ` +
          `radial-gradient(circle at 70% 80%, rgba(189,239,134,0.22), transparent 55%), ` +
          `linear-gradient(140deg, ${tint}, rgba(0,37,33,0.4))`,
      }}
      aria-hidden="true"
    />
  );
}

export function ProductsCollections() {
  const collections: Collection[] = [
    {
      id: "chilli-products",
      name: "Chilli Products",
      items: [
        { id: "chilli-powder", name: "Chilli Powder", priceLkr: 2400, popular: true, stock_status: "in_stock" },
        { id: "chilli-pieces", name: "Chilli Pieces", priceLkr: 2400, stock_status: "in_stock" },
        { id: "chilli-corn", name: "Chilli Corn", priceLkr: 2400, stock_status: "backorder" },
        { id: "cut-chillies", name: "Cut Chillies", priceLkr: 2400, stock_status: "out_of_stock" },
      ],
    },
    {
      id: "pepper-products",
      name: "Pepper Products",
      items: [
        { id: "pepper-powder", name: "Pepper Powder", priceLkr: 2400, stock_status: "in_stock" },
        { id: "crushed-pepper", name: "Crushed Pepper", priceLkr: 2400, stock_status: "in_stock" },
        { id: "pepper-corn", name: "Pepper Corn", priceLkr: 2400, stock_status: "in_stock" },
      ],
    },
    {
      id: "curry-spice-blends",
      name: "Curry & Spice Blends",
      items: [
        { id: "curry-powder", name: "Curry Powder", priceLkr: 2400, stock_status: "in_stock" },
        { id: "roasted-curry-powder", name: "Roasted Curry Powder", priceLkr: 2400, stock_status: "in_stock" },
      ],
    },
    {
      id: "coriander-products",
      name: "Coriander Products",
      items: [
        { id: "coriander-powder", name: "Coriander Powder", priceLkr: 2400, stock_status: "in_stock" },
        { id: "coriander-seeds", name: "Coriander Seeds", priceLkr: 2400, stock_status: "in_stock" },
      ],
    },
    {
      id: "seeds-whole-spices",
      name: "Seeds & Whole Spices",
      items: [
        { id: "cumin-seeds", name: "Cumin Seeds", priceLkr: 2400, stock_status: "in_stock" },
        { id: "mustard-seed", name: "Mustard Seed", priceLkr: 2400, stock_status: "in_stock" },
        { id: "fennel-seeds", name: "Fennel Seeds", priceLkr: 2400, stock_status: "in_stock" },
        { id: "dill-seeds", name: "Dill Seeds", priceLkr: 2400, stock_status: "in_stock" },
      ],
    },
    {
      id: "individual-spice-powders",
      name: "Individual Spice Powders",
      items: [{ id: "turmeric-powder", name: "Turmeric Powder", priceLkr: 2400, stock_status: "in_stock" }],
    },
    {
      id: "whole-spices",
      name: "Whole Spices",
      items: [
        { id: "cinnamon", name: "Cinnamon", priceLkr: 2400, stock_status: "in_stock" },
        { id: "cloves", name: "Cloves", priceLkr: 2400, stock_status: "in_stock" },
      ],
    },
    {
      id: "specialty-ingredients",
      name: "Specialty Ingredients",
      items: [{ id: "gamboge-paste", name: "Gamboge Paste", priceLkr: 2400, stock_status: "in_stock" }],
    },
  ];

  const [openId, setOpenId] = useState<string>(collections[0]?.id ?? "");
  const [statusById, setStatusById] = useState<Record<string, NonNullable<Item["stock_status"]>>>(
    () => {
      const next: Record<string, NonNullable<Item["stock_status"]>> = {};
      for (const c of collections) {
        for (const it of c.items) {
          next[it.id] = it.stock_status ?? "in_stock";
        }
      }
      return next;
    }
  );

  return (
    <div className="space-y-3">
      {collections.map((c) => {
        const open = openId === c.id;
        return (
          <div key={c.id} className="rounded-3xl bg-white/70">
            <button
              type="button"
              onClick={() => setOpenId((prev) => (prev === c.id ? "" : c.id))}
              className="w-full px-6 py-5 text-left"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <DragHandle />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{c.name}</div>
                    <div className="mt-1 text-xs opacity-70">
                      {c.items.length || 0} items
                    </div>
                  </div>
                </div>

                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/60 opacity-80">
                  <Chevron open={open} />
                </div>
              </div>
            </button>

            {open ? (
              <div className="px-6 pb-6">
                <div className="space-y-3">
                  {c.items.length ? (
                    <>
                      {c.items.map((it) => (
                        <div
                          key={it.id}
                          className="rounded-2xl bg-white/55 px-4 py-3"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex min-w-0 items-center gap-3">
                              <DragHandle />
                              <Thumb seed={it.id} />
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="truncate text-sm font-semibold">
                                    {it.name}
                                  </div>
                                  {it.popular ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-[#bdef86]/70 px-2.5 py-1 text-[11px] font-semibold text-[#002521]">
                                      <span aria-hidden="true">★</span> Popular
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="min-w-[92px] rounded-2xl bg-[#e6e9e3] px-3 py-2 text-center text-xs font-semibold tabular-nums">
                                {formatLkr(it.priceLkr)}
                              </div>
                              <StockStatusSelect
                                value={statusById[it.id] ?? "in_stock"}
                                onChange={(v) =>
                                  setStatusById((prev) => ({
                                    ...prev,
                                    [it.id]: v,
                                  }))
                                }
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-2xl bg-white/55 px-4 py-2 text-sm font-semibold opacity-80 hover:opacity-100"
                      >
                        <span
                          className="grid h-6 w-6 place-items-center rounded-xl bg-[#033c37] text-white text-xs"
                          aria-hidden="true"
                        >
                          +
                        </span>
                        Add item
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="rounded-2xl bg-white/55 px-4 py-3 text-sm opacity-75">
                        No items yet.
                      </div>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-2xl bg-white/55 px-4 py-2 text-sm font-semibold opacity-80 hover:opacity-100"
                      >
                        <span
                          className="grid h-6 w-6 place-items-center rounded-xl bg-[#033c37] text-white text-xs"
                          aria-hidden="true"
                        >
                          +
                        </span>
                        Add item
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

