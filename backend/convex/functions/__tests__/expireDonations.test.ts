import { describe, it, expect } from "vitest";
import { makeDb, makeTables } from "../../../test/mockConvex";
import { expireOldDonations } from "../expireDonations";

describe("expireOldDonations", () => {
  it("patches past donations to EXPIRED", async () => {
    const past = new Date(Date.now() - 3600_000).toISOString();
    const future = new Date(Date.now() + 3600_000).toISOString();
    const tables = makeTables({
      donations: [
        { _id: "donations:1", status: "AVAILABLE", pickup_window_end: past },
        { _id: "donations:2", status: "AVAILABLE", pickup_window_end: future },
        { _id: "donations:3", status: "EXPIRED", pickup_window_end: past },
      ],
    });
    const db = makeDb(tables);

    await expireOldDonations({ db } as any);

    expect(tables.donations.find(d => d._id === "donations:1")!.status).toBe("EXPIRED");
    expect(tables.donations.find(d => d._id === "donations:2")!.status).toBe("AVAILABLE");
    expect(tables.donations.find(d => d._id === "donations:3")!.status).toBe("EXPIRED");
  });
});
