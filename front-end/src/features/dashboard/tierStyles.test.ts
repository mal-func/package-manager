import { describe, expect, it } from "vitest";

import { getHeatmapColor, getProjectCountTier } from "./tierStyles";

describe("getProjectCountTier", () => {
  it.each([
    [0, "none"],
    [1, "veryLow"],
    [4, "veryLow"],
    [5, "low"],
    [19, "low"],
    [20, "medium"],
    [49, "medium"],
    [50, "high"],
    [99, "high"],
    [100, "veryHigh"],
    [1000, "veryHigh"],
  ] as const)("buckets a count of %i into tier %s", (count, tier) => {
    expect(getProjectCountTier(count)).toBe(tier);
  });
});

describe("getHeatmapColor", () => {
  it("returns the low-end (blue) color at value 0", () => {
    expect(getHeatmapColor(0, 100)).toBe("rgb(37, 99, 235)");
  });

  it("returns the high-end (red) color at the max value", () => {
    expect(getHeatmapColor(100, 100)).toBe("rgb(239, 68, 68)");
  });

  it("interpolates a mid-scale color at the midpoint", () => {
    expect(getHeatmapColor(50, 100)).toBe("rgb(74, 222, 128)");
  });

  it("clamps values above the max to the high-end color", () => {
    expect(getHeatmapColor(500, 100)).toBe(getHeatmapColor(100, 100));
  });

  it("clamps negative values to the low-end color", () => {
    expect(getHeatmapColor(-50, 100)).toBe(getHeatmapColor(0, 100));
  });

  it("treats a zero max value as the low end, without dividing by zero", () => {
    expect(getHeatmapColor(10, 0)).toBe("rgb(37, 99, 235)");
  });
});
