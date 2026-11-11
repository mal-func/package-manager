import { Cell, Pie, PieChart as RechartsPieChart, Tooltip } from "recharts";

import { ChartContainer } from "./ChartContainer";
import { DEFAULT_CHART_COLORS } from "./chartSeries";

interface PieChartProps<T extends object> {
  data: T[];
  nameKey: Extract<keyof T, string>;
  valueKey: Extract<keyof T, string>;
  title?: string;
  height?: number;
  colors?: string[];
  /** e.g. "55%" for a donut; 0 (default) for a solid pie. */
  innerRadius?: number | string;
}

export function PieChart<T extends object>({
  data,
  nameKey,
  valueKey,
  title,
  height,
  colors = DEFAULT_CHART_COLORS,
  innerRadius = 0,
}: PieChartProps<T>) {
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
      <RechartsPieChart>
        <Pie data={data} dataKey={valueKey} nameKey={nameKey} innerRadius={innerRadius} outerRadius="80%" paddingAngle={innerRadius ? 2 : 0}>
          {data.map((_, index) => (
            <Cell key={index} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip />
      </RechartsPieChart>
    </ChartContainer>
  );
}
