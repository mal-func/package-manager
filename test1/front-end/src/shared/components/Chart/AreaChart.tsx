import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartContainer } from "./ChartContainer";
import { DEFAULT_CHART_COLORS, type ChartSeries } from "./chartSeries";

interface AreaChartProps<T extends object> {
  data: T[];
  xKey: Extract<keyof T, string>;
  /** One area per series. */
  series: ChartSeries<T>[];
  title?: string;
  height?: number;
  /** Stack series on top of each other instead of overlapping them. */
  stacked?: boolean;
}

export function AreaChart<T extends object>({ data, xKey, series, title, height, stacked = false }: AreaChartProps<T>) {
  return (
    <ChartContainer title={title} height={height}>
      <RechartsAreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
        <Tooltip />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {series.map((s, index) => {
          const color = s.color ?? DEFAULT_CHART_COLORS[index % DEFAULT_CHART_COLORS.length];
          return (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name ?? s.key}
              stroke={color}
              fill={color}
              fillOpacity={0.15}
              stackId={stacked ? "stack" : undefined}
            />
          );
        })}
      </RechartsAreaChart>
    </ChartContainer>
  );
}
