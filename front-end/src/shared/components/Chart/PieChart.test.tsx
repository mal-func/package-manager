import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { PieChart } from "./PieChart";

const data = [
  { category: "Product A", share: 40 },
  { category: "Product B", share: 60 },
];

describe("PieChart", () => {
  it("renders a legend swatch with the label and value for every row", () => {
    render(<PieChart data={data} nameKey="category" valueKey="share" title="Market Share" />);

    expect(screen.getByText("Product A — 40")).toBeInTheDocument();
    expect(screen.getByText("Product B — 60")).toBeInTheDocument();
  });

  it("cycles through the given colors, wrapping around when there are more rows than colors", () => {
    const { container } = render(
      <PieChart data={data} nameKey="category" valueKey="share" colors={["#111111"]} />,
    );

    const swatches = container.querySelectorAll(".mt-3 span > span");
    expect(swatches).toHaveLength(2);
    swatches.forEach((swatch) => {
      expect((swatch as HTMLElement).style.backgroundColor).toBe("rgb(17, 17, 17)");
    });
  });

  it("renders without crashing as a donut (innerRadius set)", () => {
    const { container } = render(
      <PieChart data={data} nameKey="category" valueKey="share" innerRadius="55%" />,
    );

    expect(container.querySelector(".recharts-responsive-container")).toBeInTheDocument();
  });
});
