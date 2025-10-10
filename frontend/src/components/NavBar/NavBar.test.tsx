import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import NavBar from "./NavBar";

// ---- next/navigation: make pathname mutable
const nav = { pathname: "/" };
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
}));

// ---- NavLink: simple anchor
vi.mock("@/components/NavLink/NavLink", () => ({
  default: ({ href, exact, children, ...rest }: any) => (
    <a href={href} data-exact={!!exact} {...rest}>
      {children}
    </a>
  ),
}));

// ---- Clerk: render SignedIn only if logged in, SignedOut if logged out
const auth = { userId: null as string | null };
vi.mock("@clerk/nextjs", () => ({
  SignedIn: ({ children }: any) => (auth.userId ? <>{children}</> : null),
  SignedOut: ({ children }: any) => (!auth.userId ? <>{children}</> : null),
  UserButton: () => <div data-testid="userbtn" />,
  useAuth: () => ({ userId: auth.userId }),
}));

// ---- Convex useQuery mock – controlled per test
const q = { value: undefined as any };
vi.mock("convex/react", async (orig) => {
  const actual = await orig();
  return { ...actual, useQuery: () => q.value };
});
vi.mock("@/convexApi", () => ({
  api: { functions: { createUser: { getRegistrationStatus: {} } } },
}));

beforeEach(() => {
  auth.userId = null;
  q.value = undefined;
  nav.pathname = "/";
});

describe("NavBar", () => {
  it("hides on /login/register", () => {
    nav.pathname = "/login/register";
    const { container } = render(<NavBar />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows logged-out links when no user", () => {
    auth.userId = null; // logged out
    nav.pathname = "/"; // normal page
    render(<NavBar />);
    expect(screen.getByText("No Leftovers")).toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("How it works")).toBeInTheDocument();
    expect(screen.queryByTestId("userbtn")).not.toBeInTheDocument(); // no user button
  });

  it("logged-in, status undefined → Home + Dashboard", () => {
    auth.userId = "user_1";
    q.value = undefined;
    render(<NavBar />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Post Donation")).not.toBeInTheDocument();
  });

  it("donor sees donor links + badge", () => {
    auth.userId = "user_1";
    q.value = { registered: true, userType: "donor" };
    render(<NavBar />);
    expect(screen.getByText("Post Donation")).toBeInTheDocument();
    expect(screen.getByText("Reviews")).toBeInTheDocument();
    expect(screen.getByText(/Donor Account/)).toBeInTheDocument();
    expect(screen.getByTestId("userbtn")).toBeInTheDocument();
  });

  it("receiver sees receiver links + badge", () => {
    auth.userId = "user_1";
    q.value = { registered: true, userType: "receiver" };
    render(<NavBar />);
    expect(screen.getByText("Explore")).toBeInTheDocument();
    expect(screen.getByText(/Receiver Account/)).toBeInTheDocument();
  });
});
