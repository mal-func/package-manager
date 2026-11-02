import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { RadialChart } from "./RadialChart";

const data = [
  { team: "Frontend", completion: 80 },
  { team: "Backend", completion: 65 },
];

describe("RadialChart", () => {
  it("renders a legend swatch with the label and value for every row", () => {
    render(<RadialChart data={data} nameKey="team" valueKey="completion" title="Team Performance" />);

    expect(screen.getByText("Frontend — 80")).toBeInTheDocument();
    expect(screen.getByText("Backend — 65")).toBeInTheDocument();
  });

  it("renders without crashing with an empty dataset", () => {
    const { container } = render(<RadialChart data={[]} nameKey="team" valueKey="completion" />);

    expect(container.querySelector(".recharts-responsive-container")).toBeInTheDocument();
  });
});
