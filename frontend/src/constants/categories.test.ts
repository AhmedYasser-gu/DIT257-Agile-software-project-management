import { PRESET_FOOD_CATEGORIES } from "./categories";

describe("PRESET_FOOD_CATEGORIES", () => {
  it("is a non-empty array and contains some expected entries", () => {
    expect(Array.isArray(PRESET_FOOD_CATEGORIES)).toBe(true);
    expect(PRESET_FOOD_CATEGORIES.length).toBeGreaterThan(5);
    expect(PRESET_FOOD_CATEGORIES).toContain("Produce");
    expect(PRESET_FOOD_CATEGORIES).toContain("Bakery & Pastry");
    expect(PRESET_FOOD_CATEGORIES).toContain("Other");
  });
});
