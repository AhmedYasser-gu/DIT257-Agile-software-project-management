import { internalMutation } from "../_generated/server";

export const expireOldDonations = internalMutation(async ({ db }) => {
  const now = new Date();

  const donations = await db.query("donations").collect();

  for (const donation of donations) {
    const endStr = donation.pickup_window_end as string | undefined;
    const status = donation.status as string | undefined;

    if (!endStr) continue;

    // Expecting format "YYYY-MM-DD XX:XX"
    // Split date and time
    const [datePart, timePart] = endStr.split(" ");
    if (!datePart || !timePart) continue;

    // Validate date
    const [yearStr, monthStr, dayStr] = datePart.split("-");
    const [hourStr, minuteStr] = timePart.split(":");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1; // JS months are 0-based
    const day = parseInt(dayStr, 10);
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    if (
      Number.isNaN(year) ||
      Number.isNaN(month) ||
      Number.isNaN(day) ||
      Number.isNaN(hour) ||
      Number.isNaN(minute) ||
      year < 1970 ||
      month < 0 ||
      month > 11 ||
      day < 1 ||
      day > 31 ||
      hour < 0 ||
      hour > 23 ||
      minute < 0 ||
      minute > 59
    ) {
      continue;
    }

    const end = new Date(year, month, day, hour, minute, 0, 0);

    if (end.getTime() < now.getTime() && status !== "EXPIRED") {
      await db.patch(donation._id, { status: "EXPIRED" as any });
    }
  }

  return { updatedAt: now.toISOString() };
});