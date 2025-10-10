import { describe, it, expect, vi, afterEach } from "vitest";
import { searchAddress, reverseGeocode } from "./geocode";

const makeFetch = (payload: any) =>
  vi.fn().mockResolvedValue({ json: vi.fn().mockResolvedValue(payload) });

describe("geocode helpers", () => {
  const origFetch = global.fetch;

  afterEach(() => {
    global.fetch = origFetch as any;
    vi.restoreAllMocks();
  });

  it("searchAddress returns [] for empty query", async () => {
    // @ts-expect-error
    global.fetch = vi.fn();
    expect(await searchAddress("   ")).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("searchAddress maps results, filters invalid numbers, passes limit", async () => {
    const data = [
      { display_name: "Cairo", lat: "30.0", lon: "31.0" },
      { display_name: "Bad", lat: "NaN", lon: "X" }, // filtered out
    ];
    global.fetch = makeFetch(data) as any;

    const res = await searchAddress("cairo", 3);
    expect(res).toEqual([{ label: "Cairo", lat: 30, lng: 31 }]);

    // ensure limit made it to the URL
    const calledUrl = (global.fetch as any).mock.calls[0][0] as string;
    expect(calledUrl).toMatch(/limit=3/);
    expect(calledUrl).toMatch(/format=json/);
    expect(calledUrl).toMatch(/q=cairo/);
  });

  it("reverseGeocode returns null for invalid coords", async () => {
    // @ts-expect-error
    global.fetch = vi.fn();
    expect(await reverseGeocode(NaN as any, 10)).toBeNull();
    expect(await reverseGeocode(10, Infinity as any)).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("reverseGeocode returns display_name or null", async () => {
    global.fetch = makeFetch({ display_name: "Giza, Egypt" }) as any;
    expect(await reverseGeocode(29.99, 31.21)).toBe("Giza, Egypt");

    global.fetch = makeFetch({}) as any;
    expect(await reverseGeocode(1, 2)).toBeNull();
  });
});
