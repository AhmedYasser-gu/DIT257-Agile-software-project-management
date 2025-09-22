import { internalMutation } from "../_generated/server";

export const expireOldDonations = internalMutation(async ({ db }) => {
  const now = new Date();
  const nowHours = now.getHours();
  const nowMinutes = now.getMinutes();

  const donations = await db.query("donations").collect();

  for (const donation of donations) {
    const endStr = donation.pickup_window_end as string | undefined;
    const status = donation.status as string | undefined;

    if (!endStr) continue;

    const [endHourStr, endMinuteStr] = endStr.split(":");
    const endHour = parseInt(endHourStr, 10);
    const endMinute = parseInt(endMinuteStr, 10);

    if (
      Number.isNaN(endHour) ||
      Number.isNaN(endMinute) ||
      endHour < 0 ||
      endHour > 23 ||
      endMinute < 0 ||
      endMinute > 59
    ) {
      continue;
    }

    const end = new Date(now);
    end.setHours(endHour, endMinute, 0, 0);

    if (end.getTime() < now.getTime() && status !== "EXPIRED") {
      await db.patch(donation._id, { status: "EXPIRED" as any });
    }
  }

  return { updatedAt: now.toISOString() };
});


