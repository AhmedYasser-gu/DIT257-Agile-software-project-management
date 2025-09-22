import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

enum DonationStatus {
  Available = "AVAILABE",
  Claimed = "CLAIMED",
  PickedUp = "PICKEDUP",
  Expired = "EXPIRED"
}

const donationStatusValidator = v.union(
  v.literal(DonationStatus.Available),
  v.literal(DonationStatus.Claimed),
  v.literal(DonationStatus.PickedUp),
  v.literal(DonationStatus.Expired)
)

enum ClaimedStatus {
  Pending = "PENDING",
  PickedUp = "PICKEDUP",
}

const claimedStatusValidator = v.union(
  v.literal(ClaimedStatus.Pending),
  v.literal(ClaimedStatus.PickedUp)
)

export default defineSchema({
  users: defineTable({
    first_name: v.string(),
    last_name: v.string(),
    address: v.string(),
    phone: v.string(),
    clerk_id: v.string(),
  }),

  donors: defineTable({
    business_name: v.string(),
    business_email: v.string(),
    business_phone: v.string(),
    clerk_id: v.string(),
    verified: v.boolean(),
  }),

  userInDonor: defineTable({
    user_id: v.id("users"),
    donors_id: v.id("donors"),
    clerk_id: v.id("users"),
    owner: v.boolean(),
  }),

  recievers: defineTable({
    individuals_id: v.optional(v.id("individuals")),
    volunteer_id: v.optional(v.id("volunteers")),
  }),

  volunteers: defineTable({
    volunteer_name: v.string(),
    contact_phone: v.string(),
    contact_email: v.string(),
    verified: v.boolean(),
    clerk_id: v.string(),
  }),

  userInVolunteer: defineTable({
    user_id: v.id("users"),
    volunteer_id: v.id("volunteers"),
    clerk_id: v.id("users"),
    owner: v.boolean(),
  }),

  individuals: defineTable({
    user_id: v.id("users"),
    food_allergy: v.string(),
    clerk_id: v.id("users"),
  }),

  donations: defineTable({
    donor_id: v.id("donors"),
    title: v.string(),
    description: v.string(),
    quantity: v.int64(),
    pickup_window_start: v.string(),
    pickup_window_end: v.string(),
    status: donationStatusValidator,
  }),

  claims: defineTable({
    donation_id: v.id("donations"),
    claimer_id: v.id("recievers"),
    amount: v.int64(),
    status: claimedStatusValidator,
  }),
});
