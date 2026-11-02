import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren, ReactElement } from "react";

vi.mock("../api/chartsApi", () => ({
  chartsApi: { listChartDatasets: vi.fn() },
}));

const { chartsApi } = await import("../api/chartsApi");
const { default: ChartsPage } = await import("./ChartsPage");

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Wrapper({ children }: PropsWithChildren): ReactElement {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return render(<ChartsPage />, { wrapper: Wrapper });
}

describe("ChartsPage", () => {
  it("shows a loading state before data arrives", () => {
    vi.mocked(chartsApi.listChartDatasets).mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("shows an error message when the fetch fails", async () => {
    vi.mocked(chartsApi.listChartDatasets).mockRejectedValue(new Error("network down"));

    renderPage();

    expect(await screen.findByText("Failed to load chart data.")).toBeInTheDocument();
  });

  it("renders only pie/donut/radial datasets, by title, once loaded — bar/line datasets are excluded", async () => {
    vi.mocked(chartsApi.listChartDatasets).mockResolvedValue({
      datasets: [
        { id: "1", slug: "market-share", title: "Market Share", chartType: "pie", description: null, points: [{ label: "A", series: null, value: 10 }] },
        { id: "2", slug: "budget", title: "Budget Allocation", chartType: "donut", description: null, points: [{ label: "A", series: null, value: 10 }] },
        { id: "3", slug: "team-perf", title: "Team Performance", chartType: "radial", description: "desc", points: [{ label: "A", series: null, value: 10 }] },
        { id: "4", slug: "revenue", title: "Monthly Revenue", chartType: "bar", description: null, points: [{ label: "A", series: null, value: 10 }] },
      ],
    });

    renderPage();

    expect(await screen.findByText("Market Share")).toBeInTheDocument();
    expect(screen.getByText("Budget Allocation")).toBeInTheDocument();
    expect(screen.getByText("Team Performance")).toBeInTheDocument();
    expect(screen.getByText("desc")).toBeInTheDocument();
    expect(screen.queryByText("Monthly Revenue")).not.toBeInTheDocument();
  });
});
