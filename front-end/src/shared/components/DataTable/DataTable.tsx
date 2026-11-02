import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";

/**
 * Drives pagination from the server instead of TanStack Table's default
 * in-memory slicing — for a `data` array that's already just the
 * current page, not the whole collection. `total` is the whole
 * collection's size, used to compute the page count and to show the
 * real "N of M" count rather than just this page's length.
 */
interface ServerPagination {
  pageIndex: number;
  pageSize: number;
  total: number;
  onPageChange: (pageIndex: number) => void;
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  isLoading?: boolean;
  /** Shown when there is no data and loading has finished. */
  emptyMessage?: string;
  searchPlaceholder?: string;
  /**
   * Omit for client-side pagination (default) — `data` is the whole
   * collection, sorted/filtered/paginated entirely in the browser.
   * Provide when `data` is only the current server-fetched page — the
   * search box is hidden in this mode rather than left in place: a
   * client-side filter over one small page would silently search only
   * that page and could show "no results" for rows that exist
   * elsewhere in the collection, which is worse than no search at all.
   * Sorting stays client-side (sorts only the loaded page) — a common,
   * clearly-scoped pattern, not a misleading one.
   */
  serverPagination?: ServerPagination;
}

/**
 * Generic, reusable table: sorting, global search, and pagination —
 * headless (TanStack Table) so any column shape can be plugged in.
 * Column visibility/row actions/bulk actions/export are intentionally
 * not included; add them when a real consumer needs them rather than
 * building them speculatively.
 */
export function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  emptyMessage = "No data available.",
  searchPlaceholder = "Search...",
  serverPagination,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const pageCount = serverPagination
    ? Math.max(1, Math.ceil(serverPagination.total / serverPagination.pageSize))
    : undefined;

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      ...(serverPagination && {
        pagination: { pageIndex: serverPagination.pageIndex, pageSize: serverPagination.pageSize },
      }),
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    // Client-side mode still needs TanStack's own row-slicing; server
    // mode must NOT re-slice `data` a second time — it's already just
    // one page's worth of rows.
    ...(serverPagination
      ? { manualPagination: true, pageCount }
      : { getPaginationRowModel: getPaginationRowModel(), initialState: { pagination: { pageSize: 10 } } }),
  });

  return (
    <div>
      {!serverPagination && (
        <input
          type="search"
          value={globalFilter}
          onChange={(event) => { setGlobalFilter(event.target.value); }}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="mb-3 w-full max-w-xs rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
        />
      )}

      <div className="overflow-x-auto rounded-md border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-2 text-left font-medium text-gray-500">
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        disabled={!header.column.getCanSort()}
                        className="flex items-center gap-1 disabled:cursor-default"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{ asc: " ▲", desc: " ▼" }[header.column.getIsSorted() as string] ?? null}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-6 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-6 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2 text-gray-700">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && serverPagination && (
        <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
          <span>
            Page {serverPagination.pageIndex + 1} of {pageCount} ({serverPagination.total} total)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { serverPagination.onPageChange(serverPagination.pageIndex - 1); }}
              disabled={serverPagination.pageIndex === 0}
              className="rounded-md border border-gray-300 px-3 py-1 disabled:cursor-default disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => { serverPagination.onPageChange(serverPagination.pageIndex + 1); }}
              disabled={serverPagination.pageIndex + 1 >= (pageCount ?? 1)}
              className="rounded-md border border-gray-300 px-3 py-1 disabled:cursor-default disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {!isLoading && !serverPagination && table.getPageCount() > 1 && (
        <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
          <span>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { table.previousPage(); }}
              disabled={!table.getCanPreviousPage()}
              className="rounded-md border border-gray-300 px-3 py-1 disabled:cursor-default disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => { table.nextPage(); }}
              disabled={!table.getCanNextPage()}
              className="rounded-md border border-gray-300 px-3 py-1 disabled:cursor-default disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
