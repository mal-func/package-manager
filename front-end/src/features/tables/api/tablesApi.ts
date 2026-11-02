import { apiClient } from "@/api";

export interface DemoTableDataset {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  rows: Record<string, unknown>[];
}

/**
 * Deliberately independent from Graphs'/Charts' API modules — features
 * must never depend on each other directly. All three simply call the
 * same public backend endpoint, which is a platform-level contract, not
 * a frontend feature dependency.
 */
export const tablesApi = {
  listTableDatasets(): Promise<{ datasets: DemoTableDataset[] }> {
    return apiClient.get<{ datasets: DemoTableDataset[] }>("/demo/tables");
  },
};
