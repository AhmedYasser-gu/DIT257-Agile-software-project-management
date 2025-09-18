export default {
  providers: [
    {
      // Set this to your Clerk JWT template issuer domain
      // Example: https://your-subdomain.clerk.accounts.dev
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
} as const;