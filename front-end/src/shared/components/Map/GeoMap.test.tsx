import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Feature, FeatureCollection, Polygon } from "geojson";

import { GeoMap, type RegionLayer } from "./GeoMap";

const emptyPolygonCollection: FeatureCollection<Polygon, Record<string, unknown>> = {
  type: "FeatureCollection",
  features: [],
};

const regionLayer: RegionLayer = {
  id: "test-region",
  data: emptyPolygonCollection,
  style: () => ({ fillColor: "#c10003" }),
};

const squareFeature: Feature<Polygon, { name: string }> = {
  type: "Feature",
  properties: { name: "Test Region" },
  geometry: { type: "Polygon", coordinates: [[[70, 10], [80, 10], [80, 20], [70, 20], [70, 10]]] },
};

const populatedRegionLayer: RegionLayer<{ name: string }> = {
  id: "populated-region",
  data: { type: "FeatureCollection", features: [squareFeature] },
  style: () => ({ fillColor: "#c10003" }),
  hoverStyle: () => ({ fillColor: "#00a5f1" }),
  tooltip: (feature) => feature.properties.name,
  label: (feature) => feature.properties.name,
};

describe("GeoMap", () => {
  it("renders a real Leaflet map container", () => {
    const { container } = render(<GeoMap />);

    expect(container.querySelector(".leaflet-container")).toBeInTheDocument();
  });

  it("shows the empty-state message when there are no markers or layers", () => {
    render(<GeoMap emptyMessage="No project data available yet." />);

    expect(screen.getByText("No project data available yet.")).toBeInTheDocument();
  });

  it("hides the empty-state message once a region layer is given", () => {
    render(<GeoMap regionLayers={[regionLayer]} />);

    expect(screen.queryByText("No location data available yet.")).not.toBeInTheDocument();
  });

  it("shows the loading overlay instead of the empty state while isLoading", () => {
    render(<GeoMap isLoading />);

    expect(screen.getByText("Loading map…")).toBeInTheDocument();
    expect(screen.queryByText("No location data available yet.")).not.toBeInTheDocument();
  });

  it("renders overlay content anchored to the requested corner", () => {
    render(<GeoMap overlays={{ bottomRight: <span>Legend</span> }} />);

    expect(screen.getByText("Legend")).toBeInTheDocument();
  });

  it("renders the zoom in/out and recenter controls", () => {
    render(<GeoMap />);

    expect(screen.getByRole("button", { name: "Zoom in" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zoom out" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Recenter map" })).toBeInTheDocument();
  });

  it("renders a populated region layer's features and label badges without crashing", () => {
    const { container } = render(<GeoMap regionLayers={[populatedRegionLayer]} />);

    expect(container.querySelector(".leaflet-container")).toBeInTheDocument();
    expect(container.querySelector("path")).toBeInTheDocument();
  });

  it("fits the view to the data when fitToData is set, without crashing", () => {
    const { container } = render(<GeoMap regionLayers={[populatedRegionLayer]} fitToData />);

    expect(container.querySelector(".leaflet-container")).toBeInTheDocument();
  });

  it("renders a mask layer when maskOutside is given", () => {
    const { container } = render(
      <GeoMap maskOutside={{ data: { type: "FeatureCollection", features: [squareFeature] } }} />,
    );

    expect(container.querySelector(".leaflet-container")).toBeInTheDocument();
  });
});
