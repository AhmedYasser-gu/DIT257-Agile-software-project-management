import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Button from "./Button";

describe("Button", () => {
  it("defaults to primary variant", () => {
    render(<Button>Go</Button>);
    const btn = screen.getByRole("button", { name: "Go" });
    expect(btn.className).toMatch(/btn-primary/);
  });

  it("applies outline variant and triggers click", async () => {
    const onClick = vi.fn();
    render(<Button variant="outline" onClick={onClick}>Out</Button>);
    const btn = screen.getByRole("button", { name: "Out" });
    expect(btn.className).toMatch(/btn-outline/);
    await userEvent.click(btn);
    expect(onClick).toHaveBeenCalled();
  });
});
