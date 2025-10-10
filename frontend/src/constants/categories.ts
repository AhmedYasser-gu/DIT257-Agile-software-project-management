export const PRESET_FOOD_CATEGORIES = [
  "Produce",                 // fruit & veg
  "Prepared Meals",
  "Bakery & Pastry",
  "Dairy & Eggs",
  "Meat & Poultry",
  "Seafood",
  "Pantry & Dry Goods",
  "Frozen",
  "Snacks",
  "Beverages",
  "Baby & Kids",
  "Special Diet (Vegan/Vegetarian/Gluten‑Free)",
  "Other",
] as const;

// Allow custom, user-typed values too (string keeps your backend unchanged)
export type FoodCategory = string;
