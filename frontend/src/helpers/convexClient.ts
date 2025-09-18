import { ConvexReactClient } from "convex/react";

const apiUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!apiUrl) {
  throw new Error("Missing NEXT_PUBLIC_CONVEX_URL in your .env file");
}

const convex =  new ConvexReactClient(apiUrl);

export default convex;
