import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FolderKanban } from "lucide-react";

import { StatCard } from "./StatCard";

describe("StatCard", () => {
  it("renders the label and value", () => {
    render(<StatCard label="Total Projects" value="632" icon={FolderKanban} iconBgClassName="bg-primary" />);

    expect(screen.getByText("Total Projects")).toBeInTheDocument();
    expect(screen.getByText("632")).toBeInTheDocument();
  });

  it("shows the trend line when trendPercent is given", () => {
    render(<StatCard label="Total Projects" value="632" icon={FolderKanban} iconBgClassName="bg-primary" trendPercent={19} />);

    expect(screen.getByText("19%")).toBeInTheDocument();
    expect(screen.getByText("from last month")).toBeInTheDocument();
  });

  it("omits the trend line when trendPercent is not given", () => {
    render(<StatCard label="Total Projects" value="632" icon={FolderKanban} iconBgClassName="bg-primary" />);

    expect(screen.queryByText("from last month")).not.toBeInTheDocument();
  });

  it("shows a trend line even for 0%, since it's a valid trend value (not 'no trend')", () => {
    render(<StatCard label="Total Projects" value="632" icon={FolderKanban} iconBgClassName="bg-primary" trendPercent={0} />);

    expect(screen.getByText("0%")).toBeInTheDocument();
  });
});
