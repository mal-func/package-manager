import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request } from "express";

import { createMockRequest, createMockResponse } from "../test-utils/expressMocks.js";

vi.mock("../services/demo.service.js", () => ({
  demoService: {
    listStateMetrics: vi.fn(),
    listChartDatasets: vi.fn(),
    listTableDatasets: vi.fn(),
  },
}));

const { demoService } = await import("../services/demo.service.js");
const { listChartDatasets, listStateMetrics, listTableDatasets } = await import("./demo.controller.js");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listStateMetrics", () => {
  it("wraps the service result under a `states` key and returns 200", async () => {
    vi.mocked(demoService.listStateMetrics).mockResolvedValue([{ stateCode: "07" }] as never);
    const res = createMockResponse();

    await listStateMetrics(createMockRequest(), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { states: [{ stateCode: "07" }] } });
  });
});

describe("listChartDatasets", () => {
  it("passes the `type` query param through to the service", async () => {
    vi.mocked(demoService.listChartDatasets).mockResolvedValue([]);
    const req = createMockRequest({ query: { type: "bar" } } as Partial<Request>);
    const res = createMockResponse();

    await listChartDatasets(req, res);

    expect(demoService.listChartDatasets).toHaveBeenCalledWith("bar");
  });

  it("passes undefined when there is no `type` query param", async () => {
    vi.mocked(demoService.listChartDatasets).mockResolvedValue([]);
    const req = createMockRequest({ query: {} } as Partial<Request>);
    const res = createMockResponse();

    await listChartDatasets(req, res);

    expect(demoService.listChartDatasets).toHaveBeenCalledWith(undefined);
  });

  it("ignores a non-string `type` query param (e.g. an array from repeated query keys)", async () => {
    vi.mocked(demoService.listChartDatasets).mockResolvedValue([]);
    const req = createMockRequest({ query: { type: ["bar", "line"] } } as unknown as Partial<Request>);
    const res = createMockResponse();

    await listChartDatasets(req, res);

    expect(demoService.listChartDatasets).toHaveBeenCalledWith(undefined);
  });
});

describe("listTableDatasets", () => {
  it("wraps the service result under a `datasets` key and returns 200", async () => {
    vi.mocked(demoService.listTableDatasets).mockResolvedValue([{ slug: "orders" }] as never);
    const res = createMockResponse();

    await listTableDatasets(createMockRequest(), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { datasets: [{ slug: "orders" }] } });
  });
});
