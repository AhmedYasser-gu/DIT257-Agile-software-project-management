import { mutation } from "../_generated/server";

export const createDonation = mutation(async ({ db }, donationData) => {
  const {
    description,
    donor_id,
    pickup_window_start,
    pickup_window_end,
    quantity,
    title,
    status,
    category,
    images,
  } = donationData as {
    description: string;
    donor_id: string;
    pickup_window_start: string;
    pickup_window_end: string;
    quantity: number | string | bigint;
    title: string;
    status: "AVAILABLE" | "CLAIMED" | "PICKEDUP" | "EXPIRED";
    category: string;
    images?: string[];
  };

  const quantityInt = BigInt(quantity);

  const newDonation = await db.insert("donations", {
    description,
    donor_id: donor_id as any,
    pickup_window_start,
    pickup_window_end,
    quantity: quantityInt,
    title,
    status: status as any,
    category,
    images: (images ?? []) as any,
  });

  return newDonation;
});
