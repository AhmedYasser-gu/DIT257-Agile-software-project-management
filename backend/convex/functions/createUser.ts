import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// Helper to ensure a user exists, returns user _id
async function ensureUserByClerkId(
  db: any,
  args: { clerk_id: string; first_name: string; last_name: string; phone: string; user_type: string }
) {
  const existing = await db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerk_id", args.clerk_id))
    .first();
  if (existing) return existing._id;
  const userId = await db.insert("users", {
    first_name: args.first_name,
    last_name: args.last_name,
    phone: args.phone,
    user_type: args.user_type,
    clerk_id: args.clerk_id,
  });
  return userId;
}

// Register donor: ensure user then create donor record if missing
export const registerDonor = mutation({
  args: {
    clerk_id: v.string(),
    first_name: v.string(),
    last_name: v.string(),
    phone: v.string(),
    // Option A: join existing donor org
    donors_id: v.optional(v.id("donors")),
    // Option B: create new org inline (if donors_id not provided)
    address: v.optional(v.string()),
    business_name: v.optional(v.string()),
    business_email: v.optional(v.string()),
    business_phone: v.optional(v.string()),
  },
  handler: async ({ db }, args) => {
    const userId = await ensureUserByClerkId(db, {
      clerk_id: args.clerk_id,
      first_name: args.first_name,
      last_name: args.last_name,
      phone: args.phone,
      user_type: "donor",
    });

    // If joining existing organization
    if (args.donors_id) {
      const existingMembership = await db
        .query("userInDonor")
        .withIndex("by_user", (q: any) => q.eq("user_id", userId))
        .first();
      if (!existingMembership) {
        await db.insert("userInDonor", { user_id: userId, donors_id: args.donors_id, owner: false });
      }
      return { userId, donorId: args.donors_id };
    }

    // Check membership in userInDonor (already donor)
    const existingMembership = await db
      .query("userInDonor")
      .withIndex("by_user", (q: any) => q.eq("user_id", userId))
      .first();
    if (existingMembership) {
      return { userId, donorId: existingMembership.donors_id };
    }

    // Create donor, then membership with owner=true
    if (!args.business_name || !args.business_email || !args.business_phone || !args.address) {
      throw new Error("Missing organization fields for new donor creation");
    }
    const donorId = await db.insert("donors", {
      business_name: args.business_name,
      business_email: args.business_email,
      business_phone: args.business_phone,
      address: args.address,
      verified: false,
    });
    await db.insert("userInDonor", { user_id: userId, donors_id: donorId, owner: true });
    return { userId, donorId };
  },
});

// Register receiver: ensure user then create individual and receiver rows
export const registerReceiver = mutation({
  args: {
    clerk_id: v.string(),
    first_name: v.string(),
    last_name: v.string(),
    phone: v.string(),
    food_allergy: v.optional(v.string()),
    charity_id: v.optional(v.id("charities")),
    // Inline charity creation fields (if no charity_id)
    charity_name: v.optional(v.string()),
    charity_contact_phone: v.optional(v.string()),
    charity_contact_email: v.optional(v.string()),
    charity_address: v.optional(v.string()),
  },
  handler: async ({ db }, args) => {
    const userId = await ensureUserByClerkId(db, {
      clerk_id: args.clerk_id,
      first_name: args.first_name,
      last_name: args.last_name,
      phone: args.phone,
      user_type: "receiver",
    });

    const existingReceiver = await db
      .query("recievers")
      .withIndex("by_user_id", (q: any) => q.eq("user_id", userId))
      .first();
    if (existingReceiver) {
      return { userId, receiverId: existingReceiver._id };
    }

    let individualsId: any = undefined;
    let charityId: any = args.charity_id ?? undefined;
    let createdNewCharity = false;

    // If no charity selected but charity fields provided, create charity
    if (!charityId && args.charity_name && args.charity_contact_email && args.charity_contact_phone && args.charity_address) {
      charityId = await db.insert("charities", {
        charity_name: args.charity_name,
        contact_phone: args.charity_contact_phone,
        contact_email: args.charity_contact_email,
        address: args.charity_address,
        verified: false,
      });
      createdNewCharity = true;
    }

    // If still no charity, register as individual
    if (!charityId) {
      individualsId = await db.insert("individuals", {
        food_allergy: args.food_allergy,
      });
    }

    const receiverId = await db.insert("recievers", {
      user_id: userId,
      individuals_id: individualsId,
      charity_id: charityId,
    });

    // If charity-based receiver, ensure membership in userInCharity
    if (charityId) {
      const existingMembership = await db
        .query("userInCharity")
        .withIndex("by_user", (q: any) => q.eq("user_id", userId))
        .first();
      if (!existingMembership || existingMembership.charity_id !== charityId) {
        await db.insert("userInCharity", {
          user_id: userId,
          charity_id: charityId,
          owner: createdNewCharity ? true : false,
        });
      }
    }

    return { userId, receiverId };
  },
});

