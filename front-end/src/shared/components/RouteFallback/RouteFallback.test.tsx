import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { RouteFallback } from "./RouteFallback";

describe("RouteFallback", () => {
  it("renders a loading indicator", () => {
    render(<RouteFallback />);

    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });
});
