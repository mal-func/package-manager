import {
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartContainer } from "./ChartContainer";
import { DEFAULT_CHART_COLORS, type ChartSeries } from "./chartSeries";

interface LineChartProps<T extends object> {
  data: T[];
  xKey: Extract<keyof T, string>;
  /** One line per series. */
  series: ChartSeries<T>[];
  title?: string;
  height?: number;
}

export function LineChart<T extends object>({ data, xKey, series, title, height }: LineChartProps<T>) {
  return (
    <ChartContainer title={title} height={height}>
      <RechartsLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
        <Tooltip />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {series.map((s, index) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name ?? s.key}
            stroke={s.color ?? DEFAULT_CHART_COLORS[index % DEFAULT_CHART_COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        ))}
      </RechartsLineChart>
    </ChartContainer>
  );
}
