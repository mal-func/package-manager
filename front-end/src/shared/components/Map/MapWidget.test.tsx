import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { MapWidget } from "./MapWidget";

describe("MapWidget", () => {
  it("renders a real Leaflet map container", () => {
    const { container } = render(<MapWidget />);

    expect(container.querySelector(".leaflet-container")).toBeInTheDocument();
  });

  it("shows the empty-state message when there are no markers", () => {
    render(<MapWidget emptyMessage="No offices yet." />);

    expect(screen.getByText("No offices yet.")).toBeInTheDocument();
  });

  it("hides the empty-state message once markers are given", () => {
    render(<MapWidget markers={[{ id: "1", position: [20, 78], label: "HQ" }]} />);

    expect(screen.queryByText("No location data available yet.")).not.toBeInTheDocument();
  });
});
