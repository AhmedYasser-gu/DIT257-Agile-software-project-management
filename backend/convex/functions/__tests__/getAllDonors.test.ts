import { describe, it, expect, vi } from "vitest";
import { getAllDonors } from "../getAllDonors";

function apiWith(
  opts: { first?: any; collect?: any } = {}
) {
  const api: any = {
    withIndex: vi.fn().mockImplementation((_name: string, cb: any) => {
      const q = { eq: () => api };
      cb(q);
      return api;
    }),
    first: vi.fn().mockResolvedValue(opts.first),
    collect: vi.fn().mockResolvedValue(opts.collect ?? []),
    filter: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    unique: vi.fn(),
  };
  return api;
}

function makeDb({ user, memberships, donorsById }: any) {
  return {
    query: vi.fn().mockImplementation((table: string) => {
      if (table === "users") return apiWith({ first: user });
      if (table === "userInDonor") return apiWith({ collect: memberships ?? [] });
      return apiWith(); // default
    }),
    get: vi.fn().mockImplementation(async (id: string) => donorsById?.[id] ?? null),
  };
}

describe("getAllDonors", () => {
  it("returns [] if no user", async () => {
    const db = makeDb({ user: null });
    const res = await (getAllDonors as any)({ db }, { clerk_id: "none" });
    expect(res).toEqual([]);
  });

  it("returns donors for memberships", async () => {
    const db = makeDb({
      user: { _id: "users:1" },
      memberships: [{ donors_id: "donors:1" }, { donors_id: "donors:2" }],
      donorsById: {
        "donors:1": { _id: "donors:1", business_name: "A" },
        "donors:2": { _id: "donors:2", business_name: "B" },
      },
    });

    const res = await (getAllDonors as any)({ db }, { clerk_id: "u" });
    expect(res.map((d: any) => d.business_name)).toEqual(["A", "B"]);
  });
});
