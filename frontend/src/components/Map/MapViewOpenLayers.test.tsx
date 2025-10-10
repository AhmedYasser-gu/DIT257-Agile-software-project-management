import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import MapViewOpenLayers from "@/components/Map/MapViewOpenLayers";

describe("MapViewOpenLayers", () => {
  it("renders with legend/count", () => {
    render(
      <MapViewOpenLayers
        points={[
          { id: "1", lat: 30, lng: 31, donorName: "A", title: "T1" },
          { id: "2", lat: 30.000001, lng: 31.000001, donorName: "A", title: "T2" },
        ]}
        userLocation={{ lat: 29.9, lng: 31.1 }}
        height={200}
      />
    );
    expect(screen.getByText(/Map/i)).toBeInTheDocument();
    expect(screen.getByText(/Total: 2/)).toBeInTheDocument();
    expect(screen.getByText(/Legend/)).toBeInTheDocument();
  });

  it("renders empty card when no data", () => {
    render(<MapViewOpenLayers height={180} points={[]} emptyMessage="Nada" />);
    expect(screen.getByText("Nada")).toBeInTheDocument();
  });
});
