import { useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

// Deep import, not the @/shared barrel — see DashboardPage.tsx for why
// (this route's chunk would otherwise also pull in Leaflet/Recharts).
import { DataTable } from "@/shared/components/DataTable";

import { tablesApi, type DemoTableDataset } from "../api/tablesApi";
import {
  employeeColumns,
  orderColumns,
  productColumns,
  type EmployeeRow,
  type OrderRow,
  type ProductRow,
} from "../tablesColumns";

function TablesPage() {
  const { data, isPending, isError } = useQuery({
    queryKey: ["tables", "table-datasets"],
    queryFn: () => tablesApi.listTableDatasets(),
  });

  const datasetBySlug = useMemo(() => {
    const map = new Map<string, DemoTableDataset>();
    for (const dataset of data?.datasets ?? []) {
      map.set(dataset.slug, dataset);
    }
    return map;
  }, [data?.datasets]);

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-gray-900">Table</h1>
      <p className="mb-4 text-sm text-gray-500">
        Reusable DataTable primitive (sortable columns, global search, pagination) applied to a few typical data
        shapes — all fetched live from the backend.
      </p>

      {isError ? (
        <p className="text-sm text-red-600">Failed to load table data.</p>
      ) : (
        <div className="flex flex-col gap-6">
          <TableSection
            title="Orders"
            description={datasetBySlug.get("orders")?.description}
            isLoading={isPending}
          >
            <DataTable
              columns={orderColumns}
              data={(datasetBySlug.get("orders")?.rows as OrderRow[] | undefined) ?? []}
              isLoading={isPending}
              emptyMessage="No orders found."
              searchPlaceholder="Search orders..."
            />
          </TableSection>

          <TableSection
            title="Employees"
            description={datasetBySlug.get("employees")?.description}
            isLoading={isPending}
          >
            <DataTable
              columns={employeeColumns}
              data={(datasetBySlug.get("employees")?.rows as EmployeeRow[] | undefined) ?? []}
              isLoading={isPending}
              emptyMessage="No employees found."
              searchPlaceholder="Search employees..."
            />
          </TableSection>

          <TableSection
            title="Products"
            description={datasetBySlug.get("products")?.description}
            isLoading={isPending}
          >
            <DataTable
              columns={productColumns}
              data={(datasetBySlug.get("products")?.rows as ProductRow[] | undefined) ?? []}
              isLoading={isPending}
              emptyMessage="No products found."
              searchPlaceholder="Search products..."
            />
          </TableSection>
        </div>
      )}
    </div>
  );
}

function TableSection({
  title,
  description,
  isLoading,
  children,
}: {
  title: string;
  description: string | null | undefined;
  isLoading: boolean;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      {!isLoading && description && <p className="mb-3 mt-0.5 text-sm text-gray-500">{description}</p>}
      <div className={description && !isLoading ? "" : "mt-3"}>{children}</div>
    </section>
  );
}

export default TablesPage;
