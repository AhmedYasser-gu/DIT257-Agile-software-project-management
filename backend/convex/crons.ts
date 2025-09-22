import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
//we can add more crons here if needed
const crons = cronJobs();

crons.daily(
  "Expire old donations at midnight",
  { hourUTC: 0, minuteUTC: 0 }, // 00:00 UTC
  (internal as any).functions.expireDonations.expireOldDonations
);

export default crons;
