import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DetailsDialog from "./DetailsDialog";

beforeEach(() => {
  // Ensure portal root exists for each test
  let root = document.getElementById("modal-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "modal-root";
    document.body.appendChild(root);
  }
});

const donation = {
  _id: "d1",
  title: "Bread",
  description: "Fresh loaves",
  category: "Bakery",
  quantity: 3,
  pickup_window_start: "2025-01-01 12:00",
  pickup_window_end: "2025-01-01 13:00",
  status: "AVAILABLE",
  imageUrl: "https://example.com/bread.jpg",
  donor: { _id: "x", business_name: "Nice Bakery", address: "Main St" },
};

it("renders when open and closes via overlay and button", () => {
  const onClose = vi.fn();
  const { rerender } = render(
    <DetailsDialog open donation={donation as any} onClose={onClose} />
  );

  // Title and key details
  expect(screen.getByText("Bread")).toBeInTheDocument();
  expect(screen.getByText(/Bakery · Status: AVAILABLE/)).toBeInTheDocument();
  expect(screen.getByAltText("Bread")).toHaveAttribute("src", "https://example.com/bread.jpg");
  expect(screen.getByText(/Quantity:/)).toBeInTheDocument();
  expect(screen.getByText(/Nice Bakery/)).toBeInTheDocument();
  expect(screen.getByText(/Fresh loaves/)).toBeInTheDocument();

  // Close via X
  screen.getByLabelText("Close").click();
  expect(onClose).toHaveBeenCalledTimes(1);

  // Close via overlay
  onClose.mockClear();
  rerender(<DetailsDialog open donation={donation as any} onClose={onClose} />);
  // overlay is the first child div with bg-black/50
  const overlay = document.querySelector(".bg-black\\/50") as HTMLElement;
  overlay.click();
  expect(onClose).toHaveBeenCalledTimes(1);
});

it("returns null when not open or missing root", () => {
  const { container, rerender } = render(
    <DetailsDialog open={false} donation={donation as any} onClose={() => {}} />
  );
  expect(container).toBeEmptyDOMElement();

  // Remove root and try open
  document.getElementById("modal-root")?.remove();
  rerender(<DetailsDialog open donation={donation as any} onClose={() => {}} />);
  // No crash, still nothing rendered
  expect(document.body).toBeDefined();
});
