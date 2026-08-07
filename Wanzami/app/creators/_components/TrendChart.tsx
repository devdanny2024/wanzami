'use client';

import { useMemo, useRef, useState } from "react";
import { INK, MUTED, RUST } from "./kit";

export type DailyPoint = { date: string; purchases: number; revenueNaira: number };

const WIDTH = 640;
const HEIGHT = 180;
const PAD = { top: 16, right: 12, bottom: 24, left: 12 };

// Fills gaps so 30 real calendar days are always plotted — a day with no buys
// is a real zero, not a missing point, and the axis should say so.
function fillDays(daily: DailyPoint[]): DailyPoint[] {
  const byDate = new Map(daily.map((d) => [d.date, d]));
  const out: DailyPoint[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push(byDate.get(key) ?? { date: key, purchases: 0, revenueNaira: 0 });
  }
  return out;
}

export function TrendChart({ daily }: { daily: DailyPoint[] }) {
  const points = useMemo(() => fillDays(daily), [daily]);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const maxRevenue = Math.max(1, ...points.map((p) => p.revenueNaira));
  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;

  const x = (i: number) => PAD.left + (i / (points.length - 1)) * plotW;
  const y = (v: number) => PAD.top + plotH - (v / maxRevenue) * plotH;

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.revenueNaira)}`).join(" ");
  const areaPath = `${linePath} L ${x(points.length - 1)} ${PAD.top + plotH} L ${x(0)} ${PAD.top + plotH} Z`;

  const gridLines = [0, 0.5, 1];
  const hasAnyData = points.some((p) => p.revenueNaira > 0);

  const handleMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const ratio = Math.min(1, Math.max(0, (relX - PAD.left) / plotW));
    const idx = Math.round(ratio * (points.length - 1));
    setHoverIndex(idx);
  };

  if (!hasAnyData) {
    return (
      <div className="flex h-[180px] items-center justify-center border-[1.5px] border-dashed" style={{ borderColor: "#d8cbac" }}>
        <p className="font-mono text-[11px]" style={{ color: MUTED }}>No buys in the last 30 days</p>
      </div>
    );
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full touch-none"
        onPointerMove={handleMove}
        onPointerLeave={() => setHoverIndex(null)}
        role="img"
        aria-label={`Daily revenue over the last 30 days, ${points.reduce((s, p) => s + p.purchases, 0)} total buys`}
      >
        {gridLines.map((g) => (
          <line
            key={g}
            x1={PAD.left}
            x2={WIDTH - PAD.right}
            y1={PAD.top + plotH * (1 - g)}
            y2={PAD.top + plotH * (1 - g)}
            stroke="#d8cbac"
            strokeWidth={1}
          />
        ))}

        <path d={areaPath} fill={RUST} opacity={0.1} stroke="none" />
        <path d={linePath} fill="none" stroke={RUST} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {/* End marker: >=8px diameter, 2px surface ring so it reads over the line. */}
        <circle cx={x(points.length - 1)} cy={y(points[points.length - 1].revenueNaira)} r={6} fill={RUST} stroke="#f7f1e3" strokeWidth={2} />

        {hoverIndex !== null && (
          <>
            <line x1={x(hoverIndex)} x2={x(hoverIndex)} y1={PAD.top} y2={PAD.top + plotH} stroke={INK} strokeWidth={1} opacity={0.3} />
            <circle cx={x(hoverIndex)} cy={y(points[hoverIndex].revenueNaira)} r={5} fill={RUST} stroke="#f7f1e3" strokeWidth={2} />
          </>
        )}
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 border-[1.5px] px-2.5 py-1.5"
          style={{
            left: `${(x(hoverIndex!) / WIDTH) * 100}%`,
            borderColor: INK,
            backgroundColor: "#f2ead9",
          }}
        >
          <p className="font-mono text-sm font-bold" style={{ color: INK }}>
            &#8358;{hovered.revenueNaira.toLocaleString()}
          </p>
          <p className="font-mono text-[10px]" style={{ color: MUTED }}>
            {hovered.purchases} buy{hovered.purchases === 1 ? "" : "s"} &middot;{" "}
            {new Date(hovered.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </p>
        </div>
      )}
    </div>
  );
}
