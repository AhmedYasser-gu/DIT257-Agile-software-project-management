import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import NavLink from "./NavLink";
import * as nav from "next/navigation";

describe("NavLink", () => {
  afterEach(() => vi.restoreAllMocks());

  it("renders children and applies active class when exact match", () => {
    vi.spyOn(nav, "usePathname").mockReturnValue("/dashboard");
    render(<NavLink href="/dashboard" exact>Dash</NavLink>);

    const link = screen.getByRole("link", { name: "Dash" });
    expect(link).toHaveAttribute("href", "/dashboard");
    expect(link.className).toMatch(/bg-primary/); // active
  });

  it("applies active when pathname startsWith href (non-exact)", () => {
    vi.spyOn(nav, "usePathname").mockReturnValue("/profile/settings");
    render(<NavLink href="/profile">Me</NavLink>);

    const link = screen.getByRole("link", { name: "Me" });
    expect(link.className).toMatch(/bg-primary/); // active
  });

  it("merges className and shows inactive styles when not active", () => {
    vi.spyOn(nav, "usePathname").mockReturnValue("/other");
    render(<NavLink href="/profile" className="custom">Me</NavLink>);

    const link = screen.getByRole("link", { name: "Me" });
    expect(link.className).toMatch(/custom/);
    expect(link.className).toMatch(/hover:underline/);
  });
});
