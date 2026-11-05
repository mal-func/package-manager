import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

// Deep imports, not the @/shared barrel — see DashboardPage.tsx for
// why (this route's chunk would otherwise also pull in Leaflet).
import { AreaChart, BarChart, LineChart, type ChartSeries } from "@/shared/components/Chart";
import { pivotChartPoints } from "@/shared/utils";

import { graphsApi, type DemoChartDataset } from "../api/graphsApi";

const CARTESIAN_TYPES = new Set(["bar", "line", "area"]);

function GraphsPage() {
  const { data, isPending, isError } = useQuery({
    queryKey: ["graphs", "chart-datasets"],
    queryFn: () => graphsApi.listChartDatasets(),
  });

  const datasets = useMemo(
    () => (data?.datasets ?? []).filter((dataset) => CARTESIAN_TYPES.has(dataset.chartType)),
    [data?.datasets],
  );

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-gray-900">Graphs</h1>
      <p className="mb-4 text-sm text-gray-500">
        Bar, line, and area chart variants — including grouped and multi-series data — all fetched live from the
        backend. Pick whichever fits the data you're visualizing.
      </p>

      {isError ? (
        <p className="text-sm text-red-600">Failed to load chart data.</p>
      ) : isPending ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {datasets.map((dataset) => (
            <GraphCard key={dataset.id} dataset={dataset} />
          ))}
        </div>
      )}
    </div>
  );
}

function GraphCard({ dataset }: { dataset: DemoChartDataset }) {
  const { rows, seriesKeys } = useMemo(() => pivotChartPoints(dataset.points), [dataset.points]);
  const series: ChartSeries<Record<string, string | number>>[] = useMemo(
    () => seriesKeys.map((key) => ({ key })),
    [seriesKeys],
  );

  return (
    <div>
      {dataset.chartType === "bar" && (
        <BarChart data={rows} xKey="label" series={series} title={dataset.title} height={280} />
      )}
      {dataset.chartType === "line" && (
        <LineChart data={rows} xKey="label" series={series} title={dataset.title} height={280} />
      )}
      {dataset.chartType === "area" && (
        <AreaChart data={rows} xKey="label" series={series} title={dataset.title} height={280} />
      )}
      {dataset.description && <p className="mt-2 text-xs text-gray-500">{dataset.description}</p>}
    </div>
  );
}

export default GraphsPage;
