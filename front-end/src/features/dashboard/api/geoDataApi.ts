import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";

import { apiClient } from "@/api";

export interface IndiaDistrictProperties {
  district: string;
  dt_code: string;
  st_nm: string;
  st_code: string;
}

export interface StateMetric {
  id: string;
  stateCode: string;
  stateName: string;
  projectCount: number;
  activityIntensity: number;
}

/**
 * Static India district-boundary GeoJSON served from public/ — 735
 * districts across all 36 states/UTs, sourced from geoBoundaries'
 * government-derived ADM2 layer (lgdirectory.gov.in via Pathways Data,
 * https://www.geoboundaries.org), lightly simplified (~25%, ~116
 * points/district on average) to keep real coastline/border detail
 * while staying a reasonable download. Served from public/ rather than
 * bundled so it never touches the JS bundle. District-level detail is
 * used (rather than a dissolved state outline) specifically so state
 * AND district borders both render exactly.
 */
export const geoDataApi = {
  async listIndiaDistricts(): Promise<FeatureCollection<Polygon | MultiPolygon, IndiaDistrictProperties>> {
    const response = await fetch("/data/india-districts.geojson");
    if (!response.ok) {
      throw new Error(`Failed to load India district boundaries: ${String(response.status)}`);
    }
    return (await response.json()) as FeatureCollection<Polygon | MultiPolygon, IndiaDistrictProperties>;
  },

  /** A "world rectangle minus India" polygon, used to hide everything outside India's borders. */
  async listIndiaMask(): Promise<FeatureCollection> {
    const response = await fetch("/data/india-mask.geojson");
    if (!response.ok) {
      throw new Error(`Failed to load India mask: ${String(response.status)}`);
    }
    return (await response.json()) as FeatureCollection;
  },

  /** Per-state demo metrics — real data from the backend/database, not generated client-side. */
  async listStateMetrics(): Promise<StateMetric[]> {
    const { states } = await apiClient.get<{ states: StateMetric[] }>("/demo/map/states");
    return states;
  },
};

export type IndiaDistrictFeature = Feature<Polygon | MultiPolygon, IndiaDistrictProperties>;
