import { it, expect } from "vitest";
import { getRegistrationStatus } from "../createUser";

it("returns false if user not found", async () => {
  const db = {
    query: (table: string) => ({
      withIndex: (_indexName: string, _cb: any) => ({
        first: async () => null,
      }),
    }),
  };

  const result = await getRegistrationStatus({ db } as any, { clerk_id: "nonexistent" });

  expect(result).toEqual({
    registered: false,
    userType: null,
    donorId: null,
    receiverId: null,
  });
});
