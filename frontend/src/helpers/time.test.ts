import { fmt, minutesRemaining } from "./time";
import { vi } from "vitest";

describe("helpers/time", () => {
  afterEach(() => vi.restoreAllMocks());

  it("fmt handles empty/invalid", () => {
    expect(fmt(undefined as any)).toBe("—");
    expect(fmt("")).toBe("—");
    expect(fmt("not-a-date")).toBe("not-a-date");
  });

  it("fmt prints using toLocaleString (mocked for stability)", () => {
    const spy = vi
      .spyOn(Date.prototype, "toLocaleString")
      .mockReturnValue("01/01/2025, 12:30:00");
    expect(fmt("2025-01-01T12:30")).toBe("01/01/2025, 12:30:00");
    expect(fmt("2025-01-01 09:05")).toBe("01/01/2025, 12:30:00");
    spy.mockRestore();
  });

  it("minutesRemaining returns floor((end - now)/min)", () => {
    const now = new Date("2025-01-01T12:00:00Z").getTime();
    vi.spyOn(Date, "now").mockReturnValue(now);

    expect(minutesRemaining("2025-01-01T12:30:00Z")).toBe(30);
    expect(minutesRemaining("2025-01-01T12:29:59Z")).toBe(29);
    expect(minutesRemaining("2025-01-01T11:59:00Z")).toBeLessThanOrEqual(0);
  });
});
