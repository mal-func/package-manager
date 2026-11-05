import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api", () => ({ apiClient: { get: vi.fn() } }));

const { apiClient } = await import("@/api");
const { graphsApi } = await import("./graphsApi");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("graphsApi.listChartDatasets", () => {
  it("gets /demo/charts", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ datasets: [] });

    await graphsApi.listChartDatasets();

    expect(apiClient.get).toHaveBeenCalledWith("/demo/charts");
  });
});
