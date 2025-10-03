import { action } from "../_generated/server";
import { v } from "convex/values";

/**
 * Returns a Convex signed upload URL that the client can POST the processed WebP to.
 * The client must send an already metadata-stripped, compressed WebP image.
 */
export const getUploadUrl = action({
  args: { contentType: v.optional(v.string()) },
  handler: async ({ storage }, { contentType }) => {
    const url = await storage.generateUploadUrl();
    return { url, expectedContentType: contentType ?? "image/webp" };
  },
});


