import { query } from "../_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";

type MyClaim = {
  _id: Id<"claims">;
  _creationTime?: number;
  status: Doc<"claims">["status"];
  amount: Doc<"claims">["amount"];
  donation: null | {
    _id: Id<"donations">;
    title: string;
    category: string;
    pickup_window_start: string;
    pickup_window_end: string;
    status: Doc<"donations">["status"];
  };
  donor: null | {
    _id: Id<"donors">;
    business_name: string;
    address: string;
  };
};

export const listMyClaims = query({
  args: { clerk_id: v.string() },
  handler: async ({ db }, { clerk_id }): Promise<MyClaim[]> => {
    const user = await db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerk_id", clerk_id))
      .first();
    if (!user) return [];

    const receiver = await db
      .query("recievers")
      .withIndex("by_user_id", (q: any) => q.eq("user_id", user._id))
      .first();
    if (!receiver) return [];

    const claims: Doc<"claims">[] = await db.query("claims").collect();

    const mine = claims
      .filter((c) => String(c.claimer_id) === String(receiver._id))
      .sort((a, b) => Number(b._creationTime) - Number(a._creationTime));

    const enriched: MyClaim[] = await Promise.all(
      mine.map(async (c) => {
        const donation = (await db.get(c.donation_id as Id<"donations">)) as Doc<"donations"> | null;
        const donor = donation ? ((await db.get(donation.donor_id as Id<"donors">)) as Doc<"donors"> | null) : null;

        return {
          _id: c._id,
          _creationTime: (c as any)._creationTime,
          status: c.status,
          amount: c.amount,
          donation:
            donation && {
              _id: donation._id,
              title: donation.title,
              category: donation.category,
              pickup_window_start: donation.pickup_window_start,
              pickup_window_end: donation.pickup_window_end,
              status: donation.status,
            },
          donor:
            donor && {
              _id: donor._id,
              business_name: donor.business_name,
              address: donor.address,
            },
        };
      })
    );

    return enriched;
  },
});
