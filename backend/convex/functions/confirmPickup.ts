import { mutation } from "../_generated/server"

export const confirmPickup = mutation(async ({ db }, { claim_id }) => {
  const claim = await db.get(claim_id);
  if (!claim) throw new Error("Claim not found");

  await db.patch(claim_id , { status: "PICKEDUP" });

  if (claim.donation_id) {
    await db.patch(claim.donation_id, { status: "PICKEDUP" });
  }

  return { success: true };
})
