import React from "react";

const RevenueChart = ({ series = [] }) => {
  if (!Array.isArray(series) || !series.length) {
    return (
      <div className="h-56 flex items-center justify-center text-slate-400 text-sm">
        No revenue data available yet.
      </div>
    );
  }

  const chartWidth = 720;
  const chartHeight = 240;
  const padding = { top: 16, right: 16, bottom: 38, left: 44 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const maxRevenue = Math.max(...series.map((point) => Number(point?.revenue) || 0), 1);
  const stepX = series.length > 1 ? plotWidth / (series.length - 1) : 0;
  const barWidth = Math.min(54, Math.max(18, stepX * 0.55 || 30));

  const graphPoints = series.map((point, index) => {
    const revenue = Number(point?.revenue) || 0;
    const x = padding.left + index * stepX;
    const y = padding.top + plotHeight - (revenue / maxRevenue) * plotHeight;
    return { x, y, revenue, month: point?.month || "" };
  });

  const linePoints = graphPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const areaPoints = `${padding.left},${padding.top + plotHeight} ${linePoints} ${
    padding.left + (series.length - 1) * stepX
  },${padding.top + plotHeight}`;

  return (
    <div className="h-56">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
        <defs>
          <linearGradient id="revenueArea" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.12" />
          </linearGradient>
        </defs>

        {[0, 1, 2, 3, 4].map((tick) => {
          const y = padding.top + (plotHeight / 4) * tick;
          return <line key={tick} x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="#e2e8f0" strokeWidth="1" />;
        })}

        {graphPoints.map((point, index) => {
          const x = point.x - barWidth / 2;
          const height = padding.top + plotHeight - point.y;
          return (
            <rect
              key={`bar-${point.month}-${index}`}
              x={x}
              y={point.y}
              width={barWidth}
              height={Math.max(height, 1)}
              fill="#bae6fd"
              opacity="0.55"
              rx="5"
            />
          );
        })}

        <polygon points={areaPoints} fill="url(#revenueArea)" />
        <polyline fill="none" stroke="#0284c7" strokeWidth="3" points={linePoints} />

        {graphPoints.map((point, index) => (
          <circle key={`dot-${point.month}-${index}`} cx={point.x} cy={point.y} r="4.2" fill="#0369a1" />
        ))}
      </svg>

      <div className="mt-2 grid grid-cols-3 sm:grid-cols-6 gap-1 text-[11px] text-slate-500">
        {graphPoints.map((point, index) => (
          <div key={`${point.month}-${index}`} className="truncate text-center">
            {point.month}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RevenueChart;
