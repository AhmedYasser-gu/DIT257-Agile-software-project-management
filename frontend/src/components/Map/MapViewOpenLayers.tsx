"use client";

import { useEffect, useRef } from "react";
import OlMap from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import OSM from "ol/source/OSM";
import { fromLonLat, toLonLat } from "ol/proj";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import CircleGeom from "ol/geom/Circle";
import Style from "ol/style/Style";
import CircleStyle from "ol/style/Circle";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Overlay from "ol/Overlay";
import type { FeatureLike } from "ol/Feature";
import { createEmpty as createExtent, extend as extendExtent } from "ol/extent";
import "ol/ol.css";

const PARIS: [number, number] = [2.35, 48.85];

function markerStyle(color = "#4CAF50") {
  return new Style({
    image: new CircleStyle({
      radius: 8,
      fill: new Fill({ color }),
      stroke: new Stroke({ color: "#fff", width: 2 }),
    }),
  });
}

// A single donation (used inside grouped popups)
type GroupDonation = { title?: string; items?: string[]; status?: string };

export type MapPoint = {
  id: string;
  lat: number;
  lng: number;
  title?: string; // single-donation title (legacy shape)
  donorName?: string;
  items?: string[]; // single-donation items (legacy shape)
  status?: string; // single-donation status (legacy shape)
  detailUrl?: string;
  donations?: GroupDonation[];
};

type LatLng = { lat: number; lng: number };

