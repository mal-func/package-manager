import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";

import { employeeColumns, orderColumns, productColumns } from "./tablesColumns";

function TestTable<T extends object>({ columns, data }: { columns: ColumnDef<T, unknown>[]; data: T[] }) {
  const table = useReactTable({ columns, data, getCoreRowModel: getCoreRowModel() });
  return (
    <table>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

describe("orderColumns", () => {
  it("formats amount as INR currency", () => {
    render(
      <TestTable
        columns={orderColumns}
        data={[{ orderId: "ORD-1", customer: "A", amount: 1500, status: "Pending", placedOn: "2026-01-01" }]}
      />,
    );

    expect(screen.getByText("₹1,500")).toBeInTheDocument();
  });

  it("renders a known status with its matching badge style", () => {
    render(
      <TestTable
        columns={orderColumns}
        data={[{ orderId: "ORD-1", customer: "A", amount: 1500, status: "Delivered", placedOn: "2026-01-01" }]}
      />,
    );

    expect(screen.getByText("Delivered")).toHaveClass("bg-green-100");
  });

  it("falls back to a neutral badge style for an unrecognized status", () => {
    render(
      <TestTable
        columns={orderColumns}
        data={[{ orderId: "ORD-1", customer: "A", amount: 1500, status: "Returned", placedOn: "2026-01-01" }]}
      />,
    );

    expect(screen.getByText("Returned")).toHaveClass("bg-gray-100");
  });
});

describe("employeeColumns", () => {
  it("labels an active employee as Active", () => {
    render(
      <TestTable
        columns={employeeColumns}
        data={[{ name: "A", department: "Eng", email: "a@b.com", isActive: true }]}
      />,
    );

    expect(screen.getByText("Active")).toHaveClass("bg-green-100");
  });

  it("labels an inactive employee as Inactive", () => {
    render(
      <TestTable
        columns={employeeColumns}
        data={[{ name: "A", department: "Eng", email: "a@b.com", isActive: false }]}
      />,
    );

    expect(screen.getByText("Inactive")).toHaveClass("bg-gray-100");
  });
});

describe("productColumns", () => {
  it("formats price as INR currency and rating with a star", () => {
    render(
      <TestTable
        columns={productColumns}
        data={[{ name: "Widget", category: "Tools", price: 999, stock: 10, rating: 4.5 }]}
      />,
    );

    expect(screen.getByText("₹999")).toBeInTheDocument();
    expect(screen.getByText("★ 4.5")).toBeInTheDocument();
  });
});
