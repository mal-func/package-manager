import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    demoStateMetric: { findMany: vi.fn() },
    demoChartDataset: { findMany: vi.fn() },
    demoTableDataset: { findMany: vi.fn() },
  },
}));

const { prisma } = await import("../lib/prisma.js");
const { demoRepository } = await import("./demo.repository.js");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("demoRepository.findAllStateMetrics", () => {
  it("orders state metrics alphabetically by name", async () => {
    vi.mocked(prisma.demoStateMetric.findMany).mockResolvedValue([] as never);

    await demoRepository.findAllStateMetrics();

    expect(prisma.demoStateMetric.findMany).toHaveBeenCalledWith({ orderBy: { stateName: "asc" } });
  });
});

describe("demoRepository.findAllChartDatasets", () => {
  it("returns every chart type, with points ordered, when no filter is given", async () => {
    vi.mocked(prisma.demoChartDataset.findMany).mockResolvedValue([] as never);

    await demoRepository.findAllChartDatasets();

    expect(prisma.demoChartDataset.findMany).toHaveBeenCalledWith({
      where: undefined,
      include: { points: { orderBy: { sortOrder: "asc" } } },
      orderBy: { title: "asc" },
    });
  });

  it("filters by chartType when one is given", async () => {
    vi.mocked(prisma.demoChartDataset.findMany).mockResolvedValue([] as never);

    await demoRepository.findAllChartDatasets("bar");

    expect(prisma.demoChartDataset.findMany).toHaveBeenCalledWith({
      where: { chartType: "bar" },
      include: { points: { orderBy: { sortOrder: "asc" } } },
      orderBy: { title: "asc" },
    });
  });
});

describe("demoRepository.findAllTableDatasets", () => {
  it("returns table datasets with rows ordered by sortOrder", async () => {
    vi.mocked(prisma.demoTableDataset.findMany).mockResolvedValue([] as never);

    await demoRepository.findAllTableDatasets();

    expect(prisma.demoTableDataset.findMany).toHaveBeenCalledWith({
      include: { rows: { orderBy: { sortOrder: "asc" } } },
      orderBy: { title: "asc" },
    });
  });
});
