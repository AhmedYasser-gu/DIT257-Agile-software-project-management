import { it, expect, vi } from "vitest";
import { ensureUserByClerkId } from "../createUser";

it("creates a new user if not exists", async () => {
  const mockInsert = vi.fn().mockResolvedValue("user_123");
  const mockQuery = () => ({
    withIndex: () => ({
      first: vi.fn().mockResolvedValue(null),
    }),
  });

  const db = {
    insert: mockInsert,
    query: mockQuery,
  };

  const result = await ensureUserByClerkId(db, {
    clerk_id: "abc",
    first_name: "Ahmed",
    last_name: "Fox",
    phone: "1234567890",
    user_type: "donor",
  });

  expect(mockInsert).toHaveBeenCalledWith("users", expect.any(Object));
  expect(result).toBe("user_123");
});
