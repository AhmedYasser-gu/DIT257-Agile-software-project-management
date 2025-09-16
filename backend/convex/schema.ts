import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

enum UserRole {
  Restaurant = "RESTAURANT",
  NGO = "NGO",
  Individual = "INDIVIDUAL",
  Store = "STORE",
  Charity = "CHARITY"
}

const roleValidator = v.union(
  v.literal(UserRole.Restaurant),
  v.literal(UserRole.NGO),
  v.literal(UserRole.Individual),
  v.literal(UserRole.Store),
  v.literal(UserRole.Charity)
)

enum DonationStatus {
  Available = "AVAILABE",
  Claimed = "CLAIMED",
  PickedUp = "PICKEDUP"
}

const donationStatusValidator = v.union(
  v.literal(DonationStatus.Available),
  v.literal(DonationStatus.Claimed),
  v.literal(DonationStatus.PickedUp)
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
    name: v.string(),
    email: v.string(),
    role: roleValidator,
    address: v.string(),
    isVerified: v.boolean(),
  }),
  donations: defineTable({
    donorId: v.id("users"),
    title: v.string(),
    description: v.string(),
    quantity: v.int64(),
    pickup_window_start: v.string(),
    pickup_window_end: v.string(),
    location: v.string(),
    status: donationStatusValidator,
  }),
  claims: defineTable({
    donationId: v.id("donations"),
    claimerId: v.id("users"),
    status: claimedStatusValidator,
  }),
});
