import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

// Deep import, not the @/shared barrel — see DashboardPage.tsx for why
// (this route's chunk would otherwise also pull in Leaflet).
import { PieChart, RadialChart } from "@/shared/components/Chart";

import { chartsApi, type DemoChartDataset } from "../api/chartsApi";

const RADIAL_TYPES = new Set(["pie", "donut", "radial"]);

function ChartsPage() {
  const { data, isPending, isError } = useQuery({
    queryKey: ["charts", "chart-datasets"],
    queryFn: () => chartsApi.listChartDatasets(),
  });

  const datasets = useMemo(
    () => (data?.datasets ?? []).filter((dataset) => RADIAL_TYPES.has(dataset.chartType)),
    [data?.datasets],
  );

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-gray-900">Charts</h1>
      <p className="mb-4 text-sm text-gray-500">
        Pie, donut, and radial chart variants for share-of-total and progress data — all fetched live from the
        backend.
      </p>

      {isError ? (
        <p className="text-sm text-red-600">Failed to load chart data.</p>
      ) : isPending ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {datasets.map((dataset) => (
            <ChartCard key={dataset.id} dataset={dataset} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChartCard({ dataset }: { dataset: DemoChartDataset }) {
  const rows = useMemo(
    () => dataset.points.map((point) => ({ label: point.label, value: point.value })),
    [dataset.points],
  );

  return (
    <div>
      {dataset.chartType === "pie" && (
        <PieChart data={rows} nameKey="label" valueKey="value" title={dataset.title} height={260} />
      )}
      {dataset.chartType === "donut" && (
        <PieChart
          data={rows}
          nameKey="label"
          valueKey="value"
          title={dataset.title}
          height={260}
          innerRadius="55%"
        />
      )}
      {dataset.chartType === "radial" && (
        <RadialChart data={rows} nameKey="label" valueKey="value" title={dataset.title} height={260} />
      )}
      {dataset.description && <p className="mt-2 text-xs text-gray-500">{dataset.description}</p>}
    </div>
  );
}

export default ChartsPage;
