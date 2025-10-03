import { describe, it, expect } from "vitest";
import { getUploadUrl } from "../uploadImage";

describe("getUploadUrl", () => {
  it("returns signed upload url + default content type", async () => {
    const storage = { generateUploadUrl: async () => "http://signed-url" };
    // action(...) exports a callable fn: call it directly
    const res = await (getUploadUrl as any)({ storage }, {});
    expect(res).toEqual({ url: "http://signed-url", expectedContentType: "image/webp" });
  });

  it("respects provided content type", async () => {
    const storage = { generateUploadUrl: async () => "http://signed-url" };
    const res = await (getUploadUrl as any)(
      { storage },
      { contentType: "image/png" }
    );
    expect(res.expectedContentType).toBe("image/png");
  });
});