// Query: registration status and user type by Clerk id
export const getRegistrationStatus = query({
  args: { clerk_id: v.string() },
  handler: async ({ db }, { clerk_id }) => {
    const user = await db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerk_id", clerk_id))
      .first();
    if (!user) {
      return { registered: false as const, userType: null as null, donorId: null as null, receiverId: null as null };
    }

    // donor via membership
    const donorMembership = await db
      .query("userInDonor")
      .withIndex("by_user", (q: any) => q.eq("user_id", user._id))
      .first();
    if (donorMembership) {
      return { registered: true as const, userType: "donor" as const, donorId: donorMembership.donors_id, receiverId: null as null };
    }

    const receiver = await db
      .query("recievers")
      .withIndex("by_user_id", (q: any) => q.eq("user_id", user._id))
      .first();
    if (receiver) {
      return { registered: true as const, userType: "receiver" as const, donorId: null as null, receiverId: receiver._id };
    }

    return { registered: false as const, userType: null as null, donorId: null as null, receiverId: null as null };
  },
});

// Query: list donor organizations for selection
export const listDonors = query({
  args: {},
  handler: async ({ db }) => {
    const list = await db.query("donors").collect();
    return list.map((d) => ({ _id: d._id, name: d.business_name }));
  },
});

// Query: list charities for selection
export const listCharities = query({
  args: {},
  handler: async ({ db }) => {
    const list = await db.query("charities").collect();
    return list.map((c) => ({ _id: c._id, name: c.charity_name }));
  },
});

// Create Charity organization and make user owner
export const createCharityOrganization = mutation({
  args: {
    clerk_id: v.string(),
    first_name: v.string(),
    last_name: v.string(),
    phone: v.string(),
    charity_name: v.string(),
    contact_phone: v.string(),
    contact_email: v.string(),
    address: v.string(),
  },
  handler: async ({ db }, args) => {
    const userId = await ensureUserByClerkId(db, {
      clerk_id: args.clerk_id,
      first_name: args.first_name,
      last_name: args.last_name,
      phone: args.phone,
      user_type: "receiver",
    });
    const charityId = await db.insert("charities", {
      charity_name: args.charity_name,
      contact_phone: args.contact_phone,
      contact_email: args.contact_email,
      address: args.address,
      verified: false,
    });
    await db.insert("userInCharity", {
      user_id: userId,
      charity_id: charityId,
      owner: true,
    });
    return { userId, charityId };
  },
});

// Create Donor organization (business) without registering the user as donor
export const createDonorOrganization = mutation({
  args: {
    clerk_id: v.string(),
    first_name: v.string(),
    last_name: v.string(),
    phone: v.string(),
    business_name: v.string(),
    business_email: v.string(),
    business_phone: v.string(),
    address: v.string(),
  },
  handler: async ({ db }, args) => {
    // Ensure user exists but do NOT create membership yet
    await ensureUserByClerkId(db, {
      clerk_id: args.clerk_id,
      first_name: args.first_name,
      last_name: args.last_name,
      phone: args.phone,
      user_type: "donor",
    });

    const donorId = await db.insert("donors", {
      business_name: args.business_name,
      business_email: args.business_email,
      business_phone: args.business_phone,
      address: args.address,
      verified: false,
    });
    return { donorId };
  },
});

// Query: fetch full profile by Clerk ID (user + role-specific data)
export const getProfileByClerkId = query({
  args: { clerk_id: v.string() },
  handler: async ({ db }, { clerk_id }) => {
    const user = await db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerk_id", clerk_id))
      .first();
    if (!user) return null;

    // Determine role via memberships/links
    const donorMembership = await db
      .query("userInDonor")
      .withIndex("by_user", (q: any) => q.eq("user_id", user._id))
      .first();

    if (donorMembership) {
      const donor = await db.get(donorMembership.donors_id);
      return {
        user: {
          _id: user._id,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          user_type: user.user_type,
        },
        type: "donor" as const,
        donor_owner: !!donorMembership.owner,
        donor: donor && {
          _id: donor._id,
          business_name: donor.business_name,
          business_email: donor.business_email,
          business_phone: donor.business_phone,
          address: donor.address,
          verified: donor.verified,
        },
      };
    }

    const receiver = await db
      .query("recievers")
      .withIndex("by_user_id", (q: any) => q.eq("user_id", user._id))
      .first();

    if (receiver) {
      const individual = receiver.individuals_id ? await db.get(receiver.individuals_id) : null;
      const charity = receiver.charity_id ? await db.get(receiver.charity_id) : null;
      // Determine charity ownership
      let charityOwner = false;
      if (receiver.charity_id) {
        const membership = await db
          .query("userInCharity")
          .withIndex("by_user", (q: any) => q.eq("user_id", user._id))
          .first();
        if (membership && membership.charity_id === receiver.charity_id && membership.owner) {
          charityOwner = true;
        }
      }
      return {
        user: {
          _id: user._id,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          user_type: user.user_type,
        },
        type: "receiver" as const,
        charity_owner: charityOwner,
        receiver: {
          _id: receiver._id,
          individuals_id: receiver.individuals_id ?? null,
          charity_id: receiver.charity_id ?? null,
          individual: individual && { _id: individual._id, food_allergy: individual.food_allergy ?? null },
          charity:
            charity && {
              _id: charity._id,
              charity_name: charity.charity_name,
              contact_phone: charity.contact_phone,
              contact_email: charity.contact_email,
              address: charity.address,
              verified: charity.verified,
            },
        },
      };
    }

    return {
      user: {
        _id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        user_type: user.user_type,
      },
      type: null,
    } as const;
  },
});

