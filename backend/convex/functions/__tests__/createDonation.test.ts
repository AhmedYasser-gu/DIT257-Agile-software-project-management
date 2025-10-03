import { describe, it, expect, vi } from "vitest";
import { makeDb, makeTables } from "../../../test/mockConvex";
import { createDonation } from "../createDonation";

describe("createDonation", () => {
  it("coerces quantity to BigInt and inserts", async () => {
    const tables = makeTables({ donations: [] });
    const db = makeDb(tables);

    const id = await createDonation({ db } as any, {
      description: "Desc",
      donor_id: "donors:1",
      pickup_window_start: "2025-01-01T10:00",
      pickup_window_end: "2025-01-01T12:00",
      quantity: "3",
      title: "Soup",
      status: "AVAILABLE",
      category: "Prepared Meals",
      images: [],
    });

    const row = tables.donations.find(d => d._id === id)!;
    expect(row).toBeTruthy();
    expect(row.quantity).toBe(BigInt(3));
    expect(row.status).toBe("AVAILABLE");
  });
});
