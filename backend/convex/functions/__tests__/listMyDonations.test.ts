import { it, expect, vi } from "vitest";
import { listMyDonations } from "../listMyDonations";

it("returns list of donations for a donor user", async () => {
  const mockUser = { _id: "user_1" };
  const mockMemberships = [{ donors_id: "donor_1" }];
  const mockDonations = [
    {
      _id: "donation_1",
      donor_id: "donor_1",
      title: "Food Box",
      description: "A box of assorted foods",
      category: "Food",
      quantity: 5n,
      pickup_window_start: "2025-10-05T10:00:00Z",
      pickup_window_end: "2025-10-05T12:00:00Z",
      status: "AVAILABLE",
      images: ["img_1"],
      _creationTime: 1234567890,
    },
  ];
  const mockDonor = { _id: "donor_1", business_name: "Generous Foods" };

  const mockStorage = {
    getUrl: vi.fn().mockResolvedValue("https://cdn.example.com/image.jpg"),
  };

  const db = {
    query: (table: string) => {
      return {
        withIndex: (_: any, fn: any) => {
          const q = { eq: vi.fn(() => ({ collect: vi.fn(), first: vi.fn() })) };
          fn(q);
          if (table === "users") {
            return { first: vi.fn().mockResolvedValue(mockUser) };
          }
          if (table === "userInDonor") {
            return { collect: vi.fn().mockResolvedValue(mockMemberships) };
          }
          if (table === "donations") {
            return { collect: vi.fn().mockResolvedValue(mockDonations) };
          }
          return {};
        },
      };
    },
    get: vi.fn().mockResolvedValue(mockDonor),
  };

  const result = await listMyDonations({ db, storage: mockStorage } as any, {
    clerk_id: "user_clerk_123",
  });

  expect(result.length).toBe(1);
  expect(result[0]._id).toBe("donation_1");
  expect(result[0].donor?.business_name).toBe("Generous Foods");
  expect(result[0].imageUrl).toBe("https://cdn.example.com/image.jpg");
});
