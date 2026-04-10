"use client";

import { supabase } from "@/lib/supabaseClient";
import { useCallback, useMemo, useRef, useState, useEffect } from "react";

type Preset = "last_week" | "last_month" | "last_12_weeks" | "custom";

function formatRangeLabel(preset: Preset, start: string, end: string) {
  if (preset === "last_week") return "Last week";
  if (preset === "last_month") return "Last month";
  if (preset === "last_12_weeks") return "Last 12 weeks";
  if (!start && !end) return "Custom";
  return `${start || "…"} → ${end || "…"}`;
}

function yyyyMmDdUTC(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function addDaysUTC(d: Date, days: number) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + days));
}

function startOfDayUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function niceMax(n: number) {
  if (!Number.isFinite(n) || n <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(n)));
  const scaled = n / pow;
  const step = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 5 ? 5 : 10;
  return step * pow;
}

export function SalesOverview() {
  const [preset, setPreset] = useState<Preset>("last_week");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [seriesThis, setSeriesThis] = useState<number[]>([]);
  const [seriesPrev, setSeriesPrev] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [hover, setHover] = useState<{ idx: number; x: number; y: number } | null>(null);

  const rangeLabel = useMemo(
    () => formatRangeLabel(preset, customStart, customEnd),
    [preset, customStart, customEnd]
  );

  const range = useMemo(() => {
    const today = startOfDayUTC(new Date());
    if (preset === "last_week") {
      const end = addDaysUTC(today, 1);
      const start = addDaysUTC(end, -7);
      return { start, end };
    }
    if (preset === "last_month") {
      const end = addDaysUTC(today, 1);
      const start = addDaysUTC(end, -30);
      return { start, end };
    }
    if (preset === "last_12_weeks") {
      const end = addDaysUTC(today, 1);
      const start = addDaysUTC(end, -84);
      return { start, end };
    }

    // custom
    if (customStart && customEnd) {
      const start = startOfDayUTC(new Date(`${customStart}T00:00:00Z`));
      const end = addDaysUTC(startOfDayUTC(new Date(`${customEnd}T00:00:00Z`)), 1);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
        return { start: addDaysUTC(today, -7), end: addDaysUTC(today, 1) };
      }
      return { start, end };
    }

    const end = addDaysUTC(today, 1);
    const start = addDaysUTC(end, -7);
    return { start, end };
  }, [preset, customStart, customEnd]);

  const load = useCallback(async () => {
    setErrorText(null);
    setLoading(true);
    const start = range.start;
    const end = range.end;
    const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000));
    const prevEnd = start;
    const prevStart = addDaysUTC(prevEnd, -days);

    const [thisRes, prevRes] = await Promise.all([
      supabase
        .from("orders")
        .select("created_at,total_amount")
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString()),
      supabase
        .from("orders")
        .select("created_at,total_amount")
        .gte("created_at", prevStart.toISOString())
        .lt("created_at", prevEnd.toISOString()),
    ]);

    if (thisRes.error || prevRes.error) {
      setErrorText(thisRes.error?.message ?? prevRes.error?.message ?? "Failed to load sales.");
      setSeriesThis([]);
      setSeriesPrev([]);
      setLabels([]);
      setLoading(false);
      return;
    }

    type OrderRow = { created_at: string | null; total_amount: number | string | null };

    const sumByDay = (rows: OrderRow[]) => {
      const m = new Map<string, number>();
      for (const r of rows) {
        if (!r.created_at) continue;
        const d = new Date(r.created_at);
        if (Number.isNaN(d.getTime())) continue;
        const key = yyyyMmDdUTC(d);
        const amt = typeof r.total_amount === "number" ? r.total_amount : Number(r.total_amount ?? 0);
        m.set(key, (m.get(key) ?? 0) + (Number.isFinite(amt) ? amt : 0));
      }
      return m;
    };

    const thisMap = sumByDay(((thisRes.data ?? []) as OrderRow[]).map((r) => r));
    const prevMap = sumByDay(((prevRes.data ?? []) as OrderRow[]).map((r) => r));

    const nextLabels: string[] = [];
    const nextThis: number[] = [];
    const nextPrev: number[] = [];
    for (let i = 0; i < days; i++) {
      const d = addDaysUTC(start, i);
      const key = yyyyMmDdUTC(d);
      const prevKey = yyyyMmDdUTC(addDaysUTC(prevStart, i));
      nextLabels.push(key);
      nextThis.push(thisMap.get(key) ?? 0);
      nextPrev.push(prevMap.get(prevKey) ?? 0);
    }

    setLabels(nextLabels);
    setSeriesThis(nextThis);
    setSeriesPrev(nextPrev);
    setLoading(false);
  }, [range.start, range.end]);

  useEffect(() => {
    // Defer to satisfy repo lint rule about setState in effects.
    queueMicrotask(() => void load());
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-dashboard-sales-overview")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => void load())
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load]);

  const chart = useMemo(() => {
    const n = labels.length;
    const values = seriesThis;
    const prev = seriesPrev;
    if (n === 0) {
      return {
        xLabels: [] as Array<{ x: number; label: string }>,
        yTicks: [] as Array<{ y: number; label: string }>,
        points: [] as Array<{ idx: number; x: number; y: number; value: number; key: string }>,
        bands: [] as Array<{ idx: number; x: number; width: number }>,
        pathThis: "",
        pathPrev: "",
        areaThis: "",
      };
    }

    const maxV = Math.max(1, ...values, ...prev);
    const yMax = niceMax(maxV);
    const yMin = 0;
    const chartLeft = 90;
    const chartRight = 980;
    const chartTop = 40;
    const chartBottom = 285;
    const width = chartRight - chartLeft;
    const height = chartBottom - chartTop;

    const xAt = (i: number) => chartLeft + (n === 1 ? 0 : (i / (n - 1)) * width);
    const yAt = (v: number) =>
      chartTop + (1 - (Math.max(yMin, Math.min(yMax, v)) - yMin) / (yMax - yMin)) * height;

    const mkPath = (arr: number[]) => {
      if (arr.length === 0) return "";
      let d = `M ${xAt(0).toFixed(2)} ${yAt(arr[0]).toFixed(2)}`;
      for (let i = 1; i < arr.length; i++) {
        d += ` L ${xAt(i).toFixed(2)} ${yAt(arr[i]).toFixed(2)}`;
      }
      return d;
    };

    const pathThis = mkPath(values);
    const pathPrev = mkPath(prev);
    const areaThis =
      values.length === 0
        ? ""
        : `${pathThis} L ${xAt(n - 1).toFixed(2)} ${chartBottom} L ${xAt(0).toFixed(2)} ${chartBottom} Z`;

    const yTicks = [0.33, 0.5, 0.66, 0.83, 1].map((p) => {
      const v = yMax * p;
      const y = yAt(v);
      const label = `LKR ${Math.round(v / 1000)}K`;
      return { y, label };
    });

    const points = values.map((value, idx) => ({
      idx,
      x: xAt(idx),
      y: yAt(value),
      value,
      key: labels[idx] ?? String(idx),
    }));

    const bands: Array<{ idx: number; x: number; width: number }> = [];
    for (let i = 0; i < n; i++) {
      const x = xAt(i);
      const prevX = i === 0 ? x : xAt(i - 1);
      const nextX = i === n - 1 ? x : xAt(i + 1);
      const x0 = (prevX + x) / 2;
      const x1 = (x + nextX) / 2;
      const left = i === 0 ? x - (x1 - x) : x0;
      const right = i === n - 1 ? x + (x - x0) : x1;
      bands.push({ idx: i, x: left, width: Math.max(1, right - left) });
    }

    // show up to 9 x labels (like original UI)
    const want = Math.min(9, n);
    const step = want <= 1 ? 1 : Math.max(1, Math.round((n - 1) / (want - 1)));
    const xLabels: Array<{ x: number; label: string }> = [];
    for (let i = 0; i < n; i += step) {
      const key = labels[i]!;
      const [, mm, dd] = key.split("-");
      xLabels.push({ x: xAt(i), label: `${dd} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][Number(mm) - 1]}` });
    }
    if (xLabels.length && xLabels[xLabels.length - 1]!.label !== xLabels[xLabels.length - 1]!.label) {
      // no-op; keep deterministic
    }

    return { xLabels, yTicks, points, bands, pathThis, pathPrev, areaThis };
  }, [labels, seriesThis, seriesPrev]);

  return (
    <section className="mt-6 rounded-3xl bg-white/70 p-6 shadow-[0_30px_70px_rgba(0,37,33,0.06)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold">Sales overview</div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <label className="inline-flex items-center gap-2 rounded-2xl bg-white/60 px-4 py-2 text-sm font-semibold hover:bg-white/80">
            <span className="opacity-70">Range</span>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value as Preset)}
              className="bg-transparent outline-none"
              aria-label="Date range"
            >
              <option value="last_week">Last week</option>
              <option value="last_month">Last month</option>
              <option value="last_12_weeks">Last 12 weeks</option>
              <option value="custom">Custom</option>
            </select>
          </label>

          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/60 px-4 py-2 text-sm font-semibold hover:bg-white/80"
            aria-label="Download sales report"
          >
            <span aria-hidden="true">⬇</span>
            Download
          </button>
        </div>
      </div>

      {preset === "custom" ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] opacity-55">
            {rangeLabel}
          </div>
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:justify-end">
            <label className="inline-flex items-center gap-2 rounded-2xl bg-white/60 px-4 py-2 text-sm">
              <span className="text-xs opacity-70">Start</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-transparent text-sm outline-none"
              />
            </label>
            <label className="inline-flex items-center gap-2 rounded-2xl bg-white/60 px-4 py-2 text-sm">
              <span className="text-xs opacity-70">End</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-transparent text-sm outline-none"
              />
            </label>
          </div>
        </div>
      ) : (
        <div className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] opacity-55">
          {rangeLabel}
        </div>
      )}

      <div className="mt-5">
        <div
          ref={wrapRef}
          className="relative w-full overflow-hidden rounded-3xl bg-white/55 p-4 sm:p-5 min-h-[240px] aspect-[1000/320]"
        >
          {errorText ? (
            <div className="rounded-2xl bg-white/70 px-4 py-3 text-sm">
              <div className="font-semibold text-[#7a1c1c]">Couldn’t load sales</div>
              <div className="mt-1 opacity-70">{errorText}</div>
            </div>
          ) : loading ? (
            <div className="text-sm opacity-70">Loading sales…</div>
          ) : null}
          {hover ? (
            <div
              className="pointer-events-none absolute z-10 rounded-2xl bg-[#002521] px-3 py-2 text-xs text-white shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
              style={{
                left: Math.max(12, Math.min(hover.x + 12, (wrapRef.current?.clientWidth ?? 0) - 160)),
                top: Math.max(12, hover.y - 44),
                width: 148,
              }}
            >
              <div className="text-[10px] uppercase tracking-[0.18em] opacity-80">
                {labels[hover.idx] ?? ""}
              </div>
              <div className="mt-1 font-semibold tabular-nums">
                LKR {Number(seriesThis[hover.idx] ?? 0).toLocaleString("en-LK", { maximumFractionDigits: 2 })}
              </div>
            </div>
          ) : null}
          <svg
            viewBox="0 0 1000 320"
            preserveAspectRatio="xMidYMid meet"
            className="h-full w-full -translate-x-2"
            aria-label="Sales chart"
            onPointerLeave={() => setHover(null)}
          >
            <defs>
              <linearGradient id="lineGreen" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#bdef86" stopOpacity="0.28" />
                <stop offset="1" stopColor="#bdef86" stopOpacity="0.03" />
              </linearGradient>
            </defs>

            {chart.yTicks.map((t, idx) => (
              <line
                key={`grid-${idx}-${t.y.toFixed(2)}`}
                x1="70"
                x2="980"
                y1={t.y}
                y2={t.y}
                stroke="rgba(0,0,0,0.08)"
                strokeWidth="1"
              />
            ))}

            {chart.yTicks.map((t, idx) => (
              <text
                key={`y-${idx}-${t.y.toFixed(2)}`}
                x="16"
                y={t.y + 4}
                fontSize="12"
                fill="rgba(25,29,25,0.65)"
              >
                {t.label}
              </text>
            ))}

            {chart.xLabels.map((t) => (
              <text
                key={`x-${t.label}-${t.x.toFixed(0)}`}
                x={t.x}
                y="305"
                fontSize="12"
                fill="rgba(25,29,25,0.65)"
                textAnchor="middle"
              >
                {t.label}
              </text>
            ))}

            <g>
              {chart.bands.map((b) => (
                <rect
                  key={`band-${b.idx}`}
                  x={b.x}
                  y={40}
                  width={b.width}
                  height={245}
                  fill="transparent"
                  onPointerMove={(e) => {
                    const el = wrapRef.current;
                    if (!el) return;
                    const r = el.getBoundingClientRect();
                    setHover({ idx: b.idx, x: e.clientX - r.left, y: e.clientY - r.top });
                  }}
                />
              ))}
            </g>

            {chart.pathPrev ? (
              <path
                d={chart.pathPrev}
                fill="none"
                stroke="rgba(25,29,25,0.55)"
                strokeWidth="3"
                strokeDasharray="5 7"
              />
            ) : null}

            {chart.pathThis ? (
              <path
                d={chart.pathThis}
                fill="none"
                stroke="#033c37"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            {chart.areaThis ? <path d={chart.areaThis} fill="url(#lineGreen)" /> : null}

            {hover ? (
              <>
                <circle
                  cx={chart.points[hover.idx]?.x ?? 0}
                  cy={chart.points[hover.idx]?.y ?? 0}
                  r="6"
                  fill="#033c37"
                />
                <circle
                  cx={chart.points[hover.idx]?.x ?? 0}
                  cy={chart.points[hover.idx]?.y ?? 0}
                  r="10"
                  fill="rgba(3,60,55,0.12)"
                />
              </>
            ) : null}
          </svg>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-5 text-xs opacity-70">
          <div className="inline-flex items-center gap-2">
            <span className="h-[2px] w-8 rounded-full bg-[#033c37]" aria-hidden="true" />
            This period
          </div>
          <div className="inline-flex items-center gap-2">
            <span
              className="h-[2px] w-8 rounded-full bg-black/40"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, rgba(25,29,25,0.55) 0 6px, transparent 6px 12px)",
              }}
              aria-hidden="true"
            />
            Last period
          </div>
        </div>
      </div>
    </section>
  );
}

