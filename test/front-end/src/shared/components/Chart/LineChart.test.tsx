import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import { LineChart } from "./LineChart";

const data = [
  { day: "Mon", visits: 100 },
  { day: "Tue", visits: 150 },
];

describe("LineChart", () => {
  it("renders without crashing for a single series", () => {
    const { container } = render(<LineChart data={data} xKey="day" series={[{ key: "visits" }]} title="Traffic" />);

    expect(container.querySelector(".recharts-responsive-container")).toBeInTheDocument();
  });

  it("renders without crashing for multiple series", () => {
    const { container } = render(
      <LineChart
        data={[{ month: "Jan", revenue: 100, cost: 40 }]}
        xKey="month"
        series={[{ key: "revenue" }, { key: "cost" }]}
      />,
    );

    expect(container.querySelector(".recharts-responsive-container")).toBeInTheDocument();
  });
});
