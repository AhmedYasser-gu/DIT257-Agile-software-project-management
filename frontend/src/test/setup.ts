import "@testing-library/jest-dom";
import React from "react";
import { vi } from "vitest";

// ---- Next mocks (no JSX here)
vi.mock("next/link", () => ({
  default: (props: any) => {
    const { href, children, ...rest } = props;
    return React.createElement(
      "a",
      { href: typeof href === "string" ? href : "#", ...rest },
      children
    );
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
}));

// ---- Convex hooks (overridden per-test if needed)
vi.mock("convex/react", async (orig) => {
  const actualModule = await orig();
  const actual = (actualModule ?? {}) as Record<string, unknown>;
  return {
    ...actual,
    useQuery: vi.fn(),
    useMutation: vi.fn(),
  };
});

// ---- OpenLayers light mocks
class __MapMock {
  private _handlers: Record<string, Function[]> = {};
  constructor(_: any) {}
  setTarget() {}
  getViewport() { return document.createElement("div"); }
  on(type: string, cb: Function) {
    this._handlers[type] = this._handlers[type] ?? [];
    this._handlers[type].push(cb);
  }
  __emit(type: string, evt: any) {
    (this._handlers[type] ?? []).forEach((cb) => cb(evt));
  }
  addOverlay() {}
  getView() {
    return { fit() {}, animate() {}, setCenter() {}, setZoom() {}, getZoom() { return 4; } };
  }
  updateSize() {}
}
vi.mock("ol/Map", () => ({ default: __MapMock }));
vi.mock("ol/View", () => ({ default: class View { constructor(_: any) {} } }));
vi.mock("ol/layer/Tile", () => ({ default: class TileLayer { constructor(_: any) {} } }));
vi.mock("ol/layer/Vector", () => ({ default: class VectorLayer { constructor(_: any) {} } }));
vi.mock("ol/source/Vector", () => ({ default: class VectorSource {
  _feats:any[]=[]; addFeature(f:any){this._feats.push(f);} clear(){this._feats=[];}
  getFeatures(){return this._feats;} getExtent(){return [0,0,0,0];} changed(){}
} }));
vi.mock("ol/source/OSM", () => ({ default: class OSM { constructor() {} } }));
vi.mock("ol/Overlay", () => ({ default: class Overlay { constructor(_:any){} setPosition(){} } }));
vi.mock("ol/proj", () => ({ fromLonLat: (c:any)=>c, toLonLat: (c:any)=>c }));
vi.mock("ol/Feature", () => ({ default: class Feature {
  private _props:Record<string,any>={};
  constructor(_:any){} setStyle(){} set(k:string,v:any){this._props[k]=v;}
  get(k:string){return this._props[k];}
  getGeometry(){ return { getExtent(){return [0,0,0,0];}, getCoordinates(){return [0,0];} }; }
} }));
vi.mock("ol/geom/Point", () => ({ default: class Point { constructor(_:any){} getExtent(){return [0,0,0,0];} } }));
vi.mock("ol/style/Style", () => ({ default: class Style { constructor(_:any){} } }));
vi.mock("ol/style/Circle", () => ({ default: class CircleStyle { constructor(_:any){} } }));
vi.mock("ol/style/Fill", () => ({ default: class Fill { constructor(_:any){} } }));
vi.mock("ol/style/Stroke", () => ({ default: class Stroke { constructor(_:any){} } }));

class __RO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = (globalThis as any).ResizeObserver || __RO;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(""),
}));

// ---- Minimal Clerk mocks (Access uses useAuth)
vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ userId: "user_1", isLoaded: true }),
  SignInButton: (p: any) => (p?.children ?? null),
  UserButton: () => null,
}));

