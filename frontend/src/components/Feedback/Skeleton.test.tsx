import { render } from "@testing-library/react";
import Skeleton from "./Skeleton";

describe("Skeleton", () => {
  it("renders with pulse and extra class", () => {
    const { container } = render(<Skeleton className="h-4 w-10" />);
    const node = container.querySelector(".animate-pulse") as HTMLElement;
    expect(node).toBeTruthy();
    expect(node.className).toMatch(/h-4/);
    expect(node.className).toMatch(/w-10/);
  });
});
