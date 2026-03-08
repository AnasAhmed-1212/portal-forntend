import React, { useId } from "react";

const formatCompactPKR = (value) =>
  new Intl.NumberFormat("en-PK", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

const buildSmoothPath = (points) => {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const current = points[i];
    const step = current.x - prev.x;
    path += ` C ${prev.x + step / 3} ${prev.y} ${current.x - step / 3} ${current.y} ${current.x} ${current.y}`;
  }
  return path;
};

const RevenueChart = ({ series = [] }) => {
  if (!Array.isArray(series) || !series.length) {
    return (
      <div className="h-72 flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400 text-sm">
        No revenue data available yet.
      </div>
    );
  }

  const chartWidth = 760;
  const chartHeight = 320;
  const padding = { top: 22, right: 28, bottom: 52, left: 62 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const cleanedSeries = series.map((entry) => ({
    month: entry?.month || "",
    revenue: Math.max(Number(entry?.revenue) || 0, 0),
  }));

  const values = cleanedSeries.map((entry) => entry.revenue);
  const maxRevenue = Math.max(...values, 1);
  const avgRevenue = values.reduce((sum, revenue) => sum + revenue, 0) / values.length;
  const stepX = cleanedSeries.length > 1 ? plotWidth / (cleanedSeries.length - 1) : 0;
  const stemWidth = Math.min(20, Math.max(8, stepX * 0.18 || 12));

  const graphPoints = cleanedSeries.map((entry, index) => {
    const x = padding.left + index * stepX;
    const y = padding.top + plotHeight - (entry.revenue / maxRevenue) * plotHeight;
    return { ...entry, x, y };
  });

  const highestPoint = graphPoints.reduce((best, point) => (point.revenue > best.revenue ? point : best), graphPoints[0]);
  const firstRevenue = graphPoints[0]?.revenue || 0;
  const lastRevenue = graphPoints[graphPoints.length - 1]?.revenue || 0;
  const growthPct = firstRevenue > 0 ? ((lastRevenue - firstRevenue) / firstRevenue) * 100 : null;

  const linePath = buildSmoothPath(graphPoints);
  const baselineY = padding.top + plotHeight;
  const areaPath =
    graphPoints.length > 1
      ? `${linePath} L ${graphPoints[graphPoints.length - 1].x} ${baselineY} L ${graphPoints[0].x} ${baselineY} Z`
      : "";

  const yTicks = Array.from({ length: 5 }, (_, index) => {
    const ratio = index / 4;
    const y = padding.top + plotHeight * ratio;
    const value = maxRevenue * (1 - ratio);
    return { y, value, id: `tick-${index}` };
  });

  const gradientId = useId().replace(/:/g, "");
  const areaId = `revenue-area-${gradientId}`;
  const lineId = `revenue-line-${gradientId}`;
  const stemId = `revenue-stem-${gradientId}`;
  const glowId = `revenue-glow-${gradientId}`;

  return (
    <div className="relative h-80 overflow-hidden rounded-2xl border border-cyan-100 bg-gradient-to-br from-white via-cyan-50 to-sky-100 px-4 py-4 sm:px-5">
      <div className="pointer-events-none absolute -top-16 right-4 h-40 w-40 rounded-full bg-cyan-300/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-28 w-48 rounded-full bg-sky-300/20 blur-3xl" />

      <div className="relative mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Revenue Trend</div>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full border border-white/80 bg-white/70 px-2.5 py-1 text-slate-600">
            Avg {formatCompactPKR(avgRevenue)}
          </span>
          <span className="rounded-full border border-white/80 bg-white/70 px-2.5 py-1 text-slate-600">
            Peak {highestPoint?.month || "N/A"}
          </span>
          {growthPct !== null && (
            <span className={`rounded-full border px-2.5 py-1 ${growthPct >= 0 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
              {growthPct >= 0 ? "+" : ""}
              {growthPct.toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="relative h-[250px] w-full">
        <defs>
          <linearGradient id={areaId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0891b2" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#0891b2" stopOpacity="0.01" />
          </linearGradient>
          <linearGradient id={lineId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0e7490" />
            <stop offset="55%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <linearGradient id={stemId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.1" />
          </linearGradient>
          <filter id={glowId}>
            <feGaussianBlur stdDeviation="6" result="blurred" />
            <feMerge>
              <feMergeNode in="blurred" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {yTicks.map((tick) => (
          <g key={tick.id}>
            <line
              x1={padding.left}
              y1={tick.y}
              x2={chartWidth - padding.right}
              y2={tick.y}
              stroke="#cbd5e1"
              strokeWidth="1"
              strokeDasharray="4 6"
            />
            <text x={padding.left - 10} y={tick.y + 4} textAnchor="end" className="fill-slate-400 text-[10px]">
              {formatCompactPKR(tick.value)}
            </text>
          </g>
        ))}

        {graphPoints.map((point, index) => (
          <g key={`${point.month}-${index}`}>
            <rect
              x={point.x - stemWidth / 2}
              y={point.y}
              width={stemWidth}
              height={Math.max(baselineY - point.y, 2)}
              fill={`url(#${stemId})`}
              rx={stemWidth / 2}
            />
            <title>{`${point.month}: PKR ${point.revenue.toLocaleString("en-PK")}`}</title>
          </g>
        ))}

        {areaPath && <path d={areaPath} fill={`url(#${areaId})`} />}
        <path d={linePath} fill="none" stroke={`url(#${lineId})`} strokeWidth="3.2" strokeLinecap="round" filter={`url(#${glowId})`} />

        {graphPoints.map((point, index) => {
          const isPeak = point.revenue === highestPoint.revenue;
          return (
            <g key={`dot-${point.month}-${index}`}>
              <circle cx={point.x} cy={point.y} r={isPeak ? 7 : 5.5} fill="#ffffff" opacity="0.45" />
              <circle cx={point.x} cy={point.y} r={isPeak ? 4 : 3.2} fill={isPeak ? "#0f766e" : "#1d4ed8"} />
            </g>
          );
        })}

        {graphPoints.map((point, index) => (
          <text
            key={`month-${point.month}-${index}`}
            x={point.x}
            y={chartHeight - 16}
            textAnchor="middle"
            className="fill-slate-500 text-[11px]"
          >
            {(point.month || "").slice(0, 3)}
          </text>
        ))}
      </svg>
    </div>
  );
};

export default RevenueChart;
