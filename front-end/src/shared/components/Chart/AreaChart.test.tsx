import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import { AreaChart } from "./AreaChart";

const data = [
  { month: "Jan", total: 200 },
  { month: "Feb", total: 500 },
];

describe("AreaChart", () => {
  it("renders without crashing for a single series", () => {
    const { container } = render(<AreaChart data={data} xKey="month" series={[{ key: "total" }]} title="Growth" />);

    expect(container.querySelector(".recharts-responsive-container")).toBeInTheDocument();
  });

  it("renders without crashing for multiple series, stacked", () => {
    const { container } = render(
      <AreaChart
        data={[{ month: "Jan", revenue: 100, cost: 40 }]}
        xKey="month"
        series={[{ key: "revenue" }, { key: "cost" }]}
        stacked
      />,
    );

    expect(container.querySelector(".recharts-responsive-container")).toBeInTheDocument();
  });
});
