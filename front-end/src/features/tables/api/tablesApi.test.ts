import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api", () => ({ apiClient: { get: vi.fn() } }));

const { apiClient } = await import("@/api");
const { tablesApi } = await import("./tablesApi");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("tablesApi.listTableDatasets", () => {
  it("gets /demo/tables", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ datasets: [] });

    await tablesApi.listTableDatasets();

    expect(apiClient.get).toHaveBeenCalledWith("/demo/tables");
  });
});
