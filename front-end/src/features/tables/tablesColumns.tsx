import type { ColumnDef } from "@tanstack/react-table";

export interface OrderRow {
  orderId: string;
  customer: string;
  amount: number;
  status: string;
  placedOn: string;
}

export interface EmployeeRow {
  name: string;
  department: string;
  email: string;
  isActive: boolean;
}

export interface ProductRow {
  name: string;
  category: string;
  price: number;
  stock: number;
  rating: number;
}

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const STATUS_STYLES: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-700",
  Shipped: "bg-blue-100 text-blue-700",
  Delivered: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
};

export const orderColumns: ColumnDef<OrderRow, unknown>[] = [
  { accessorKey: "orderId", header: "Order ID" },
  { accessorKey: "customer", header: "Customer" },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: (info) => currencyFormatter.format(info.getValue<number>()),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: (info) => {
      const status = info.getValue<string>();
      const className = STATUS_STYLES[status] ?? "bg-gray-100 text-gray-700";
      return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>{status}</span>;
    },
  },
  { accessorKey: "placedOn", header: "Placed On" },
];

export const employeeColumns: ColumnDef<EmployeeRow, unknown>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "department", header: "Department" },
  { accessorKey: "email", header: "Email" },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: (info) => {
      const isActive = info.getValue<boolean>();
      const className = isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500";
      return (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
          {isActive ? "Active" : "Inactive"}
        </span>
      );
    },
  },
];

export const productColumns: ColumnDef<ProductRow, unknown>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "category", header: "Category" },
  {
    accessorKey: "price",
    header: "Price",
    cell: (info) => currencyFormatter.format(info.getValue<number>()),
  },
  { accessorKey: "stock", header: "Stock" },
  {
    accessorKey: "rating",
    header: "Rating",
    cell: (info) => `★ ${String(info.getValue<number>())}`,
  },
];
