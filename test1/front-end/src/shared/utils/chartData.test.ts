import { describe, expect, it } from "vitest";

import { pivotChartPoints } from "./chartData";

describe("pivotChartPoints", () => {
  it("collapses single-series points (no series value) into a single 'value' column", () => {
    const result = pivotChartPoints([
      { label: "Jan", value: 100 },
      { label: "Feb", value: 200 },
    ]);

    expect(result.seriesKeys).toEqual(["value"]);
    expect(result.rows).toEqual([
      { label: "Jan", value: 100 },
      { label: "Feb", value: 200 },
    ]);
  });

  it("pivots multi-series points into one column per series, keyed by label", () => {
    const result = pivotChartPoints([
      { label: "Jan", series: "Revenue", value: 100 },
      { label: "Jan", series: "Cost", value: 40 },
      { label: "Feb", series: "Revenue", value: 150 },
      { label: "Feb", series: "Cost", value: 60 },
    ]);

    expect(result.seriesKeys).toEqual(["Revenue", "Cost"]);
    expect(result.rows).toEqual([
      { label: "Jan", Revenue: 100, Cost: 40 },
      { label: "Feb", Revenue: 150, Cost: 60 },
    ]);
  });

  it("preserves the first-seen order of series keys", () => {
    const result = pivotChartPoints([
      { label: "Q1", series: "West", value: 1 },
      { label: "Q1", series: "East", value: 2 },
      { label: "Q1", series: "North", value: 3 },
    ]);

    expect(result.seriesKeys).toEqual(["West", "East", "North"]);
  });

  it("treats an empty points array as single-series with no rows", () => {
    const result = pivotChartPoints([]);

    expect(result).toEqual({ rows: [], seriesKeys: ["value"] });
  });

  it("falls back to a 'value' series key when only some points carry a null series", () => {
    const result = pivotChartPoints([
      { label: "Jan", series: "Revenue", value: 100 },
      { label: "Jan", series: null, value: 5 },
    ]);

    expect(result.seriesKeys).toContain("value");
    expect(result.rows[0]).toMatchObject({ Revenue: 100, value: 5 });
  });
});
