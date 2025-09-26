import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createDonation = mutation(async ({ db }, donationData) => {
  const { description, donor_id, location, pickup_window_start, pickup_window_end, quantity, title, status, category } = donationData

  const quantityInt = BigInt(quantity);

  const newDonation = await db.insert("donations", {
    description,
    donor_id,
    location,
    pickup_window_start,
    pickup_window_end,
    quantity: quantityInt,
    title,
    status,
    category,
  });

  return newDonation;
});
