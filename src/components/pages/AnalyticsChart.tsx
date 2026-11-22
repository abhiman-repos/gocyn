"use client";

import { useState, useMemo, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, BarChart3, AreaChart as AreaChartIcon } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────

export type Period = "7d" | "30d" | "3m" | "1y";
export type ChartType = "line" | "bar" | "area";

export interface Metric {
  key: string;
  label: string;
  color: string;
  format: (value: number) => string;
  yAxisId?: "left" | "right";
}

export interface AnalyticsChartProps {
  data: Record<string, any>[];
  metrics: Metric[];
  periodOptions?: { value: Period; label: string }[];
  defaultPeriod?: Period;
  defaultChartType?: ChartType;
  xAxisDataKey?: string;
  height?: number | string;
  loading?: boolean;
  className?: string;
}

// ─── Custom Tooltip (unchanged) ────────────────────────────────────────

function CustomTooltip({ active, payload, label, metrics }: any) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-md dark:border-gray-700 dark:bg-gray-800 sm:p-3">
      <p className="mb-1 text-[11px] font-medium text-gray-600 dark:text-gray-300 sm:mb-2 sm:text-xs">
        {label}
      </p>
      {payload.map((entry: any, idx: number) => {
        const metric = metrics.find((m: Metric) => m.key === entry.dataKey);
        if (!metric) return null;
        return (
          <div key={idx} className="flex items-center gap-1.5 text-[11px] sm:gap-2 sm:text-xs">
            <span className="h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-500 dark:text-gray-400">{metric.label}:</span>
            <span className="font-medium text-gray-800 dark:text-white">
              {metric.format(entry.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────

export default function AnalyticsChart({
  data,
  metrics,
  periodOptions = [
    { value: "7d", label: "7d" },
    { value: "30d", label: "30d" },
    { value: "3m", label: "3m" },
    { value: "1y", label: "1y" },
  ],
  defaultPeriod = "30d",
  defaultChartType = "line",
  xAxisDataKey = "label",
  height = 300,
  loading = false,
  className = "",
}: AnalyticsChartProps) {
  const [period, setPeriod] = useState<Period>(defaultPeriod);
  const [chartType, setChartType] = useState<ChartType>(defaultChartType);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const ChartComponent = useMemo(() => {
    switch (chartType) {
      case "bar":
        return BarChart;
      case "area":
        return AreaChart;
      default:
        return LineChart;
    }
  }, [chartType]);

  const DataComponent = useMemo(() => {
    switch (chartType) {
      case "bar":
        return Bar;
      case "area":
        return Area;
      default:
        return Line;
    }
  }, [chartType]);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 sm:h-8 sm:w-8" />
      </div>
    );
  }

  return (
    <div className={`flex h-full w-full flex-col ${className}`}>
      {/* Controls - responsive stacking */}
      <div className="mb-3 flex flex-col items-start justify-between gap-2 sm:mb-4 sm:flex-row sm:items-center sm:gap-3">
        {/* Chart type selector - horizontal scroll on mobile if needed */}
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-0.5 dark:border-gray-700 dark:bg-gray-800">
          <button
            onClick={() => setChartType("line")}
            className={`rounded-md p-1 transition-all sm:p-1.5 ${
              chartType === "line"
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
            title="Line chart"
          >
            <TrendingUp size={isMobile ? 14 : 16} />
          </button>
          <button
            onClick={() => setChartType("bar")}
            className={`rounded-md p-1 transition-all sm:p-1.5 ${
              chartType === "bar"
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
            title="Bar chart"
          >
            <BarChart3 size={isMobile ? 14 : 16} />
          </button>
          <button
            onClick={() => setChartType("area")}
            className={`rounded-md p-1 transition-all sm:p-1.5 ${
              chartType === "area"
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
            title="Area chart"
          >
            <AreaChartIcon size={isMobile ? 14 : 16} />
          </button>
        </div>

        {/* Period selector - wrap on mobile */}
        <div className="flex flex-wrap gap-1 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-800">
          {periodOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setPeriod(option.value)}
              className={`whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-medium transition-all sm:px-3 sm:py-1 sm:text-xs ${
                period === option.value
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart container - with min height and overflow handling */}
      <div style={{ height: typeof height === "number" ? height : height, width: "100%", minHeight: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ChartComponent data={data} margin={{ top: 10, right: isMobile ? 5 : 20, left: isMobile ? 0 : 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-800" />
            <XAxis
              dataKey={xAxisDataKey}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: isMobile ? 9 : 11, fill: "#9ca3af" }}
              dy={5}
              interval={isMobile ? "preserveStartEnd" : 0}
            />
            {metrics.map((metric, idx) => (
              <YAxis
                key={metric.key}
                yAxisId={metric.yAxisId || (idx === 0 ? "left" : "right")}
                orientation={idx === 0 ? "left" : "right"}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: isMobile ? 8 : 11, fill: "#9ca3af" }}
                tickFormatter={(v) => {
                  const formatted = metric.format(v);
                  // Trim long formatted values on mobile
                  if (isMobile && formatted.length > 6) {
                    return formatted.slice(0, 5) + "…";
                  }
                  return formatted;
                }}
                width={isMobile ? 35 : 55}
              />
            ))}
            <Tooltip content={<CustomTooltip metrics={metrics} />} />
            <Legend
              verticalAlign="top"
              align={isMobile ? "left" : "right"}
              iconType="circle"
              wrapperStyle={{
                fontSize: isMobile ? 9 : 11,
                paddingBottom: isMobile ? 8 : 12,
                left: isMobile ? 0 : undefined,
              }}
              formatter={(value) => {
                const m = metrics.find((metric) => metric.key === value);
                return m ? (isMobile ? m.label.slice(0, 12) : m.label) : value;
              }}
            />
            {metrics.map((metric) => (
              <DataComponent
                key={metric.key}
                yAxisId={metric.yAxisId || (metrics.indexOf(metric) === 0 ? "left" : "right")}
                type="monotone"
                dataKey={metric.key}
                stroke={metric.color}
                fill={chartType === "area" ? metric.color : undefined}
                fillOpacity={chartType === "area" ? 0.2 : undefined}
                strokeWidth={isMobile ? 2 : 2.5}
                dot={false} // Disable dots on mobile for cleaner look
                activeDot={{ r: isMobile ? 4 : 5 }}
                barSize={chartType === "bar" ? (isMobile ? 20 : 30) : undefined}
              />
            ))}
          </ChartComponent>
        </ResponsiveContainer>
      </div>
    </div>
  );
}