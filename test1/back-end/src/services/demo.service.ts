import { demoRepository } from "../repositories/demo.repository.js";

export const demoService = {
  async listStateMetrics() {
    return demoRepository.findAllStateMetrics();
  },

  async listChartDatasets(chartType?: string) {
    const datasets = await demoRepository.findAllChartDatasets(chartType);

    return datasets.map((dataset) => ({
      id: dataset.id,
      slug: dataset.slug,
      title: dataset.title,
      chartType: dataset.chartType,
      description: dataset.description,
      points: dataset.points.map((point) => ({
        label: point.label,
        series: point.series,
        value: point.value,
      })),
    }));
  },

  async listTableDatasets() {
    const datasets = await demoRepository.findAllTableDatasets();

    return datasets.map((dataset) => ({
      id: dataset.id,
      slug: dataset.slug,
      title: dataset.title,
      description: dataset.description,
      rows: dataset.rows.map((row) => row.data),
    }));
  },
};
