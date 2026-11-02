import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../repositories/demo.repository.js", () => ({
  demoRepository: {
    findAllStateMetrics: vi.fn(),
    findAllChartDatasets: vi.fn(),
    findAllTableDatasets: vi.fn(),
  },
}));

const { demoRepository } = await import("../repositories/demo.repository.js");
const { demoService } = await import("./demo.service.js");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("demoService.listStateMetrics", () => {
  it("passes the repository result straight through", async () => {
    const metrics = [{ stateCode: "07", stateName: "Delhi", projectCount: 10, activityIntensity: 50 }];
    vi.mocked(demoRepository.findAllStateMetrics).mockResolvedValue(metrics as never);

    await expect(demoService.listStateMetrics()).resolves.toEqual(metrics);
  });
});

describe("demoService.listChartDatasets", () => {
  it("forwards the chartType filter to the repository", async () => {
    vi.mocked(demoRepository.findAllChartDatasets).mockResolvedValue([]);

    await demoService.listChartDatasets("bar");

    expect(demoRepository.findAllChartDatasets).toHaveBeenCalledWith("bar");
  });

  it("flattens each dataset's points, dropping internal ids/sortOrder", async () => {
    vi.mocked(demoRepository.findAllChartDatasets).mockResolvedValue([
      {
        id: "d1",
        slug: "monthly-revenue",
        title: "Monthly Revenue",
        chartType: "bar",
        description: "desc",
        points: [
          { id: "p1", datasetId: "d1", label: "Jan", series: null, value: 100, sortOrder: 0 },
          { id: "p2", datasetId: "d1", label: "Feb", series: null, value: 200, sortOrder: 1 },
        ],
      },
    ] as never);

    const result = await demoService.listChartDatasets();

    expect(result).toEqual([
      {
        id: "d1",
        slug: "monthly-revenue",
        title: "Monthly Revenue",
        chartType: "bar",
        description: "desc",
        points: [
          { label: "Jan", series: null, value: 100 },
          { label: "Feb", series: null, value: 200 },
        ],
      },
    ]);
  });
});

describe("demoService.listTableDatasets", () => {
  it("flattens each dataset's rows down to their raw `data` payload", async () => {
    vi.mocked(demoRepository.findAllTableDatasets).mockResolvedValue([
      {
        id: "t1",
        slug: "orders",
        title: "Orders",
        description: "desc",
        rows: [
          { id: "r1", datasetId: "t1", sortOrder: 0, data: { orderId: "ORD-1000", amount: 500 } },
        ],
      },
    ] as never);

    const result = await demoService.listTableDatasets();

    expect(result).toEqual([
      {
        id: "t1",
        slug: "orders",
        title: "Orders",
        description: "desc",
        rows: [{ orderId: "ORD-1000", amount: 500 }],
      },
    ]);
  });
});
