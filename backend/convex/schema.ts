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

enum UserType {
  Donor = "DONOR",
  Receiver = "RECEIVER",
}

const userTypeValidator = v.union(
  v.literal("donor"),
  v.literal("receiver"),
)

export default defineSchema({
  users: defineTable({
    first_name: v.string(),
    last_name: v.string(),
    phone: v.string(),
    user_type: userTypeValidator,
    clerk_id: v.string(),
  })
    .index("by_clerk_id", ["clerk_id"]),

  donors: defineTable({
    business_name: v.string(),
    business_email: v.string(),
    business_phone: v.string(),
    address: v.string(),
    verified: v.boolean(),
  }),

  userInDonor: defineTable({
    user_id: v.id("users"),
    donors_id: v.id("donors"),
    owner: v.boolean(),
  })
    .index("by_user", ["user_id"]) 
    .index("by_donor", ["donors_id"]),
  
  recievers: defineTable({
    user_id: v.id("users"),
    individuals_id: v.optional(v.id("individuals")),
    charity_id: v.optional(v.id("charities")),
  })
    .index("by_user_id", ["user_id"]),

  charities: defineTable({
    charity_name: v.string(),
    contact_phone: v.string(),
    contact_email: v.string(),
    address: v.string(),
    verified: v.boolean(),
  }),
  
  userInCharity: defineTable({
    user_id: v.id("users"),
    charity_id: v.id("charities"),
    owner: v.boolean(),
  })
    .index("by_user", ["user_id"]) 
    .index("by_charity", ["charity_id"]),

  individuals: defineTable({
    food_allergy: v.optional(v.string()),
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
