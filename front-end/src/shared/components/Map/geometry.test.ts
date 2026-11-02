import { describe, expect, it } from "vitest";
import type { Geometry } from "geojson";

import { getGeometryCenter } from "./geometry";

describe("getGeometryCenter", () => {
  it("returns null for a geometry with no coordinates (GeometryCollection of nothing)", () => {
    const geometry: Geometry = { type: "GeometryCollection", geometries: [] };

    expect(getGeometryCenter(geometry)).toBeNull();
  });

  it("returns the point itself for a Point geometry", () => {
    const geometry: Geometry = { type: "Point", coordinates: [78, 22] };

    const center = getGeometryCenter(geometry);

    expect(center?.lng).toBe(78);
    expect(center?.lat).toBe(22);
  });

  it("returns the bounding-box midpoint for a LineString", () => {
    const geometry: Geometry = { type: "LineString", coordinates: [[0, 0], [10, 20]] };

    const center = getGeometryCenter(geometry);

    expect(center?.lng).toBe(5);
    expect(center?.lat).toBe(10);
  });

  it("returns the bounding-box midpoint for a Polygon (using every ring)", () => {
    const geometry: Geometry = {
      type: "Polygon",
      coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]],
    };

    const center = getGeometryCenter(geometry);

    expect(center?.lng).toBe(5);
    expect(center?.lat).toBe(5);
  });

  it("returns the bounding-box midpoint across all parts of a MultiPolygon", () => {
    const geometry: Geometry = {
      type: "MultiPolygon",
      coordinates: [
        [[[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]],
        [[[8, 8], [10, 8], [10, 10], [8, 10], [8, 8]]],
      ],
    };

    const center = getGeometryCenter(geometry);

    expect(center?.lng).toBe(5);
    expect(center?.lat).toBe(5);
  });

  it("recurses into every member of a GeometryCollection", () => {
    const geometry: Geometry = {
      type: "GeometryCollection",
      geometries: [
        { type: "Point", coordinates: [0, 0] },
        { type: "Point", coordinates: [10, 10] },
      ],
    };

    const center = getGeometryCenter(geometry);

    expect(center?.lng).toBe(5);
    expect(center?.lat).toBe(5);
  });

  it("returns the bounding-box midpoint for a MultiLineString", () => {
    const geometry: Geometry = {
      type: "MultiLineString",
      coordinates: [[[0, 0], [4, 4]], [[6, 6], [10, 10]]],
    };

    const center = getGeometryCenter(geometry);

    expect(center?.lng).toBe(5);
    expect(center?.lat).toBe(5);
  });

  it("returns the bounding-box midpoint for a MultiPoint", () => {
    const geometry: Geometry = { type: "MultiPoint", coordinates: [[0, 0], [10, 10]] };

    const center = getGeometryCenter(geometry);

    expect(center?.lng).toBe(5);
    expect(center?.lat).toBe(5);
  });
});
