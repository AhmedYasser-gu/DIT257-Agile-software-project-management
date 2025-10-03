import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ConfirmDialog from "./ConfirmDialog";

beforeEach(() => {
  let root = document.getElementById("modal-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "modal-root";
    document.body.appendChild(root);
  }
});

it("renders when open and fires confirm/cancel", () => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <ConfirmDialog
      open
      title="Delete item?"
      description="This cannot be undone."
      confirmText="Yes"
      cancelText="No"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );

  expect(screen.getByText("Delete item?")).toBeInTheDocument();
  expect(screen.getByText("This cannot be undone.")).toBeInTheDocument();

  screen.getByText("No").click();
  screen.getByText("Yes").click();
  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(onConfirm).toHaveBeenCalledTimes(1);
});

it("returns null when closed", () => {
  const { container } = render(
    <ConfirmDialog
      open={false}
      title="T"
      onConfirm={() => {}}
      onCancel={() => {}}
    />
  );
  expect(container).toBeEmptyDOMElement();
});
