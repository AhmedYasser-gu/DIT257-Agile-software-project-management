import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";

// set env & mocks BEFORE importing the module under test
beforeAll(() => {
  (process.env as any).NEXT_PUBLIC_CONVEX_URL = "https://convex.example.test";
});

vi.mock("convex/react", () => ({
  ConvexReactClient: class { constructor(_: string) {} },
}));
vi.mock("convex/react-clerk", () => ({
  ConvexProviderWithClerk: ({ children }: any) => <>{children}</>,
}));
vi.mock("@clerk/nextjs", () => ({
  ClerkProvider: ({ children }: any) => <>{children}</>,
  useAuth: () => ({ userId: "user_1" }),
}));

describe("ConvexClientProvider", () => {
  it("renders children", async () => {
    const { default: ConvexClientProvider } = await import("./ConvexClientProvider");
    render(
      <ConvexClientProvider>
        <div data-testid="kid" />
      </ConvexClientProvider>
    );
    expect(screen.getByTestId("kid")).toBeInTheDocument();
  });
});
