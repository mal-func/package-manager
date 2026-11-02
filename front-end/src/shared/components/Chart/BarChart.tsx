import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartContainer } from "./ChartContainer";
import { DEFAULT_CHART_COLORS, type ChartSeries } from "./chartSeries";

interface BarChartProps<T extends object> {
  data: T[];
  xKey: Extract<keyof T, string>;
  /** One bar per series, grouped side by side (or stacked when `stacked` is set). */
  series: ChartSeries<T>[];
  title?: string;
  height?: number;
  /** Stack series on top of each other instead of grouping them side by side. */
  stacked?: boolean;
}

export function BarChart<T extends object>({ data, xKey, series, title, height, stacked = false }: BarChartProps<T>) {
  return (
    <ChartContainer title={title} height={height}>
      <RechartsBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
        <Tooltip />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {series.map((s, index) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.name ?? s.key}
            fill={s.color ?? DEFAULT_CHART_COLORS[index % DEFAULT_CHART_COLORS.length]}
            radius={stacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
            stackId={stacked ? "stack" : undefined}
          />
        ))}
      </RechartsBarChart>
    </ChartContainer>
  );
}
