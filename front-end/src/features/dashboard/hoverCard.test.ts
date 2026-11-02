import { describe, expect, it } from "vitest";

import { buildHoverCard } from "./hoverCard";

describe("buildHoverCard", () => {
  it("includes the title", () => {
    const html = buildHoverCard("Maharashtra", [["Projects", "42"]]);

    expect(html).toContain("Maharashtra");
  });

  it("renders one row per [label, value] pair, in order", () => {
    const html = buildHoverCard("Delhi", [["District", "New Delhi"], ["Projects", "10"]]);

    expect(html).toContain("District");
    expect(html).toContain("New Delhi");
    expect(html).toContain("Projects");
    expect(html).toContain("10");
    expect(html.indexOf("District")).toBeLessThan(html.indexOf("Projects"));
  });

  it("renders no rows for an empty row list", () => {
    const html = buildHoverCard("Empty State", []);

    expect(html).toContain("Empty State");
    expect(html).not.toContain("undefined");
  });
});
