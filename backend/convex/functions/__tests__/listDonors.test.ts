import { it, expect } from "vitest";
import { listDonors } from "../createUser";


it("returns donors with _id and name", async () => {
  const db = {
    query: () => ({
      collect: async () => [
        { _id: "1", business_name: "Donor A" },
        { _id: "2", business_name: "Donor B" },
      ],
    }),
  };
  const result = await listDonors({ db } as any, {});
  expect(result).toEqual([
    { _id: "1", name: "Donor A" },
    { _id: "2", name: "Donor B" },
  ]);
});
