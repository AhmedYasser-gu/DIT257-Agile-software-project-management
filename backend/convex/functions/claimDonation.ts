import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const claimDonation = mutation({
  args: {
    clerk_id: v.string(),
    donation_id: v.id("donations"),
    amount: v.optional(v.int64()),
  },
  handler: async ({ db }, { clerk_id, donation_id, amount }) => {
    const user = await db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerk_id", clerk_id))
      .first();
    if (!user) throw new Error("User not found");

    const receiver = await db
      .query("recievers")
      .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
      .first();
    if (!receiver) throw new Error("Receiver profile not found");

    const donation = await db.get(donation_id);
    if (!donation) throw new Error("Donation not found");
    if (donation.status !== "AVAILABLE") throw new Error("Donation is not available");

    const endStr = donation.pickup_window_end as string | undefined;
    if (endStr) {
      const normalized = endStr.includes("T") ? endStr : endStr.replace(" ", "T");
      const end = new Date(normalized);
      if (!Number.isNaN(end.getTime()) && end.getTime() < Date.now()) {
        throw new Error("Donation expired");
      }
    }

    const amt = amount ?? BigInt(1);

    await db.insert("claims", {
      donation_id,
      claimer_id: receiver._id,
      amount: amt as any,
      // Receiver sees it as claimed; the claim starts as PENDING pickup
      status: "PENDING" as any,
    });

    // instantly reflect on donors & receivers
    await db.patch(donation_id, { status: "CLAIMED" as any });

    return { ok: true };
  },
});
