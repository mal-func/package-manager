import { prisma } from "../lib/prisma.js";

/**
 * All direct Prisma access for the template's demo/showcase data (maps,
 * chart gallery, table gallery). Read-only from the API's perspective —
 * only prisma/seed.ts writes this data.
 */
export const demoRepository = {
  findAllStateMetrics() {
    return prisma.demoStateMetric.findMany({ orderBy: { stateName: "asc" } });
  },

  findAllChartDatasets(chartType?: string) {
    return prisma.demoChartDataset.findMany({
      where: chartType ? { chartType } : undefined,
      include: { points: { orderBy: { sortOrder: "asc" } } },
      orderBy: { title: "asc" },
    });
  },

  findAllTableDatasets() {
    return prisma.demoTableDataset.findMany({
      include: { rows: { orderBy: { sortOrder: "asc" } } },
      orderBy: { title: "asc" },
    });
  },
};
