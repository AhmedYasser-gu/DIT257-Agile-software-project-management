import { mutation } from "../_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";

export const confirmPickup = mutation({
  args: {
    claim_id: v.id("claims"),
  },
  handler: async ({ db }, { claim_id }) => {
    const claim = await db.get(claim_id);
    if (!claim) throw new Error("Claim not found");

    await db.patch(claim_id, { status: "PICKEDUP" as Doc<"claims">["status"] });

    if (claim.donation_id) {
      await db.patch(claim.donation_id as Id<"donations">, {
        status: "PICKEDUP" as Doc<"donations">["status"],
      });
    }

    return { success: true };
  },
});