// Mutation: update profile (user + role-specific data)
export const updateProfile = mutation({
  args: {
    user_id: v.id("users"),
    // Always allowed
    first_name: v.optional(v.string()),
    last_name: v.optional(v.string()),
    phone: v.optional(v.string()),

    // Donor-specific (if editing as donor)
    donor_id: v.optional(v.id("donors")),
    business_name: v.optional(v.string()),
    business_email: v.optional(v.string()),
    business_phone: v.optional(v.string()),
    address: v.optional(v.string()),

    // Receiver-specific
    receiver_id: v.optional(v.id("recievers")),
    individuals_id: v.optional(v.id("individuals")),
    charity_id: v.optional(v.id("charities")),
    food_allergy: v.optional(v.string()),

    // Charity organization fields (editable only by owners)
    charity_name: v.optional(v.string()),
    charity_contact_phone: v.optional(v.string()),
    charity_contact_email: v.optional(v.string()),
    charity_address: v.optional(v.string()),
  },
  handler: async ({ db }, args) => {
    // Update base user fields
    const { user_id, first_name, last_name, phone } = args;
    const updates: any = {};
    if (first_name !== undefined) updates.first_name = first_name;
    if (last_name !== undefined) updates.last_name = last_name;
    if (phone !== undefined) updates.phone = phone;
    if (Object.keys(updates).length) {
      await db.patch(user_id, updates);
    }

    // Donor-specific
    if (args.donor_id) {
      // Ensure the user is an owner of this donor organization before editing its fields
      const membership = await db
        .query("userInDonor")
        .withIndex("by_user", (q: any) => q.eq("user_id", user_id))
        .first();
      if (!membership || membership.donors_id !== args.donor_id || !membership.owner) {
        throw new Error("Not authorized to edit donor organization");
      }
      const donorUpdates: any = {};
      if (args.business_name !== undefined) donorUpdates.business_name = args.business_name;
      if (args.business_email !== undefined) donorUpdates.business_email = args.business_email;
      if (args.business_phone !== undefined) donorUpdates.business_phone = args.business_phone;
      if (args.address !== undefined) donorUpdates.address = args.address;
      if (Object.keys(donorUpdates).length) {
        await db.patch(args.donor_id, donorUpdates);
      }
    }

    // Receiver-specific
    if (args.receiver_id) {
      // Verify receiver belongs to this user
      const receiverDoc = await db.get(args.receiver_id);
      if (!receiverDoc || receiverDoc.user_id !== user_id) {
        throw new Error("Not authorized to edit receiver profile");
      }
      // Update individual if present
      if (args.individuals_id && args.food_allergy !== undefined) {
        await db.patch(args.individuals_id, { food_allergy: args.food_allergy });
      }
      // Update charity details when owner
      if (args.charity_id && (
        args.charity_name !== undefined ||
        args.charity_contact_phone !== undefined ||
        args.charity_contact_email !== undefined ||
        args.charity_address !== undefined
      )) {
        const membership = await db
          .query("userInCharity")
          .withIndex("by_user", (q: any) => q.eq("user_id", user_id))
          .first();
        if (!membership || membership.charity_id !== args.charity_id || !membership.owner) {
          throw new Error("Not authorized to edit charity organization");
        }
        const charityUpdates: any = {};
        if (args.charity_name !== undefined) charityUpdates.charity_name = args.charity_name;
        if (args.charity_contact_phone !== undefined) charityUpdates.contact_phone = args.charity_contact_phone;
        if (args.charity_contact_email !== undefined) charityUpdates.contact_email = args.charity_contact_email;
        if (args.charity_address !== undefined) charityUpdates.address = args.charity_address;
        if (Object.keys(charityUpdates).length) {
          await db.patch(args.charity_id, charityUpdates);
        }
      }
    }

    return { ok: true } as const;
  },
});
