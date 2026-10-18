import mapboxgl, { type GeoJSONSource, type Map as MapboxMap } from "mapbox-gl";
import type { MapPoint } from "@/data/hostess";
import {
  DISCOVERY_SOURCE,
  discoveryFeatures,
  discoveryPriority,
  markerSize,
} from "@/lib/map-discovery";
import { occupancyColor, isFreshOccupancy, type OccupancySignals } from "@/lib/occupancy";

/** Keep Light's road hierarchy and labels, recolouring by documented source-layer semantics. */
export function styleDiscoveryMap(map: MapboxMap) {
  for (const layer of map.getStyle()?.layers ?? []) {
    if (!map.getLayer(layer.id)) continue;
    const sourceLayer = "source-layer" in layer ? layer["source-layer"] : undefined;
    if (layer.type === "background") map.setPaintProperty(layer.id, "background-color", "#f7f3ec");
    if (layer.type === "fill" && sourceLayer === "water")
      map.setPaintProperty(layer.id, "fill-color", "#a9d7e5");
    if (layer.type === "fill" && sourceLayer === "building") {
      map.setPaintProperty(layer.id, "fill-color", "#e5dfd3");
      map.setPaintProperty(layer.id, "fill-outline-color", "#d7d0c2");
    }
    if (layer.type === "fill" && ["landuse", "landuse_overlay"].includes(sourceLayer ?? "")) {
      map.setPaintProperty(layer.id, "fill-color", [
        "match",
        ["get", "class"],
        ["park", "grass", "wood", "national_park", "cemetery"],
        "#d6e6d3",
        "#eeeadf",
      ]);
    }
    if (layer.type === "line" && sourceLayer === "road") {
      const casing = layer.id.includes("case") || layer.id.includes("casing");
      map.setPaintProperty(layer.id, "line-color", casing ? "#d9d1c3" : "#fffdf8");
    }
    if (layer.type === "symbol" && sourceLayer === "road") {
      map.setPaintProperty(layer.id, "text-color", "#706b60");
      map.setPaintProperty(layer.id, "text-halo-color", "#fffdf7");
      map.setPaintProperty(layer.id, "text-halo-width", 1.5);
    }
    if (layer.type === "symbol" && sourceLayer === "poi_label") {
      map.setLayerZoomRange(layer.id, Math.max(layer.minzoom ?? 0, 15.5), layer.maxzoom ?? 24);
    }
  }
}

type PooledMarker = {
  marker: mapboxgl.Marker;
  element: HTMLDivElement;
  button: HTMLButtonElement;
  image: HTMLImageElement;
  label: HTMLSpanElement;
  count: HTMLSpanElement;
  previews: HTMLImageElement[];
  visible: boolean;
  lastSeen: number;
};

