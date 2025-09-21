import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createDonation = mutation(async ({ db }, donationData) => {
  const { description, donorId, location, pickup_window_start, pickup_window_end, quantity, title } = donationData

  const newDonation = await db.insert("donations", {
    description,
    donorId,
    location,
    pickup_window_start,
    pickup_window_end,
    quantity,
    title,
  });

  return newDonation;
});
