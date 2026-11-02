import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren, ReactElement } from "react";

vi.mock("../api/tablesApi", () => ({
  tablesApi: { listTableDatasets: vi.fn() },
}));

const { tablesApi } = await import("../api/tablesApi");
const { default: TablesPage } = await import("./TablesPage");

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Wrapper({ children }: PropsWithChildren): ReactElement {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return render(<TablesPage />, { wrapper: Wrapper });
}

describe("TablesPage", () => {
  it("shows an error message when the fetch fails", async () => {
    vi.mocked(tablesApi.listTableDatasets).mockRejectedValue(new Error("network down"));

    renderPage();

    expect(await screen.findByText("Failed to load table data.")).toBeInTheDocument();
  });

  it("renders all three sections (Orders, Employees, Products) with their descriptions once loaded", async () => {
    vi.mocked(tablesApi.listTableDatasets).mockResolvedValue({
      datasets: [
        { id: "1", slug: "orders", title: "Orders", description: "Order list", rows: [{ orderId: "ORD-1", customer: "A", amount: 100, status: "Pending", placedOn: "2026-01-01" }] },
        { id: "2", slug: "employees", title: "Employees", description: "Employee directory", rows: [] },
        { id: "3", slug: "products", title: "Products", description: "Product catalog", rows: [] },
      ],
    });

    renderPage();

    expect(await screen.findByText("Order list")).toBeInTheDocument();
    expect(screen.getByText("Employee directory")).toBeInTheDocument();
    expect(screen.getByText("Product catalog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Orders" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Employees" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Products" })).toBeInTheDocument();
  });

  it("shows each section's empty message when its dataset is missing from the response", async () => {
    vi.mocked(tablesApi.listTableDatasets).mockResolvedValue({ datasets: [] });

    renderPage();

    expect(await screen.findByText("No orders found.")).toBeInTheDocument();
    expect(screen.getByText("No employees found.")).toBeInTheDocument();
    expect(screen.getByText("No products found.")).toBeInTheDocument();
  });
});
