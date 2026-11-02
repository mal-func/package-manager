import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import Sidebar from "./Sidebar";

function renderSidebar(overrides: Partial<Parameters<typeof Sidebar>[0]> = {}) {
  const onMobileOpenChange = vi.fn();
  const onCollapsedChange = vi.fn();

  const utils = render(
    <MemoryRouter>
      <Sidebar
        mobileOpen={false}
        onMobileOpenChange={onMobileOpenChange}
        collapsed={false}
        onCollapsedChange={onCollapsedChange}
        {...overrides}
      />
    </MemoryRouter>,
  );

  return { ...utils, onMobileOpenChange, onCollapsedChange };
}

describe("Sidebar", () => {
  it("renders every configured navigation item in the always-mounted desktop panel", () => {
    renderSidebar();

    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Graphs" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Charts" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Table" })).toBeInTheDocument();
  });

  it("also renders a second copy of every item in the mobile drawer once it's open", async () => {
    renderSidebar({ mobileOpen: true });

    // Radix marks the desktop copy aria-hidden while the modal drawer
    // is open (correct a11y behavior — screen readers should only see
    // the open dialog), so it drops out of role-based queries; check
    // the raw document instead (the drawer portals to document.body,
    // outside RTL's own render container).
    await screen.findByText("Navigation menu");

    expect(document.querySelectorAll('a[href="/dashboard"]')).toHaveLength(2);
    expect(document.querySelectorAll('a[href="/graphs"]')).toHaveLength(2);
  });

  it("shows the CDIS brand name when expanded", () => {
    renderSidebar({ collapsed: false });

    expect(screen.getAllByText("CDIS").length).toBeGreaterThan(0);
  });

  it("hides the brand name text (icon-only) on the desktop panel when collapsed", () => {
    renderSidebar({ collapsed: true });

    // The mobile drawer isn't mounted at all by default (mobileOpen:
    // false), so with the desktop copy hiding its text, no "CDIS"
    // label should be present anywhere in the document.
    expect(screen.queryByText("CDIS")).not.toBeInTheDocument();
  });

  it("the mobile drawer copy stays un-collapsed (full label shown) even when the desktop panel is collapsed", async () => {
    renderSidebar({ collapsed: true, mobileOpen: true });

    expect(await screen.findByText("CDIS")).toBeInTheDocument();
  });

  it("calls onCollapsedChange with the toggled value when the collapse button is clicked", async () => {
    const user = userEvent.setup();
    const { onCollapsedChange } = renderSidebar({ collapsed: false });

    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));

    expect(onCollapsedChange).toHaveBeenCalledExactlyOnceWith(true);
  });

  it("labels the toggle button for expanding when already collapsed", () => {
    renderSidebar({ collapsed: true });

    expect(screen.getByRole("button", { name: "Expand sidebar" })).toBeInTheDocument();
  });

  it("does not show the mobile drawer content when mobileOpen is false", () => {
    renderSidebar({ mobileOpen: false });

    expect(screen.queryByText("Navigation menu")).not.toBeInTheDocument();
  });

  it("shows the mobile drawer when mobileOpen is true", async () => {
    renderSidebar({ mobileOpen: true });

    expect(await screen.findByText("Navigation menu")).toBeInTheDocument();
  });
});
