import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import Breadcrumb from "./Breadcrumb";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Breadcrumb />
    </MemoryRouter>,
  );
}

describe("Breadcrumb", () => {
  it("renders nothing on the dashboard route", () => {
    const { container } = renderAt("/dashboard");

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing on a path with no matching navigation entry", () => {
    const { container } = renderAt("/some-unregistered-path");

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the current section's label for a known route", () => {
    renderAt("/graphs");

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Graphs")).toBeInTheDocument();
  });

  it("renders a different label for a different known route", () => {
    renderAt("/tables");

    expect(screen.getByText("Table")).toBeInTheDocument();
  });
});
