import { render, screen } from "@testing-library/react";
import Empty from "./Empty";

describe("Empty", () => {
  it("renders title and hint when provided", () => {
    render(<Empty title="Nothing here" hint="Try adjusting filters" />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    expect(screen.getByText(/adjusting filters/)).toBeInTheDocument();
  });

  it("renders without hint", () => {
    render(<Empty title="Nada" />);
    expect(screen.getByText("Nada")).toBeInTheDocument();
  });
});
