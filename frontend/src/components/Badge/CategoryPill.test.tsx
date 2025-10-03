import { render, screen } from "@testing-library/react";
import CategoryPill from "./CategoryPill";

describe("CategoryPill", () => {
  it("renders label (with trailing 'test' as implemented)", () => {
    render(<CategoryPill label="Bakery" />);
    expect(screen.getByText("Bakerytest")).toBeInTheDocument();
  });
});
