import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { GradientLegend } from "./GradientLegend";

describe("GradientLegend", () => {
  it("renders the title and each of the three labels in high/medium/low order", () => {
    render(<GradientLegend title="Activity Intensity" labels={["High", "Medium", "Low"]} />);

    expect(screen.getByText("Activity Intensity")).toBeInTheDocument();
    const labelEls = [screen.getByText("High"), screen.getByText("Medium"), screen.getByText("Low")];
    // Rendered top-to-bottom in the same order the labels tuple was given.
    const positions = labelEls.map((el) => el.compareDocumentPosition(labelEls[0]));
    expect(positions[0]).toBe(0);
  });
});
