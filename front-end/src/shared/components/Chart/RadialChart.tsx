import { Cell, RadialBar, RadialBarChart as RechartsRadialBarChart, Tooltip } from "recharts";

import { ChartContainer } from "./ChartContainer";
import { DEFAULT_CHART_COLORS } from "./chartSeries";

interface RadialChartProps<T extends object> {
  data: T[];
  nameKey: Extract<keyof T, string>;
  valueKey: Extract<keyof T, string>;
  title?: string;
  height?: number;
  colors?: string[];
}

/**
 * Concentric rings, one per row — e.g. percentage-complete per team.
 * Recharts' RadialBar legend binding is awkward for per-row labels, so
 * the name/color key is rendered as a plain swatch list under the
 * chart instead of via recharts' <Legend>.
 */
export function RadialChart<T extends object>({
  data,
  nameKey,
  valueKey,
  title,
  height,
  colors = DEFAULT_CHART_COLORS,
}: RadialChartProps<T>) {
  return (
    <ChartContainer
      title={title}
      height={height}
      footer={
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {data.map((row, index) => (
            <span key={index} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              {String(row[nameKey])} — {String(row[valueKey])}
            </span>
          ))}
        </div>
      }
    >
      <RechartsRadialBarChart data={data} innerRadius="25%" outerRadius="100%" startAngle={90} endAngle={-270}>
        <RadialBar dataKey={valueKey} background cornerRadius={6}>
          {data.map((_, index) => (
            <Cell key={index} fill={colors[index % colors.length]} />
          ))}
        </RadialBar>
        <Tooltip />
      </RechartsRadialBarChart>
    </ChartContainer>
  );
}
