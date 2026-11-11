import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./httpClient", () => ({
  httpClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const { httpClient } = await import("./httpClient");
const { apiClient } = await import("./apiClient");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("apiClient", () => {
  it("get() unwraps the envelope's inner data", async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: { success: true, data: { hello: "world" } } });

    const result = await apiClient.get("/thing");

    expect(httpClient.get).toHaveBeenCalledWith("/thing");
    expect(result).toEqual({ hello: "world" });
  });

  it("get() forwards params as an axios query-string config when given", async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: { success: true, data: { hello: "world" } } });

    await apiClient.get("/thing", { limit: 5, offset: 10 });

    expect(httpClient.get).toHaveBeenCalledWith("/thing", { params: { limit: 5, offset: 10 } });
  });

  it("post() forwards the body and unwraps the envelope", async () => {
    vi.mocked(httpClient.post).mockResolvedValue({ data: { success: true, data: { id: "1" } } });

    const result = await apiClient.post("/thing", { name: "x" });

    expect(httpClient.post).toHaveBeenCalledWith("/thing", { name: "x" });
    expect(result).toEqual({ id: "1" });
  });

  it("put() forwards the body and unwraps the envelope", async () => {
    vi.mocked(httpClient.put).mockResolvedValue({ data: { success: true, data: { updated: true } } });

    const result = await apiClient.put("/thing/1", { name: "y" });

    expect(httpClient.put).toHaveBeenCalledWith("/thing/1", { name: "y" });
    expect(result).toEqual({ updated: true });
  });

  it("patch() forwards the body and unwraps the envelope", async () => {
    vi.mocked(httpClient.patch).mockResolvedValue({ data: { success: true, data: { patched: true } } });

    const result = await apiClient.patch("/thing/1", { name: "z" });

    expect(httpClient.patch).toHaveBeenCalledWith("/thing/1", { name: "z" });
    expect(result).toEqual({ patched: true });
  });

  it("delete() unwraps the envelope", async () => {
    vi.mocked(httpClient.delete).mockResolvedValue({ data: { success: true, data: null } });

    const result = await apiClient.delete("/thing/1");

    expect(httpClient.delete).toHaveBeenCalledWith("/thing/1");
    expect(result).toBeNull();
  });
});
