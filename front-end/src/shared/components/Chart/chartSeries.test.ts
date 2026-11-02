import { describe, expect, it } from "vitest";

import { DEFAULT_CHART_COLORS } from "./chartSeries";

describe("DEFAULT_CHART_COLORS", () => {
  it("provides at least one color per brand accent, all valid hex codes", () => {
    expect(DEFAULT_CHART_COLORS.length).toBeGreaterThanOrEqual(5);
    for (const color of DEFAULT_CHART_COLORS) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("has no duplicate colors", () => {
    expect(new Set(DEFAULT_CHART_COLORS).size).toBe(DEFAULT_CHART_COLORS.length);
  });
});
