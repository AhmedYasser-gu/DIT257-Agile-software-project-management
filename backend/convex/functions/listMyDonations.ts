import { query } from "../_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";

type OutDonation = {
  _id: Id<"donations">;
  title: string;
  description?: string;
  category: string;
  quantity: Doc<"donations">["quantity"];
  pickup_window_start?: string;
  pickup_window_end?: string;
  status: Doc<"donations">["status"];
  donor: { _id: Id<"donors">; business_name: string } | null;
};

export const listMyDonations = query({
  args: { clerk_id: v.string() },
  handler: async ({ db }, { clerk_id }): Promise<OutDonation[]> => {
    // 1) Find Convex user
    const user = await db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerk_id", clerk_id))
      .first();
    if (!user) return [];

    // 2) User's memberships in donors
    const memberships: Doc<"userInDonor">[] = await db
      .query("userInDonor")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .collect();
    if (memberships.length === 0) return [];

    // 3) All donations posted by any donor org the user belongs to
    const all: Doc<"donations">[] = [];
    for (const m of memberships) {
      const rows = await db
        .query("donations")
        .withIndex("by_donor", (q) => q.eq("donor_id", m.donors_id))
        .collect();
      all.push(...rows);
    }

    all.sort((a, b) => Number(b._creationTime) - Number(a._creationTime));

    // 4) Enrich with donor info
    const enriched: OutDonation[] = await Promise.all(
      all.map(async (d) => {
        const donor = await db.get(d.donor_id as Id<"donors">);
        return {
          _id: d._id,
          title: d.title,
          description: d.description,
          category: d.category,
          quantity: d.quantity,
          pickup_window_start: d.pickup_window_start,
          pickup_window_end: d.pickup_window_end,
          status: d.status,
          donor: donor
            ? { _id: donor._id, business_name: donor.business_name }
            : null,
        };
      })
    );

    return enriched;
  },
});
