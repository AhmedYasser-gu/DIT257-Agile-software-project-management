import { describe, it, expect } from "vitest";
import { makeDb, makeTables } from "../../../test/mockConvex";
import { getReviewsForDonors } from "../reviews";

describe("getReviewsForDonors", () => {
  it("filters by donorIds and groups by donor_id", async () => {
    const tables = makeTables({
      reviews: [
        { _id: "reviews:1", donor_id: "donors:1", rating: 5, comment: "A" },
        { _id: "reviews:2", donor_id: "donors:2", rating: 4, comment: "B" },
        { _id: "reviews:3", donor_id: "donors:1", rating: 3, comment: "C" },
      ],
    });
    const db = makeDb(tables);

    // ✅ Call the function directly: (ctx, args)
    const res = await (getReviewsForDonors as any)(
      { db },
      { donorIds: ["donors:1"] as any }
    );

    expect(Object.keys(res)).toEqual(["donors:1"]);
    expect(res["donors:1"].map((r: any) => r._id)).toEqual(["reviews:1", "reviews:3"]);
  });
});
