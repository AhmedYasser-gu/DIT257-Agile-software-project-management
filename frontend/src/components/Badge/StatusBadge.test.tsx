import { render, screen } from "@testing-library/react";
import StatusBadge from "./StatusBadge";

describe("StatusBadge", () => {
  const cases: Array<[string, RegExp]> = [
    ["AVAILABLE", /green/],
    ["CLAIMED", /yellow/],
    ["PICKEDUP", /blue/],
    ["SOMETHINGELSE", /gray/],
  ];

  it.each(cases)("renders %s with expected color classes", (status, colorRe) => {
    render(<StatusBadge status={status} />);
    const el = screen.getByText(status);
    expect(el).toBeInTheDocument();
    expect(el.className).toMatch(colorRe);
  });
});
