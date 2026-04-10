"use client";

import { supabase } from "@/lib/supabaseClient";
import { useMemo, useState } from "react";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function BulkUpdatePricesButton() {
  const [open, setOpen] = useState(false);
  const [percent, setPercent] = useState(0);
  const [mode, setMode] = useState<"items" | "items_and_customisations">("items");
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const helper = useMemo(() => {
    if (!percent) return "No change in delivery price";
    return percent > 0
      ? `Increase delivery price by ${percent}%`
      : `Reduce delivery price by ${Math.abs(percent)}%`;
  }, [percent]);

  return (
    <>
      <button
        type="button"
        className="opacity-80 hover:opacity-100"
        onClick={() => setOpen(true)}
      >
        Bulk update prices
      </button>

      {open ? (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Bulk update delivery prices">
          <button
            type="button"
            className="absolute inset-0 bg-black/35"
            onClick={() => setOpen(false)}
            aria-label="Close"
          />

          <div className="absolute inset-0 overflow-y-auto">
            <div className="min-h-full px-4 py-6 sm:px-10 sm:py-10">
              <div className="mx-auto w-full max-w-xl rounded-[28px] bg-white shadow-[0_60px_120px_rgba(0,0,0,0.25)]">
                <div className="px-7 pt-7 pb-5">
                  <div className="text-2xl font-semibold tracking-tight">Bulk update delivery prices</div>
                  <div className="mt-2 text-sm opacity-70">
                    Update delivery prices by entering a negative % value to reduce and a positive % value to increase the price.
                  </div>
                </div>

                <div className="px-7 pb-7">
                  <div className="mt-2 flex items-center gap-4">
                    <button
                      type="button"
                      className="grid h-10 w-10 place-items-center rounded-full bg-black/5 hover:bg-black/10"
                      aria-label="Decrease percent"
                      onClick={() => setPercent((p) => clamp(p - 1, -100, 100))}
                    >
                      −
                    </button>

                    <div className="flex items-center rounded-2xl border border-black/10 bg-white px-4 py-3">
                      <input
                        inputMode="numeric"
                        value={String(percent)}
                        onChange={(e) => {
                          const raw = e.target.value.trim();
                          if (raw === "" || raw === "-" || raw === "+") {
                            setPercent(0);
                            return;
                          }
                          const n = Number(raw);
                          if (Number.isNaN(n)) return;
                          setPercent(clamp(Math.trunc(n), -100, 100));
                        }}
                        className="w-16 bg-transparent text-center text-sm font-semibold outline-none tabular-nums"
                        aria-label="Percent change"
                      />
                      <div className="pl-2 text-sm font-semibold">%</div>
                    </div>

                    <button
                      type="button"
                      className="grid h-10 w-10 place-items-center rounded-full bg-black/5 hover:bg-black/10"
                      aria-label="Increase percent"
                      onClick={() => setPercent((p) => clamp(p + 1, -100, 100))}
                    >
                      +
                    </button>
                  </div>

                  <div className="mt-3 text-sm opacity-70">{helper}</div>

                  <div className="mt-6 border-t border-black/5 pt-6">
                    <label className="flex cursor-pointer items-center gap-4 py-3">
                      <input
                        type="radio"
                        name="bulk-update-mode"
                        checked={mode === "items"}
                        onChange={() => setMode("items")}
                        className="h-5 w-5 accent-[#033c37]"
                      />
                      <div className="text-sm font-semibold">Apply to all items across all catogary</div>
                    </label>
                    <div className="h-[1px] bg-black/5" />
                    <label className="flex cursor-pointer items-center gap-4 py-3">
                      <input
                        type="radio"
                        name="bulk-update-mode"
                        checked={mode === "items_and_customisations"}
                        onChange={() => setMode("items_and_customisations")}
                        className="h-5 w-5 accent-[#033c37]"
                      />
                      <div className="text-sm font-semibold">
                        Apply to all items and customisations across all catoagray
                      </div>
                    </label>
                  </div>

                  <div className="mt-6 text-sm">
                    <div className="font-semibold">Note:</div>
                    <ul className="mt-2 list-disc space-y-2 pl-5 opacity-75">
                      <li>New prices will be rounded off to 2 decimal digits (e.g. 5.236 to 5.24).</li>
                      <li>Please ensure the price updates are consistent with your agreement with Uber.</li>
                    </ul>
                  </div>

                  {errorText ? (
                    <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-[#7a1c1c]">
                      {errorText}
                    </div>
                  ) : null}

                  <div className="mt-7 flex items-center justify-end gap-4">
                    <button
                      type="button"
                      className="text-sm font-semibold opacity-70 hover:opacity-100"
                      onClick={() => setOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={saving || percent === 0}
                      className={[
                        "rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white",
                        saving || percent === 0 ? "opacity-60 pointer-events-none" : "hover:bg-black/90",
                      ].join(" ")}
                      onClick={async () => {
                        setErrorText(null);
                        setSaving(true);
                        try {
                          const res = await supabase.rpc("bulk_update_product_prices", {
                            p_percent: percent,
                            p_include_customisations: mode === "items_and_customisations",
                          });
                          if (res.error) throw new Error(res.error.message);
                          setOpen(false);
                        } catch (e) {
                          setErrorText(e instanceof Error ? e.message : "Failed to update prices.");
                        } finally {
                          setSaving(false);
                        }
                      }}
                    >
                      {saving ? "Updating…" : "Update prices"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