/** Mapbox's worker builds spatial clusters; HTML objects are pooled across pan and zoom. */
export function createDiscoveryMarkers(
  map: MapboxMap,
  points: readonly MapPoint[],
  select: (point: MapPoint) => void,
  interaction: () => void,
) {
  const pool = new Map<string, PooledMarker>();
  const byId = new Map(points.map((point) => [point.id, point]));
  let categories = ["food"];
  let signals: OccupancySignals = {};
  let selected: string | null = null;
  let frame = 0;
  let disposed = false;
  let revision = 0;
  const clusterPhotos = new Map<number, string[]>();
  const loadingClusters = new Set<number>();
  map.addSource(DISCOVERY_SOURCE, {
    type: "geojson",
    data: discoveryFeatures(points, categories),
    cluster: true,
    clusterRadius: 72,
    clusterMaxZoom: 17,
    clusterProperties: { representative: ["max", ["get", "representative"]] },
  });
  // An invisible layer asks Mapbox to load viewport tiles for querySourceFeatures.
  map.addLayer({
    id: "hostess-discovery-source",
    type: "circle",
    source: DISCOVERY_SOURCE,
    paint: { "circle-radius": 1, "circle-opacity": 0 },
  });

  function create(key: string): PooledMarker {
    const element = document.createElement("div");
    element.className = "discovery-marker";
    const button = document.createElement("button");
    button.className = "discovery-marker__button";
    button.type = "button";
    const photo = document.createElement("span");
    photo.className = "discovery-marker__photo";
    const image = document.createElement("img");
    image.alt = "";
    image.decoding = "async";
    image.loading = "lazy";
    image.addEventListener("error", () => {
      image.style.opacity = "0";
    });
    const fallback = document.createElement("span");
    fallback.className = "discovery-marker__fallback";
    fallback.textContent = "H";
    const count = document.createElement("span");
    count.className = "discovery-marker__count";
    const label = document.createElement("span");
    label.className = "discovery-marker__label";
    const previews = Array.from({ length: 2 }, (_, index) => {
      const preview = document.createElement("img");
      preview.className = `discovery-marker__preview discovery-marker__preview--${index}`;
      preview.alt = "";
      preview.hidden = true;
      preview.addEventListener("error", () => {
        preview.hidden = true;
      });
      button.append(preview);
      return preview;
    });
    photo.append(fallback, image);
    button.append(photo, count, label);
    element.append(button);
    const item = {
      element,
      button,
      image,
      previews,
      count,
      label,
      visible: false,
      lastSeen: 0,
      marker: new mapboxgl.Marker({ element, anchor: "bottom", offset: [0, -6] }),
    };
    pool.set(key, item);
    return item;
  }

  function render() {
    frame = 0;
    if (disposed || !map.getSource(DISCOVERY_SOURCE) || !map.isSourceLoaded(DISCOVERY_SOURCE))
      return;
    revision++;
    const zoom = map.getZoom();
    const width = map.getContainer().clientWidth;
    const height = map.getContainer().clientHeight;
    const candidates = new Map<
      string,
      { point: MapPoint; coordinates: [number, number]; clusterId?: number; count: number }
    >();
    for (const feature of map.querySourceFeatures(DISCOVERY_SOURCE) as unknown as {
      geometry: { type: string; coordinates: number[] };
      properties: Record<string, unknown>;
    }[]) {
      if (feature.geometry.type !== "Point") continue;
      const props = feature.properties ?? {};
      const clusterId = props.cluster ? Number(props.cluster_id) : undefined;
      const point =
        clusterId !== undefined
          ? points[Number(props.representative) % 100_000]
          : byId.get(String(props.venueId));
      if (!point) continue;
      const coordinates = feature.geometry.coordinates.slice(0, 2) as [number, number];
      const pixel = map.project(coordinates);
      if (pixel.x < -100 || pixel.y < -100 || pixel.x > width + 100 || pixel.y > height + 100)
        continue;
      candidates.set(clusterId === undefined ? `venue:${point.id}` : `cluster:${clusterId}`, {
        point,
        coordinates,
        clusterId,
        count: Number(props.point_count ?? 1),
      });
    }
    const selectedPoint = selected ? byId.get(selected) : undefined;
    if (selectedPoint && categories.includes(selectedPoint.category)) {
      candidates.set(`venue:${selected}`, {
        point: selectedPoint,
        coordinates: [selectedPoint.coords.lng, selectedPoint.coords.lat],
        count: 1,
      });
    }
    const occupied: { x: number; y: number; radius: number }[] = [];
    const entries = [...candidates.entries()].sort(
      (a, b) =>
        Number(b[1].point.id === selected && b[1].count === 1) -
          Number(a[1].point.id === selected && a[1].count === 1) ||
        discoveryPriority(b[1].point) - discoveryPriority(a[1].point) ||
        a[0].localeCompare(b[0]),
    );
    for (const [key, candidate] of entries) {
      const { point, coordinates, clusterId, count } = candidate;
      const active = count === 1 && point.id === selected;
      const item = pool.get(key) ?? create(key);
      const pixel = map.project(coordinates);
      let offsetX = 0,
        offsetY = 0;
      let size =
        count > 1 ? Math.min(60, markerSize(zoom, 0)) : markerSize(zoom, discoveryPriority(point));
      if (active) size = Math.max(size, 78);
      if (count === 1 && zoom >= 17) {
        // Fan out coincident entrances without changing their geographic coordinates.
        const step = size + 14;
        const offsets = [
          { x: 0, y: 0 },
          ...Array.from({ length: 24 }, (_, index) => {
            const ring = Math.floor(index / 8) + 1;
            const angle = ((index % 8) * Math.PI) / 4;
            return { x: Math.cos(angle) * step * ring, y: Math.sin(angle) * step * ring };
          }),
        ];
        const free = offsets.find((offset) =>
          occupied.every(
            (other) =>
              Math.abs(other.x - pixel.x - offset.x) >= other.radius + size / 2 + 8 ||
              Math.abs(other.y - pixel.y - offset.y) >= other.radius + size / 2 + 8,
          ),
        );
        if (free) {
          offsetX = free.x;
          offsetY = free.y;
        }
      }
      const crowded =
        !active &&
        occupied.some(
          (other) =>
            Math.abs(other.x - pixel.x - offsetX) < other.radius + size / 2 + 12 &&
            Math.abs(other.y - pixel.y - offsetY) < other.radius + size / 2 + 12,
        );
      if (crowded && count === 1 && zoom < 17) size = 32;
      occupied.push({
        x: pixel.x + offsetX,
        y: pixel.y + offsetY,
        radius: size / 2 + (count > 1 ? 20 : 0),
      });
      item.marker.setOffset([offsetX, offsetY - 6]);
      if (
        clusterId !== undefined &&
        !clusterPhotos.has(clusterId) &&
        !loadingClusters.has(clusterId)
      ) {
        loadingClusters.add(clusterId);
        const categoryKey = categories.join("|");
        (map.getSource(DISCOVERY_SOURCE) as GeoJSONSource).getClusterLeaves(
          clusterId,
          8,
          0,
          (error, leaves) => {
            loadingClusters.delete(clusterId);
            if (error || disposed || !leaves || categories.join("|") !== categoryKey) return;
            clusterPhotos.set(
              clusterId,
              leaves
                .map((leaf) => byId.get(String(leaf.properties?.venueId)))
                .filter((venue): venue is MapPoint => Boolean(venue) && venue?.id !== point.id)
                .slice(0, 2)
                .map((venue) => venue.cover),
            );
            schedule();
          },
        );
      }
      item.previews.forEach((preview, index) => {
        const cover = clusterId !== undefined ? clusterPhotos.get(clusterId)?.[index] : undefined;
        preview.hidden = !cover;
        if (cover && preview.getAttribute("src") !== cover) preview.src = cover;
      });
      item.element.style.setProperty("--photo-size", `${size.toFixed(1)}px`);
      item.element.style.setProperty(
        "--occupancy-color",
        count > 1 ? "#f9f7f2" : occupancyColor(signals[point.id]),
      );
      item.element.classList.toggle("is-selected", active);
      item.element.classList.toggle("is-cluster", count > 1);
      item.element.classList.toggle("is-compact", crowded);
      item.element.classList.toggle("has-label", count > 1 || active || (!crowded && zoom >= 14.2));
      item.element.style.zIndex = active ? "10" : String(discoveryPriority(point) + 1);
      if (item.image.getAttribute("src") !== point.cover) {
        item.image.style.opacity = "1";
        item.image.src = point.cover;
      }
      item.label.textContent = count > 1 ? "Нажмите, чтобы разделить" : point.name;
      item.count.textContent =
        count > 1
          ? `${count} ${count % 10 === 1 && count % 100 !== 11 ? "место" : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14) ? "места" : "мест"} рядом`
          : "";
      item.count.hidden = count <= 1;
      const signal = signals[point.id];
      const state =
        signal?.source === "catalog" || isFreshOccupancy(signal)
          ? `занято ${signal.valuePercent}% столов`
          : "нет актуальных данных о загрузке";
      item.button.setAttribute(
        "aria-label",
        count > 1
          ? `${count} мест рядом с ${point.name}. Приблизить карту`
          : `${point.name}, ${state}`,
      );
      item.button.setAttribute("aria-pressed", String(active));
      item.button.onclick = (event) => {
        event.stopPropagation();
        interaction();
        if (clusterId !== undefined) {
          const source = map.getSource(DISCOVERY_SOURCE) as GeoJSONSource;
          source.getClusterExpansionZoom(clusterId, (error, expansion) => {
            if (error || disposed || expansion === null || expansion === undefined) return;
            map.easeTo({ center: coordinates, zoom: Math.min(19, expansion + 0.3), duration: 500 });
          });
        } else select(point);
      };
      item.marker.setLngLat(coordinates);
      if (!item.visible) {
        item.marker.addTo(map);
        item.visible = true;
      }
      item.lastSeen = revision;
    }
    for (const [key, item] of pool) {
      if (item.lastSeen === revision) continue;
      if (item.visible) {
        item.marker.remove();
        item.visible = false;
      }
      // Bound memory over long sessions without recreating visible markers.
      if (key.startsWith("cluster:") && revision - item.lastSeen > 120) pool.delete(key);
    }
  }
  function schedule() {
    if (!frame && !disposed) frame = requestAnimationFrame(render);
  }
  map.on("move", schedule);
  map.on("sourcedata", schedule);
  map.on("resize", schedule);
  schedule();
  return {
    update(nextCategories: string[], nextSignals: OccupancySignals, nextSelected: string | null) {
      if (categories.join("|") !== nextCategories.join("|")) {
        categories = [...nextCategories];
        clusterPhotos.clear();
        (map.getSource(DISCOVERY_SOURCE) as GeoJSONSource).setData(
          discoveryFeatures(points, categories),
        );
      }
      signals = nextSignals;
      selected = nextSelected;
      schedule();
    },
    destroy() {
      disposed = true;
      cancelAnimationFrame(frame);
      map.off("move", schedule);
      map.off("sourcedata", schedule);
      map.off("resize", schedule);
      for (const item of pool.values()) item.marker.remove();
      pool.clear();
    },
  };
}
