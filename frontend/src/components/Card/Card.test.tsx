import { render, screen } from "@testing-library/react";
import Card from "./Card";

describe("Card", () => {
  it("wraps children", () => {
    render(<Card><div>Inner</div></Card>);
    expect(screen.getByText("Inner")).toBeInTheDocument();
  });
});
