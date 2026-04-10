"use client";

import { useMemo, useState } from "react";

type Preset = "last_week" | "last_month" | "last_12_weeks" | "custom";

function formatRangeLabel(preset: Preset, start: string, end: string) {
  if (preset === "last_week") return "Last week";
  if (preset === "last_month") return "Last month";
  if (preset === "last_12_weeks") return "Last 12 weeks";
  if (!start && !end) return "Custom";
  return `${start || "…"} → ${end || "…"}`;
}

export function SalesOverview() {
  const [preset, setPreset] = useState<Preset>("last_week");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const rangeLabel = useMemo(
    () => formatRangeLabel(preset, customStart, customEnd),
    [preset, customStart, customEnd]
  );

  return (
    <section className="mt-6 rounded-3xl bg-white/70 p-6 shadow-[0_30px_70px_rgba(0,37,33,0.06)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold">Sales overview</div>
          <div className="mt-1 text-xs opacity-65">This period vs last period · LKR</div>
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
        <div className="relative w-full overflow-hidden rounded-3xl bg-white/55 p-4 sm:p-5 min-h-[240px] aspect-[1000/320]">
          <svg
            viewBox="0 0 1000 320"
            preserveAspectRatio="xMidYMid meet"
            className="h-full w-full -translate-x-2"
            aria-label="Sales chart"
          >
            <defs>
              <linearGradient id="lineGreen" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#bdef86" stopOpacity="0.28" />
                <stop offset="1" stopColor="#bdef86" stopOpacity="0.03" />
              </linearGradient>
            </defs>

            {[40, 95, 150, 205, 260].map((y) => (
              <line
                key={y}
                x1="70"
                x2="980"
                y1={y}
                y2={y}
                stroke="rgba(0,0,0,0.08)"
                strokeWidth="1"
              />
            ))}

            {[
              { y: 40, label: "LKR 12K" },
              { y: 95, label: "LKR 10K" },
              { y: 150, label: "LKR 8K" },
              { y: 205, label: "LKR 6K" },
              { y: 260, label: "LKR 4K" },
            ].map((t) => (
              <text
                key={t.label}
                x="16"
                y={t.y + 4}
                fontSize="12"
                fill="rgba(25,29,25,0.65)"
              >
                {t.label}
              </text>
            ))}

            {["1 Apr", "2 Apr", "3 Apr", "4 Apr", "5 Apr", "6 Apr", "7 Apr", "8 Apr", "9 Apr"].map(
              (d, i) => (
                <text
                  key={d}
                  x={90 + i * 110}
                  y="305"
                  fontSize="12"
                  fill="rgba(25,29,25,0.65)"
                  textAnchor="middle"
                >
                  {d}
                </text>
              )
            )}

            <path
              d="M90 120 C200 70, 310 155, 420 120 S640 60, 750 220 S910 160, 980 160"
              fill="none"
              stroke="rgba(25,29,25,0.55)"
              strokeWidth="3"
              strokeDasharray="5 7"
            />

            <path
              d="M90 190 C200 80, 310 120, 420 250 S640 160, 750 90 S910 190, 980 260"
              fill="none"
              stroke="#033c37"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <path
              d="M90 190 C200 80, 310 120, 420 250 S640 160, 750 90 S910 190, 980 260 L980 285 L90 285 Z"
              fill="url(#lineGreen)"
            />
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

