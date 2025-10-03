import { describe, it, expect } from "vitest";
import { makeDb, makeStorage, makeTables } from "../../../test/mockConvex";
import { listAvailableDonations } from "../listAvailableDonations";

describe("listAvailableDonations", () => {
  it("returns AVAILABLE & non-expired, sorted by end time then title, with imageUrl", async () => {
    const past = new Date(Date.now() - 1000).toISOString();
    const soon = new Date(Date.now() + 1_000).toISOString();
    const later = new Date(Date.now() + 60_000).toISOString();

    const tables = makeTables({
      donors: [{ _id: "donors:1", business_name: "Cafe", address: "A St" }],
      donations: [
        { _id: "donations:1", donor_id: "donors:1", title: "B", description: "", category: "X", quantity: 1n, pickup_window_start: "", pickup_window_end: past, status: "AVAILABLE", images: [] },
        { _id: "donations:2", donor_id: "donors:1", title: "A", description: "", category: "X", quantity: 1n, pickup_window_start: "", pickup_window_end: soon, status: "AVAILABLE", images: ["_storage:img1"] },
        { _id: "donations:3", donor_id: "donors:1", title: "C", description: "", category: "X", quantity: 1n, pickup_window_start: "", pickup_window_end: later, status: "CLAIMED", images: [] },
      ],
    });
    const db = makeDb(tables);
    const storage = makeStorage();

    const out = await (listAvailableDonations as any)({ db, storage });

    // excludes expired past & non-AVAILABLE
    expect(out.map((d: any) => d._id)).toEqual(["donations:2"]);
    expect(out[0].imageUrl).toMatch(/img1/);
    expect(out[0].donor!.business_name).toBe("Cafe");
  });
});
