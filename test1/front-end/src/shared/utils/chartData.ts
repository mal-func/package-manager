export interface ChartPoint {
  label: string;
  series?: string | null;
  value: number;
}

export interface PivotedChartData {
  rows: Record<string, string | number>[];
  seriesKeys: string[];
}

/**
 * Turns flat {label, series, value} points (the shape the demo chart API
 * returns) into rows keyed by label with one column per series, plus the
 * ordered list of series keys — the shape BarChart/LineChart/AreaChart's
 * `series` prop expects. Single-series datasets (no point carries a
 * `series` value) collapse to a single "value" column.
 */
export function pivotChartPoints(points: ChartPoint[]): PivotedChartData {
  const isMultiSeries = points.some((point) => Boolean(point.series));
  if (!isMultiSeries) {
    return {
      rows: points.map((point) => ({ label: point.label, value: point.value })),
      seriesKeys: ["value"],
    };
  }

  const seriesKeys: string[] = [];
  const rowsByLabel = new Map<string, Record<string, string | number>>();

  for (const point of points) {
    const seriesKey = point.series ?? "value";
    if (!seriesKeys.includes(seriesKey)) seriesKeys.push(seriesKey);

    const row = rowsByLabel.get(point.label) ?? { label: point.label };
    row[seriesKey] = point.value;
    rowsByLabel.set(point.label, row);
  }

  return { rows: Array.from(rowsByLabel.values()), seriesKeys };
}