type Group = {
  donorName?: string;
  lat: number;
  lng: number;
  donations: GroupDonation[];
};

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
  emptyMessage = "No donor locations with pins around you yet 🌍.",
  legendMode = "auto",
  radiusKm,
}: {
  points?: MapPoint[];
  userLocation?: LatLng | null;
  value?: LatLng;
  onChange?: (pos: LatLng | null) => void;
  height?: number | string;
  className?: string;
  showLegend?: boolean;
  emptyMessage?: string;
  legendMode?: "auto" | "pickerOnly" | "full";
  radiusKm?: number | null;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<OlMap | null>(null);

  const srcPinsRef = useRef<VectorSource | null>(null);
  const srcUserRef = useRef<VectorSource | null>(null);
  const srcPickerRef = useRef<VectorSource | null>(null);
  const srcRadiusRef = useRef<VectorSource | null>(null);

  const userFeatRef = useRef<Feature<Point> | null>(null);
  const pickerFeatRef = useRef<Feature<Point> | null>(null);
  const radiusFeatRef = useRef<Feature<CircleGeom> | null>(null);

  const overlayRef = useRef<Overlay | null>(null);
  const overlayElRef = useRef<HTMLDivElement | null>(null);

  // keep latest onChange without re-initializing the map
  const onChangeRef = useRef<typeof onChange>(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const hasPins = (points?.length ?? 0) > 0;
  const legendPickerOnly =
    legendMode === "pickerOnly" ||
    (legendMode === "auto" && !!onChange && !hasPins && !userLocation);

  // INIT ONCE
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const base = new TileLayer({ source: new OSM() });

    const srcPins = new VectorSource();
    const srcUser = new VectorSource();
    const srcPicker = new VectorSource();
    const srcRadius = new VectorSource();

    srcPinsRef.current = srcPins;
    srcUserRef.current = srcUser;
    srcPickerRef.current = srcPicker;
    srcRadiusRef.current = srcRadius;

    const pinsLayer = new VectorLayer({
      source: srcPins,
      style: (f: FeatureLike) => f.get("style") ?? markerStyle("#3B82F6"),
    });

    const userLayer = new VectorLayer({
      source: srcUser,
      style: markerStyle("#EB6A25"), // ORANGE: "You"
    });

    const pickerLayer = new VectorLayer({
      source: srcPicker,
      style: markerStyle("#4CAF50"), // Selected
    });

    const radiusLayer = new VectorLayer({
      source: srcRadius,
      style: new Style({
        fill: new Fill({ color: "rgba(59, 130, 246, 0.12)" }),
        stroke: new Stroke({
          color: "rgba(59, 130, 246, 0.6)",
          width: 2,
          lineDash: [4, 4],
        }),
      }),
    });

    const map = new OlMap({
      target: containerRef.current,
      layers: [base, radiusLayer, pinsLayer, userLayer, pickerLayer],
      view: new View({
        center: fromLonLat(PARIS),
        zoom: 3,
      }),
      controls: [],
    });
    mapRef.current = map;

    // overlay (for donor pins; content is prebuilt html stored on feature)
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

    // pick on click (if picker mode)
    map.on("singleclick", (evt) => {
      const cb = onChangeRef.current;
      if (!cb) return;
      const [lng, lat] = toLonLat(evt.coordinate);
      setPicker(lat, lng, { recenter: true });
      cb({ lat, lng });
    });

    // hover label
    map.on("pointermove", (evt) => {
      if (!overlayElRef.current) return;
      const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f) as
        | Feature
        | undefined;
      if (!feature) {
        overlayElRef.current.style.display = "none";
        return;
      }
      const html = feature.get("popupHtml") as string | undefined;
      if (!html) {
        overlayElRef.current.style.display = "none";
        return;
      }
      overlayElRef.current.innerHTML = html;
      overlay.setPosition(evt.coordinate);
      overlayElRef.current.style.display = "block";
    });

    map.getViewport().addEventListener("mouseleave", () => {
      if (overlayElRef.current) overlayElRef.current.style.display = "none";
    });
    map.on("pointerdrag", () => {
      if (overlayElRef.current) overlayElRef.current.style.display = "none";
    });

    return () => {
      map.setTarget(undefined);
      mapRef.current = null;
      srcPinsRef.current = null;
      srcUserRef.current = null;
      srcPickerRef.current = null;
      srcRadiusRef.current = null;
      pickerFeatRef.current = null;
      userFeatRef.current = null;
      radiusFeatRef.current = null;
      overlayRef.current = null;
      overlayElRef.current = null as unknown as HTMLDivElement;
    };
  }, []);

  // Keep OL sized with layout changes (prevents blank/partial render)
  useEffect(() => {
    const map = mapRef.current;
    const el = containerRef.current;
    if (!map || !el) return;

    const t = setTimeout(() => map.updateSize(), 0);
    const onWin = () => map.updateSize();
    window.addEventListener("resize", onWin);

    const ro = new ResizeObserver(() => map.updateSize());
    ro.observe(el);

    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onWin);
      ro.disconnect();
    };
  }, []);

  // draw + view management (supports BOTH input shapes)
  useEffect(() => {
    const map = mapRef.current;
    const srcPins = srcPinsRef.current;
    const srcUser = srcUserRef.current;
    const srcRadius = srcRadiusRef.current;
    if (!map || !srcPins || !srcUser) return;

    srcPins.clear();
    srcUser.clear();
    if (srcRadius) {
      srcRadius.clear();
      radiusFeatRef.current = null;
    }

    // user marker (orange)
    const hasUser =
      !!userLocation &&
      Number.isFinite(userLocation.lat) &&
      Number.isFinite(userLocation.lng);

    if (hasUser) {
      const f = new Feature({
        geometry: new Point(fromLonLat([userLocation!.lng, userLocation!.lat])),
      });
      f.setStyle(markerStyle("#EB6A25"));
      srcUser.addFeature(f);
      userFeatRef.current = f;
    } else {
      userFeatRef.current = null;
    }

    // ── Build groups from incoming points ──
    const groups = new globalThis.Map<string, Group>();

    (points ?? []).forEach((p) => {
      if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) return;

      // If caller already grouped donations, use them directly.
      const incoming: GroupDonation[] | undefined = p.donations;

      // Grouping key: location rounded + donor name
      const key = `${p.lng.toFixed(6)},${p.lat.toFixed(6)}|${p.donorName ?? ""}`;
      let g = groups.get(key);
      if (!g) {
        g = { donorName: p.donorName, lat: p.lat, lng: p.lng, donations: [] };
        groups.set(key, g);
      }

      if (incoming && incoming.length) {
        // push all provided donations
        incoming.forEach((d) =>
          g!.donations.push({
            title: d.title,
            items: d.items,
            status: d.status,
          })
        );
      } else {
        // legacy: one point == one donation
        g.donations.push({ title: p.title, items: p.items, status: p.status });
      }
    });

    // add 1 feature per group with prebuilt HTML tooltip
    groups.forEach((g) => {
      const f = new Feature({
        geometry: new Point(fromLonLat([g.lng, g.lat])),
      });

      const lines = g.donations.slice(0, 6).map((d) => {
        const name = escapeHTML(d.title ?? "Donation");
        const st = d.status
          ? ` <span class="text-[10px] px-1 py-0.5 rounded bg-muted/50 border">${escapeHTML(
              d.status
            )}</span>`
          : "";
        return `<li class="leading-tight">• ${name}${st}</li>`;
      });
      const extra =
        g.donations.length > 6
          ? `<div class="text-subtext mt-1">+${g.donations.length - 6} more…</div>`
          : "";

      const html = `
        <div class="font-medium">${escapeHTML(g.donorName || "Donor")}</div>
        <ul class="mt-1">${lines.join("")}</ul>
        ${extra}
      `;
      f.set("popupHtml", html);
      f.setStyle(markerStyle("#3B82F6"));
      srcPins.addFeature(f);
    });
    // ──────────────────────────────────────

    // Combined extent: pins + user + picker
    const view = map.getView();
    const ext = createExtent();
    let haveExtent = false;

    if (srcPins.getFeatures().length > 0) {
      extendExtent(ext, srcPins.getExtent());
      haveExtent = true;
    }
    if (userFeatRef.current) {
      extendExtent(
        ext,
        (userFeatRef.current.getGeometry() as Point).getExtent()
      );
      haveExtent = true;
    }
    if (pickerFeatRef.current) {
      extendExtent(
        ext,
        (pickerFeatRef.current.getGeometry() as Point).getExtent()
      );
      haveExtent = true;
    } else if (
      value &&
      Number.isFinite(value.lat) &&
      Number.isFinite(value.lng)
    ) {
      extendExtent(
        ext,
        new Point(fromLonLat([value.lng, value.lat])).getExtent()
      );
      haveExtent = true;
    }

    if (radiusFeatRef.current) {
      extendExtent(ext, radiusFeatRef.current.getGeometry()!.getExtent());
      haveExtent = true;
    }

    if (haveExtent) {
      try {
        view.fit(ext, {
          padding: [40, 40, 40, 40],
          maxZoom: 15,
          duration: 250,
        });
      } catch {}
    } else {
      // fallback default only if nothing else to show
      if ((view.getZoom() ?? 0) < 3.5) {
        view.setCenter(fromLonLat(PARIS));
        view.setZoom(3);
      }
    }
  }, [
    JSON.stringify(points ?? []),
    userLocation?.lat,
    userLocation?.lng,
    value?.lat,
    value?.lng,
    radiusKm,
  ]);

  // Draw radius ring when provided
  useEffect(() => {
    const srcRadius = srcRadiusRef.current;
    if (!srcRadius) return;

    srcRadius.clear();
    radiusFeatRef.current = null;

    if (
      !userLocation ||
      !Number.isFinite(userLocation.lat) ||
      !Number.isFinite(userLocation.lng) ||
      !Number.isFinite(radiusKm) ||
      !radiusKm ||
      radiusKm <= 0
    ) {
      return;
    }

    const radiusMeters = radiusKm * 1000;
    const center = fromLonLat([userLocation.lng, userLocation.lat]);
    const geometry = new CircleGeom(center, radiusMeters);

    const feature = new Feature({ geometry });
    srcRadius.addFeature(feature);
    radiusFeatRef.current = feature;
  }, [userLocation?.lat, userLocation?.lng, radiusKm]);

  // reflect picker value from props
  useEffect(() => {
    if (!value) return;
    if (!Number.isFinite(value.lat) || !Number.isFinite(value.lng)) return;
    setPicker(value.lat, value.lng, { recenter: true });
  }, [value?.lat, value?.lng]);

  function setPicker(lat: number, lng: number, opts?: { recenter?: boolean }) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return; // <- guard
    const srcPicker = srcPickerRef.current;
    const map = mapRef.current;
    if (!srcPicker) return;

    const coord = fromLonLat([lng, lat]); // OL wants [lon, lat]
    if (!pickerFeatRef.current) {
      pickerFeatRef.current = new Feature({ geometry: new Point(coord) });
      pickerFeatRef.current.setStyle(markerStyle("#4CAF50"));
      srcPicker.addFeature(pickerFeatRef.current);
    } else {
      pickerFeatRef.current.setGeometry(new Point(coord));
      srcPicker.changed();
    }
    if (opts?.recenter && map) {
      const view = map.getView();
      const targetZoom = Math.max(view.getZoom() ?? 3, 14);
      view.animate({ center: coord, zoom: targetZoom, duration: 200 });
    }
  }

  return (
    <div className={className}>
      <div className="card overflow-hidden p-0 relative">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <div className="font-medium">Map</div>
            <div className="text-xs text-subtext">
              {hasPins
                ? "Donations by location"
                : onChange
                  ? "Pick a location"
                  : "Your location"}
            </div>
          </div>
          <div className="text-xs text-subtext">
            {hasPins ? `Total: ${points?.length ?? 0}` : ""}
          </div>
        </div>

        <div ref={containerRef} style={{ height }} className="w-full" />

        {/* Empty state when there are no pins and we're not in picker mode */}
        {!hasPins && !onChange && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            aria-live="polite"
          >
            <div className="bg-white/95 text-sm border rounded-md px-3 py-2 shadow-sm">
              {emptyMessage}
            </div>
          </div>
        )}

        {showLegend && (
          <div className="absolute bottom-3 right-3 rounded-md bg-white/95 px-3 py-2 shadow-md text-xs border">
            <div className="font-medium mb-1">Legend</div>
            {legendPickerOnly ? (
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ background: "#4CAF50" }}
                />
                Selected
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ background: "#EB6A25" }}
                  />
                  You
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ background: "#3B82F6" }}
                  />
                  Donor
                </div>
                {onChange && (
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full"
                      style={{ background: "#4CAF50" }}
                    />
                    Selected
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function escapeHTML(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!
  );
}
