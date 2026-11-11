import { describe, expect, it } from "vitest";

import { generateOverviewStats } from "./overviewStats";

describe("generateOverviewStats", () => {
  it("returns exactly the three expected stats, in a stable order", () => {
    const stats = generateOverviewStats();

    expect(stats.map((s) => s.label)).toEqual(["Total Projects", "Active Users", "Total Requests"]);
  });

  it("is deterministic across calls (seeded, not truly random)", () => {
    expect(generateOverviewStats()).toEqual(generateOverviewStats());
  });

  it("produces positive integer values and trend percentages", () => {
    for (const stat of generateOverviewStats()) {
      expect(Number.isInteger(stat.value)).toBe(true);
      expect(stat.value).toBeGreaterThan(0);
      expect(Number.isInteger(stat.trendPercent)).toBe(true);
      expect(stat.trendPercent).toBeGreaterThanOrEqual(4);
    }
  });
});
