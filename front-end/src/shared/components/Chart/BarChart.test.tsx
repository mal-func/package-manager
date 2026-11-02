import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import { BarChart } from "./BarChart";

const data = [
  { month: "Jan", revenue: 100, cost: 40 },
  { month: "Feb", revenue: 150, cost: 60 },
];

describe("BarChart", () => {
  it("renders without crashing for a single series", () => {
    const { container } = render(
      <BarChart data={data} xKey="month" series={[{ key: "revenue" }]} title="Revenue" />,
    );

    expect(container.querySelector(".recharts-responsive-container")).toBeInTheDocument();
  });

  it("renders without crashing for multiple series, stacked", () => {
    const { container } = render(
      <BarChart
        data={data}
        xKey="month"
        series={[{ key: "revenue", name: "Revenue" }, { key: "cost", name: "Cost", color: "#123456" }]}
        stacked
      />,
    );

    expect(container.querySelector(".recharts-responsive-container")).toBeInTheDocument();
  });

  it("renders with an empty dataset without crashing", () => {
    const { container } = render(<BarChart data={[]} xKey="month" series={[{ key: "revenue" }]} />);

    expect(container.querySelector(".recharts-responsive-container")).toBeInTheDocument();
  });
});
