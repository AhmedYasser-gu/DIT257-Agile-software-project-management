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

// New: reopen donations when claim 30-minute window has elapsed
export const handleTimedOutClaims = internalMutation(async ({ db }) => {
  const now = Date.now();

  // Get all claims with status "PENDING"
  const claims = await db.query("claims").collect();

  for (const claim of claims) {
    if (claim.status !== "PENDING") continue;

    // Get the associated donation
    const donation = await db.get(claim.donation_id);
    if (!donation) continue;

    // Parse claim creation time
    const claimCreated = typeof claim._creationTime === "number" ? claim._creationTime : NaN;

    // Parse donation pickup window start time
    let pickupStart = NaN;
    if (donation.pickup_window_start) {
      const s = donation.pickup_window_start;
      const hasTZ = /[zZ]|[\+\-]\d{2}:?\d{2}$/.test(s);
      const base = s.includes("T") ? s : s.replace(" ", "T");
      const normalized = hasTZ ? base : `${base}Z`;
      const t = new Date(normalized).getTime();
      pickupStart = Number.isNaN(t) ? NaN : (hasTZ ? t : t - 2 * 60 * 60 * 1000);
    }

    // Calculate claim expiry times
    const claimExpiry = Number.isNaN(claimCreated) ? -Infinity : claimCreated + 60 * 60 * 1000;
    const pickupExpiry = Number.isNaN(pickupStart) ? -Infinity : pickupStart + 60 * 60 * 1000;

    // Use the later of the two
    const effectiveExpiry = Math.max(claimExpiry, pickupExpiry);

    if (now > effectiveExpiry) {
      // Set claim status to "TIMESUP" and donation status to "AVAILABLE"
      await db.patch(claim._id, { status: "TIMESUP" as any });
      await db.patch(donation._id, { status: "AVAILABLE" as any });
    }
  }
});

