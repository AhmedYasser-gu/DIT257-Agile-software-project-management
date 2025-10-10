import { it, expect } from "vitest";
import { listMyClaims } from "../listMyClaims";

it("returns claims for user", async () => {
  const db = {
    query: (table: string) => {
      if (table === "users") {
        return {
          withIndex: (_index: string, _cb: any) => ({
            first: async () => ({ _id: "users:1" }),
          }),
        };
      }

      if (table === "recievers") {
        return {
          withIndex: (_index: string, _cb: any) => ({
            first: async () => ({ _id: "recievers:1" }),
          }),
        };
      }

      if (table === "claims") {
        return {
          collect: async () => [
            {
              _id: "claims:1",
              claimer_id: "recievers:1",
              _creationTime: 1234,
              donation_id: "donations:1",
              status: "claimed",
              amount: 5n,
            },
          ],
        };
      }

      return {};
    },

    get: async (id: string) => {
      if (id === "donations:1") {
        return {
          _id: "donations:1",
          title: "Food Box",
          category: "Groceries",
          pickup_window_start: "09:00",
          pickup_window_end: "11:00",
          status: "AVAILABLE",
          donor_id: "donors:1",
        };
      }

      if (id === "donors:1") {
        return {
          _id: "donors:1",
          business_name: "Donor Org",
          address: "123 Street",
        };
      }

      return null;
    },
  };

  const result = await listMyClaims({ db } as any, { clerk_id: "abc" });

  expect(result).toEqual([
    {
      _id: "claims:1",
      status: "claimed",
      amount: 5n,
      donation: {
        _id: "donations:1",
        title: "Food Box",
        category: "Groceries",
        pickup_window_start: "09:00",
        pickup_window_end: "11:00",
        status: "AVAILABLE",
      },
      donor: {
        _id: "donors:1",
        business_name: "Donor Org",
        address: "123 Street",
      },
    },
  ]);
});
