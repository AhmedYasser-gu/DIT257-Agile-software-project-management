import { describe, it, expect, vi } from "vitest";
import { claimDonation } from "../claimDonation";

function apiWith(
  opts: { first?: any } = {}
) {
  const api: any = {
    withIndex: vi.fn().mockImplementation((_name: string, cb: any) => {
      const q = { eq: () => api };
      cb(q);
      return api;
    }),
    first: vi.fn().mockResolvedValue(opts.first),
    collect: vi.fn().mockResolvedValue([]),
    filter: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    unique: vi.fn(),
  };
  return api;
}

function makeDb({ user, receiver, donation }: any) {
  return {
    query: vi.fn().mockImplementation((table: string) => {
      if (table === "users") return apiWith({ first: user });
      if (table === "recievers") return apiWith({ first: receiver });
      return apiWith();
    }),
    get: vi.fn().mockResolvedValue(donation ?? null),
    insert: vi.fn(),
    patch: vi.fn(),
  };
}

describe("claimDonation", () => {
  it("throws if user not found", async () => {
    const db = makeDb({ user: null });
    await expect(
      (claimDonation as any)({ db }, { clerk_id: "x", donation_id: "donations:1", amount: 1n })
    ).rejects.toThrow("User not found");
  });

  it("successfully creates claim and patches donation", async () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    const db = makeDb({
      user: { _id: "users:1" },
      receiver: { _id: "recievers:9" },
      donation: { _id: "donations:1", status: "AVAILABLE", pickup_window_end: future },
    });

   await (claimDonation as any)(
      { db },
      { clerk_id: "abc", donation_id: "donations:1", amount: 2n }
   );

    expect(db.insert).toHaveBeenCalledWith("claims", expect.objectContaining({
      donation_id: "donations:1",
      claimer_id: "recievers:9",
      amount: 2n,
      status: "PENDING",
    }));
    expect(db.patch).toHaveBeenCalledWith("donations:1", { status: "CLAIMED" });
  });
});
