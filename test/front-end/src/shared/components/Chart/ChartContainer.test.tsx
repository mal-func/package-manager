import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { ChartContainer } from "./ChartContainer";

describe("ChartContainer", () => {
  it("renders the title when given", () => {
    render(
      <ChartContainer title="Monthly Revenue">
        <svg />
      </ChartContainer>,
    );

    expect(screen.getByRole("heading", { name: "Monthly Revenue" })).toBeInTheDocument();
  });

  it("renders no heading when no title is given", () => {
    const { container } = render(
      <ChartContainer>
        <svg />
      </ChartContainer>,
    );

    expect(container.querySelector("h3")).not.toBeInTheDocument();
  });

  it("renders footer content below the chart when given", () => {
    render(
      <ChartContainer footer={<p>Legend content</p>}>
        <svg />
      </ChartContainer>,
    );

    expect(screen.getByText("Legend content")).toBeInTheDocument();
  });

  it("renders the ResponsiveContainer wrapper regardless of props", () => {
    const { container } = render(
      <ChartContainer>
        <svg />
      </ChartContainer>,
    );

    expect(container.querySelector(".recharts-responsive-container")).toBeInTheDocument();
  });
});
