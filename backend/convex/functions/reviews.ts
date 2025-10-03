import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const addReview = mutation({
  args: {
    donor_id: v.id("donors"),
    reciever_id: v.id("recievers"),
    rating: v.number(),
    comment: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("reviews", args);
  },
});

export const updateReview = mutation({
  args: {
    reviewId: v.id("reviews"),
    rating: v.number(),
    comment: v.string(),
  },
  handler: async (ctx, { reviewId, rating, comment }) => {
    await ctx.db.patch(reviewId, { rating, comment });
  },
});

export const deleteReview = mutation({
  args: { reviewId: v.id("reviews") },
  handler: async (ctx, { reviewId }) => {
    await ctx.db.delete(reviewId);
  },
});

export const listDonorsWithReviews = query({
  handler: async (ctx) => {
    const donors = await ctx.db.query("donors").collect();
    const reviews = await ctx.db.query("reviews").collect();
    const responses = await ctx.db.query("responses").collect();

    return donors.map((donor) => {
      const donorReviews = reviews.filter((r) => r.donor_id === donor._id);
      const avgRating =
        donorReviews.length > 0
          ? donorReviews.reduce((sum, r) => sum + r.rating, 0) /
            donorReviews.length
          : null;

      const withResponses = donorReviews.map((r) => ({
        ...r,
        response: responses.find((resp) => resp.review_id === r._id) || null,
      }));

      return {
        ...donor,
        avgRating,
        reviewCount: donorReviews.length,
        reviews: withResponses,
      };
    });
  },
});

export const listReviewsForDonor = query({
  args: { donorId: v.id("donors") },
  handler: async (ctx, { donorId }) => {
    const donor = await ctx.db.get(donorId);
    if (!donor) throw new Error("Donor not found");

    const reviews = await ctx.db
      .query("reviews")
      .filter((q) => q.eq(q.field("donor_id"), donorId))
      .order("desc")
      .collect();

    const responses = await ctx.db.query("responses").collect();

    const recievers = await ctx.db.query("recievers").collect();
    const users = await ctx.db.query("users").collect();
    const charities = await ctx.db.query("charities").collect();

    const reviewsWithNames = reviews.map((r) => {
      const rec = recievers.find((rec) => rec._id === r.reciever_id);

      let name = "Unknown";
      if (rec) {
        if (rec.individuals_id) {
          const user = users.find((u) => u._id === rec.user_id);
          if (user) name = `${user.first_name} ${user.last_name}`;
        } else if (rec.charity_id) {
          const charity = charities.find((c) => c._id === rec.charity_id);
          if (charity) name = charity.charity_name;
        }
      }

      return {
        ...r,
        name,
        response: responses.find((resp) => resp.review_id === r._id) || null,
      };
    });

    return { donor, reviews: reviewsWithNames };
  },
});

export const getReceiverByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const userRow = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerk_id", userId))
      .unique();

    if (!userRow) return null;

    return await ctx.db
      .query("recievers")
      .withIndex("by_user_id", (q) => q.eq("user_id", userRow._id))
      .unique();
  },
});

export const addOrUpdateResponse = mutation({
  args: {
    reviewId: v.id("reviews"),
    donorId: v.id("donors"),
    response: v.string(),
  },
  handler: async (ctx, { reviewId, donorId, response }) => {
    const existing = await ctx.db
      .query("responses")
      .filter((q) =>
        q.and(
          q.eq(q.field("review_id"), reviewId),
          q.eq(q.field("donor_id"), donorId)
        )
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { response });
    } else {
      await ctx.db.insert("responses", {
        review_id: reviewId,
        donor_id: donorId,
        response,
      });
    }
  },
});

export const deleteResponse = mutation({
  args: { responseId: v.id("responses") },
  handler: async (ctx, { responseId }) => {
    await ctx.db.delete(responseId);
  },
});

export const isDonorOwner = query({
  args: { userId: v.string(), donorId: v.id("donors") },
  handler: async (ctx, { userId, donorId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerk_id", userId))
      .unique();

    if (!user) return false;

    const link = await ctx.db
      .query("userInDonor")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .filter((q) => q.eq(q.field("donors_id"), donorId))
      .unique();

    return !!(link && link.owner);
  },
});

export const getReviewsForDonors = query({
  args: { donorIds: v.array(v.id("donors")) },
  handler: async (ctx, { donorIds }) => {
    // Fetch all reviews (or use a query to limit if DB grows)
    const allReviews = await ctx.db.query("reviews").collect();

    // Compare by string representation of IDs
    const filtered = allReviews.filter((r) =>
      donorIds.map((id) => id.toString()).includes(r.donor_id.toString())
    );

    // Group by donor_id
    const grouped: Record<string, typeof filtered> = {};
    for (const r of filtered) {
      const key = r.donor_id.toString();
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    }
    return grouped;
  },
});
