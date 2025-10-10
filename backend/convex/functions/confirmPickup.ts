import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const confirmPickup = mutation({
  args: {
    claim_id: v.id("claims"),
  },
  handler: async ({ db }, { claim_id }) => {
    const claim = await db.get(claim_id);
    if (!claim) throw new Error("Claim not found");

    await db.patch(claim_id, { status: "PICKEDUP" });

    if (claim.donation_id) {
      await db.patch(claim.donation_id, { status: "PICKEDUP" });
    }

    return { success: true };
  },
});
