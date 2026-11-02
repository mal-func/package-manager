import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api", () => ({ apiClient: { get: vi.fn() } }));

const { apiClient } = await import("@/api");
const { geoDataApi } = await import("./geoDataApi");

const featureCollection = { type: "FeatureCollection", features: [] };

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("geoDataApi.listIndiaDistricts", () => {
  it("fetches and parses the static district GeoJSON", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(featureCollection), { status: 200 }));

    await expect(geoDataApi.listIndiaDistricts()).resolves.toEqual(featureCollection);
    expect(fetch).toHaveBeenCalledWith("/data/india-districts.geojson");
  });

  it("throws a descriptive error when the fetch response isn't ok", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 404 }));

    await expect(geoDataApi.listIndiaDistricts()).rejects.toThrow(/Failed to load India district boundaries: 404/);
  });
});

describe("geoDataApi.listIndiaMask", () => {
  it("fetches and parses the static mask GeoJSON", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(featureCollection), { status: 200 }));

    await expect(geoDataApi.listIndiaMask()).resolves.toEqual(featureCollection);
    expect(fetch).toHaveBeenCalledWith("/data/india-mask.geojson");
  });

  it("throws a descriptive error when the fetch response isn't ok", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 500 }));

    await expect(geoDataApi.listIndiaMask()).rejects.toThrow(/Failed to load India mask: 500/);
  });
});

describe("geoDataApi.listStateMetrics", () => {
  it("gets /demo/map/states and unwraps the states array", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ states: [{ id: "1" }] });

    await expect(geoDataApi.listStateMetrics()).resolves.toEqual([{ id: "1" }]);
    expect(apiClient.get).toHaveBeenCalledWith("/demo/map/states");
  });
});
