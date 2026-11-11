import { apiClient } from "@/api";

export interface DemoChartPoint {
  label: string;
  series: string | null;
  value: number;
}

export interface DemoChartDataset {
  id: string;
  slug: string;
  title: string;
  chartType: string;
  description: string | null;
  points: DemoChartPoint[];
}

/**
 * Deliberately independent from Charts'/Tables' API modules — features
 * must never depend on each other directly. All three simply call the
 * same public backend endpoint, which is a platform-level contract, not
 * a frontend feature dependency.
 */
export const graphsApi = {
  listChartDatasets(): Promise<{ datasets: DemoChartDataset[] }> {
    return apiClient.get<{ datasets: DemoChartDataset[] }>("/demo/charts");
  },
};
