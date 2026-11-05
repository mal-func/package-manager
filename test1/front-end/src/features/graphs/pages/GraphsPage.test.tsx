import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren, ReactElement } from "react";

vi.mock("../api/graphsApi", () => ({
  graphsApi: { listChartDatasets: vi.fn() },
}));

const { graphsApi } = await import("../api/graphsApi");
const { default: GraphsPage } = await import("./GraphsPage");

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Wrapper({ children }: PropsWithChildren): ReactElement {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return render(<GraphsPage />, { wrapper: Wrapper });
}

describe("GraphsPage", () => {
  it("shows a loading state before data arrives", () => {
    vi.mocked(graphsApi.listChartDatasets).mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("shows an error message when the fetch fails", async () => {
    vi.mocked(graphsApi.listChartDatasets).mockRejectedValue(new Error("network down"));

    renderPage();

    expect(await screen.findByText("Failed to load chart data.")).toBeInTheDocument();
  });

  it("renders only bar/line/area datasets, by title, once loaded — pie datasets are excluded", async () => {
    vi.mocked(graphsApi.listChartDatasets).mockResolvedValue({
      datasets: [
        { id: "1", slug: "revenue", title: "Monthly Revenue", chartType: "bar", description: null, points: [{ label: "Jan", series: null, value: 10 }] },
        { id: "2", slug: "traffic", title: "Website Traffic", chartType: "line", description: null, points: [{ label: "Mon", series: null, value: 10 }] },
        { id: "3", slug: "growth", title: "User Growth", chartType: "area", description: "desc", points: [{ label: "Jan", series: null, value: 10 }] },
        { id: "4", slug: "share", title: "Market Share", chartType: "pie", description: null, points: [{ label: "A", series: null, value: 10 }] },
      ],
    });

    renderPage();

    expect(await screen.findByText("Monthly Revenue")).toBeInTheDocument();
    expect(screen.getByText("Website Traffic")).toBeInTheDocument();
    expect(screen.getByText("User Growth")).toBeInTheDocument();
    expect(screen.getByText("desc")).toBeInTheDocument();
    expect(screen.queryByText("Market Share")).not.toBeInTheDocument();
  });
});
