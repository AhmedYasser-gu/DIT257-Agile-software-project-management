import { mutation } from "../_generated/server";
import { v } from "convex/values";

// Create a basic user
export const createUser = mutation({
  args: {
    first_name: v.string(),
    last_name: v.string(),
    address: v.string(),
    phone: v.string(),
    clerk_id: v.string(),
  },
  handler: async ({ db }, args) => {
    return await db.insert("users", args);
  },
});

// Create a donor (business)
export const createDonor = mutation({
  args: {
    business_name: v.string(),
    business_email: v.string(),
    business_phone: v.string(),
    verified: v.boolean(),
    clerk_id: v.string(),
  },
  handler: async ({ db }, args) => {
    return await db.insert("donors", args);
  },
});

// Link a user to a donor (ownership relation)
export const addUserToDonor = mutation({
  args: {
    user_id: v.id("users"),
    donors_id: v.id("donors"),
    owner: v.boolean(),
    clerk_id: v.id("users"),
  },
  handler: async ({ db }, args) => {
    return await db.insert("userInDonor", args);
  },
});

// Create a volunteer
export const createVolunteer = mutation({
  args: {
    volunteer_name: v.string(),
    contact_phone: v.string(),
    contact_email: v.string(),
    verified: v.boolean(),
    clerk_id: v.string(),
  },
  handler: async ({ db }, args) => {
    return await db.insert("volunteers", args);
  },
});

// Link a user to a volunteer group
export const addUserToVolunteer = mutation({
  args: {
    user_id: v.id("users"),
    volunteer_id: v.id("volunteers"),
    owner: v.boolean(),
    clerk_id: v.id("users"),
  },
  handler: async ({ db }, args) => {
    return await db.insert("userInVolunteer", args);
  },
});
