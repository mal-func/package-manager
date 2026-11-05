import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { MapLegend } from "./MapLegend";

describe("MapLegend", () => {
  it("renders the title and every tier label, highest first", () => {
    render(<MapLegend title="Project Count" />);

    expect(screen.getByText("Project Count")).toBeInTheDocument();

    const labels = screen.getAllByText(/100\+|50 - 100|20 - 50|5 - 20|1 - 5|^0$/).map((el) => el.textContent);
    expect(labels).toEqual(["100+", "50 - 100", "20 - 50", "5 - 20", "1 - 5", "0"]);
  });
});
