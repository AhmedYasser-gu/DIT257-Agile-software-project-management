import { internalMutation } from "../_generated/server";

export const expireOldDonations = internalMutation(async ({ db }) => {
  const now = new Date();

  const donations = await db.query("donations").collect();

  for (const donation of donations) {
    const endIso = donation.pickup_window_end as string | undefined;
    const status = donation.status as string | undefined;

    if (!endIso) continue;

    // Expecting ISO format "YYYY-MM-DDTHH:mm:ssZ" or similar
    const end = new Date(endIso);

    // Skip invalid dates
    if (isNaN(end.getTime())) continue;

    if (end.getTime() < now.getTime() && status !== "EXPIRED") {
      await db.patch(donation._id, { status: "EXPIRED" as any });
    }
  }

  return { updatedAt: now.toISOString() };
});

