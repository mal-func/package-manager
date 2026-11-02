import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api", () => ({ apiClient: { get: vi.fn() } }));

const { apiClient } = await import("@/api");
const { chartsApi } = await import("./chartsApi");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("chartsApi.listChartDatasets", () => {
  it("gets /demo/charts", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ datasets: [] });

    await chartsApi.listChartDatasets();

    expect(apiClient.get).toHaveBeenCalledWith("/demo/charts");
  });
});
