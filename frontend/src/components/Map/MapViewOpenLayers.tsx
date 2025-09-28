"use client";

import { useEffect, useRef } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import OSM from "ol/source/OSM";
import { fromLonLat, toLonLat } from "ol/proj";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import Style from "ol/style/Style";
import CircleStyle from "ol/style/Circle";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Overlay from "ol/Overlay";
import "ol/ol.css";

function markerStyle(color = "#4CAF50") {
  return new Style({
    image: new CircleStyle({
      radius: 8,
      fill: new Fill({ color }),
      stroke: new Stroke({ color: "#fff", width: 2 }),
    }),
  });
}

// Export type so consumers can `import { MapPoint }`
export type MapPoint = {
  id: string;
  lat: number;
  lng: number;
  title?: string;       // donation title (fallback label)
  donorName?: string;   // business/donor display name
  items?: string[];     // compact list of items (["Bread", "Salad"])
  status?: string;
  detailUrl?: string;
};

export default function MapViewOpenLayers({
  value,
  onChange, // optional: picker mode
  points,   // optional: viewer mode
  height = 220,
  className,
}: {
  value?: { lat: number; lng: number } | undefined;
  onChange?: (pos: { lat: number; lng: number } | null) => void;
  points?: MapPoint[];
  height?: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const sourceRef = useRef<VectorSource | null>(null);
  const pickerFeatureRef = useRef<Feature<Point> | null>(null);

  // Label overlay refs
  const overlayRef = useRef<Overlay | null>(null);
  const overlayElRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const base = new TileLayer({ source: new OSM() });
    const source = new VectorSource();
    sourceRef.current = source;

    const vector = new VectorLayer({
      source,
      style: markerStyle(),
    });

    const map = new Map({
      target: containerRef.current,
      layers: [base, vector],
      view: new View({
        center: fromLonLat([2.35, 48.85]),
        zoom: 3,
      }),
      controls: [],
    });
    mapRef.current = map;

    // Create overlay element (the floating label)
    const el = document.createElement("div");
    el.className = "ol-marker-label";
    overlayElRef.current = el;

    const overlay = new Overlay({
      element: el,
      offset: [0, -18], // position above marker
      positioning: "bottom-center",
      stopEvent: false,
    });
    overlayRef.current = overlay;
    map.addOverlay(overlay);

    // Picker click (if enabled)
    map.on("singleclick", (evt) => {
      if (!onChange) return; // viewer mode: ignore
      const [lng, lat] = toLonLat(evt.coordinate);
      setPickerMarker(lat, lng);
      onChange({ lat, lng });
    });

    // Hover labels
    map.on("pointermove", (evt) => {
      if (!overlayRef.current || !overlayElRef.current) return;

      const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f);
      if (feature) {
        const data = feature.get("data") as MapPoint | undefined;
        if (data) {
          overlayElRef.current.innerHTML = renderLabelHTML(data);
          overlayRef.current.setPosition(evt.coordinate);
          overlayElRef.current.style.display = "block";
          return;
        }
      }
      overlayElRef.current.style.display = "none";
    });

    // Hide overlay when pointer leaves the map
    map.getViewport().addEventListener("mouseleave", () => {
      if (overlayElRef.current) overlayElRefRefSafe().style.display = "none";
    });

    function overlayElRefRefSafe() {
      // helper for TS narrow
      return overlayElRef.current as HTMLDivElement;
    }

    return () => {
      map.setTarget(undefined);
      mapRef.current = null;
      sourceRef.current = null;
      pickerFeatureRef.current = null;
      overlayRef.current = null;
      overlayElRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Picker: reflect external value
  useEffect(() => {
    if (!mapRef.current || !value) return;
    if (Number.isFinite(value.lat) && Number.isFinite(value.lng)) {
      setPickerMarker(value.lat, value.lng);
      mapRef.current.getView().animate({
        center: fromLonLat([value.lng, value.lat]),
        zoom: 13,
        duration: 200,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.lat, value?.lng]);

  // Viewer: render points (and keep picker marker if present)
  useEffect(() => {
    if (!sourceRef.current || !mapRef.current) return;

    const src = sourceRef.current;
    const pickerGeom = pickerFeatureRef.current?.getGeometry();
    src.clear();

    // Re-add picker marker if set
    if (pickerGeom && pickerFeatureRef.current) {
      src.addFeature(pickerFeatureRef.current);
    }

    if (points && points.length > 0) {
      // Add viewer features with their data for labels
      for (const p of points) {
        const f = new Feature({
          geometry: new Point(fromLonLat([p.lng, p.lat])),
        });
        f.set("data", p);
        f.setStyle(markerStyle("#3B82F6"));
        src.addFeature(f);
      }

      const view = mapRef.current.getView();
      const currentZoom = view.getZoom() ?? 0;
      if (currentZoom < 5) {
        view.animate({
          center: fromLonLat([points[0].lng, points[0].lat]),
          zoom: 11,
          duration: 200,
        });
      }
    } else {
      // hide label if there are no viewer points
      if (overlayElRef.current) overlayElRef.current.style.display = "none";
    }
  }, [points]);

  function setPickerMarker(lat: number, lng: number) {
    const src = sourceRef.current;
    if (!src) return;
    if (!pickerFeatureRef.current) {
      pickerFeatureRef.current = new Feature({
        geometry: new Point(fromLonLat([lng, lat])),
      });
      pickerFeatureRef.current.setStyle(markerStyle("#4CAF50"));
      src.addFeature(pickerFeatureRef.current);
    } else {
      pickerFeatureRef.current.setGeometry(new Point(fromLonLat([lng, lat])));
      src.changed();
    }
  }

  return <div ref={containerRef} className={className} style={{ height }} />;
}

// --- Label helpers ---

function renderLabelHTML(p: MapPoint) {
  const name = p.donorName || p.title || "Pickup point";
  const itemsLine =
    p.items && p.items.length
      ? p.items.slice(0, 3).join(" · ") + (p.items.length > 3 ? " +" : "")
      : p.title || "";
  return `
    <div class="ol-label-card">
      <div class="ol-label-name">${escapeHTML(name)}</div>
      ${
        itemsLine
          ? `<div class="ol-label-items">${escapeHTML(itemsLine)}</div>`
          : ""
      }
    </div>
  `;
}

function escapeHTML(s: string) {
  return s.replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as const
  )[c]!);
}
