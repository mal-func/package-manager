/** One drawn series (a bar/line/area) within a chart — one dataset key per series. */
export interface ChartSeries<T extends object> {
  key: Extract<keyof T, string>;
  name?: string;
  color?: string;
}

/** Matches the brand palette in globals.css's @theme block (primary + 4 logo accents). */
export const DEFAULT_CHART_COLORS = ["#c10003", "#00a5f1", "#25b146", "#fc7f2d", "#fbc200"];
