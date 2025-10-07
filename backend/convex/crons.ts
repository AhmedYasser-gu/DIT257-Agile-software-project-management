import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
//we can add more crons here if needed
const crons = cronJobs();

crons.daily(
  "Expire old donations at midnight",
  { hourUTC: 0, minuteUTC: 0 }, // 00:00 UTC
  (internal as any).functions.expireDonations.expireOldDonations
);

// Run every 5 minutes to reopen timed-out claims
crons.interval(
  "Reopen donations after claim time-up",
  { minutes: 1 },
  (internal as any).functions.expireDonations.handleTimedOutClaims
);

export default crons;
