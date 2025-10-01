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
import type { FeatureLike } from "ol/Feature";
import "ol/ol.css";

const PARIS = [2.35, 48.85];

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
  title?: string;
  donorName?: string;
  items?: string[];
  status?: string;
  detailUrl?: string;
};

type LatLng = { lat: number; lng: number };

export default function MapViewOpenLayers({
  // viewer
  points,
  userLocation,
  // picker
  value,
  onChange,
  // ui
  height = 360,
  className,
  showLegend = true,
  emptyMessage = "No donor locations with pins around you yet.",
}: {
  points?: MapPoint[];
  userLocation?: LatLng | null;
  value?: LatLng;
  onChange?: (pos: LatLng | null) => void;
  height?: number | string;
  className?: string;
  showLegend?: boolean;
  emptyMessage?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const srcPinsRef = useRef<VectorSource | null>(null);
  const srcPickerRef = useRef<VectorSource | null>(null);
  const userFeatRef = useRef<Feature<Point> | null>(null);
  const pickerFeatRef = useRef<Feature<Point> | null>(null);
  const overlayRef = useRef<Overlay | null>(null);
  const overlayElRef = useRef<HTMLDivElement | null>(null);

  const hasPins = (points?.length ?? 0) > 0;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const base = new TileLayer({ source: new OSM() });

    const srcPins = new VectorSource();
    const srcPicker = new VectorSource();
    srcPinsRef.current = srcPins;
    srcPickerRef.current = srcPicker;

    const pinsLayer = new VectorLayer({
      source: srcPins,
      style: (f: FeatureLike) => f.get("style") ?? markerStyle("#3B82F6"),
    });

    const pickerLayer = new VectorLayer({
      source: srcPicker,
      style: markerStyle("#4CAF50"),
    });

    const map = new Map({
      target: containerRef.current,
      layers: [base, pinsLayer, pickerLayer],
      view: new View({
        center: fromLonLat(PARIS),
        zoom: 3,
      }),
      controls: [],
    });
    mapRef.current = map;

    // overlay label
    const label = document.createElement("div");
    label.className = "rounded-lg bg-white px-3 py-2 text-xs shadow-md border";
    overlayElRef.current = label;
    const overlay = new Overlay({
      element: label,
      offset: [0, -18],
      positioning: "bottom-center",
      stopEvent: false,
    });
    overlayRef.current = overlay;
    map.addOverlay(overlay);

    // picking
    map.on("singleclick", (evt) => {
      if (!onChange) return;
      const [lng, lat] = toLonLat(evt.coordinate);
      setPicker(lat, lng);
      onChange({ lat, lng });
    });

    // hover label
    map.on("pointermove", (evt) => {
      if (!overlayElRef.current) return;
      const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f) as Feature | undefined;
      if (!feature) {
        overlayElRef.current.style.display = "none";
        return;
      }
      const d = feature.get("data") as MapPoint | undefined;
      if (!d) {
        overlayElRef.current.style.display = "none";
        return;
      }
      overlayElRef.current.innerHTML = `
        <div class="font-medium">${escapeHTML(d.donorName || d.title || "Pickup")}</div>
        ${
          d.items?.length
            ? `<div class="text-subtext">${escapeHTML(
                d.items.slice(0, 3).join(" · ") + (d.items.length > 3 ? " +" : "")
              )}</div>`
            : ""
        }
      `;
      overlay.setPosition(evt.coordinate);
      overlayElRef.current.style.display = "block";
    });

    map.getViewport().addEventListener("mouseleave", () => {
      if (overlayElRef.current) overlayElRef.current.style.display = "none";
    });

    return () => {
      map.setTarget(undefined);
      mapRef.current = null;
      srcPinsRef.current = null;
      srcPickerRef.current = null;
      pickerFeatRef.current = null;
      userFeatRef.current = null;
      overlayRef.current = null;
      overlayElRef.current = null;
    };
  }, [onChange]);

  // draw pins + user marker + fit
  useEffect(() => {
    const map = mapRef.current;
    const srcPins = srcPinsRef.current;
    if (!map || !srcPins) return;

    srcPins.clear();

    // user marker (blue)
    if (userLocation && Number.isFinite(userLocation.lat) && Number.isFinite(userLocation.lng)) {
      const f = new Feature({
        geometry: new Point(fromLonLat([userLocation.lng, userLocation.lat])),
      });
      f.set("style", markerStyle("#2563EB"));
      srcPins.addFeature(f);
      userFeatRef.current = f;
    } else {
      userFeatRef.current = null;
    }

    // donation pins (indigo)
    for (const p of points ?? []) {
      if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) continue;
      const f = new Feature({ geometry: new Point(fromLonLat([p.lng, p.lat])) });
      f.set("data", p);
      f.set("style", markerStyle("#3B82F6"));
      srcPins.addFeature(f);
    }

    // fit bounds if we have anything
    const feats = srcPins.getFeatures();
    if (feats.length > 0) {
      try {
        map.getView().fit(srcPins.getExtent(), {
          padding: [40, 40, 40, 40],
          maxZoom: 15,
          duration: 250,
        });
      } catch {}
    } else {
      // fall back to user, then default
      if (userLocation) {
        map.getView().animate({
          center: fromLonLat([userLocation.lng, userLocation.lat]),
          zoom: 12,
          duration: 200,
        });
      } else {
        map.getView().setCenter(fromLonLat(PARIS));
        map.getView().setZoom(3);
      }
    }
  }, [JSON.stringify(points ?? []), userLocation?.lat, userLocation?.lng]);

  // reflect picker value
  useEffect(() => {
    if (!value) return;
    if (!Number.isFinite(value.lat) || !Number.isFinite(value.lng)) return;
    setPicker(value.lat, value.lng);
  }, [value?.lat, value?.lng]);

  function setPicker(lat: number, lng: number) {
    const srcPicker = srcPickerRef.current;
    if (!srcPicker) return;
    if (!pickerFeatRef.current) {
      pickerFeatRef.current = new Feature({
        geometry: new Point(fromLonLat([lng, lat])),
      });
      pickerFeatRef.current.setStyle(markerStyle("#4CAF50"));
      srcPicker.addFeature(pickerFeatRef.current);
    } else {
      pickerFeatRef.current.setGeometry(new Point(fromLonLat([lng, lat])));
      srcPicker.changed();
    }
  }

  // If there are no donor pins AND no user marker, show a nice empty state card
  if (!hasPins && !userLocation) {
    return (
      <div className={className}>
        <div className="card p-6">
          <div className="font-medium mb-1">Map</div>
          <div className="text-subtext text-sm">{emptyMessage}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="card overflow-hidden p-0 relative">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <div className="font-medium">Map</div>
            <div className="text-xs text-subtext">
              {hasPins ? "Donations by location" : "Your location"}
            </div>
          </div>
          <div className="text-xs text-subtext">
            {hasPins ? `Total: ${points?.length ?? 0}` : ""}
          </div>
        </div>
        <div ref={containerRef} style={{ height }} className="w-full" />

        {showLegend && (
          <div className="absolute bottom-3 right-3 rounded-md bg-white/95 px-3 py-2 shadow-md text-xs border">
            <div className="font-medium mb-1">Legend</div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: "#eb5325ff" }} />
              You
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: "#3B82F6" }} />
              Donor
            </div>
            {onChange && (
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: "#4CAF50" }} />
                Selected
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function escapeHTML(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
