import { query } from "../_generated/server";
import { v } from "convex/values";

export const getAllDonors = query({
  args: { clerk_id: v.string() },
  handler: async ({ db }, { clerk_id }) => {

    const userRecord = await db.query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerk_id", clerk_id))
      .first();

    if (!userRecord) {
      console.log("No user found for clerk_id:", clerk_id);
      return [];
    }


    const userId = userRecord._id;

    const records = await db.query("userInDonor")
      .withIndex("by_user", (q: any) => q.eq("user_id", userId))
      .collect();

    if (records.length === 0) {
      console.log('No donor records found for user_id', userId);
      return [];
    }

    const donorIds = records.map(record => record.donors_id);

    const donors = await Promise.all(donorIds.map(donorId => db.get(donorId)));

    return donors;
  }
});
