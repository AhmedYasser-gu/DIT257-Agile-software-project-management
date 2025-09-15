export const FOOD_CATEGORIES = [
  "Bakery", "Produce", "Meals", "Dairy", "Meat", "Seafood", "Dry Goods", "Other",
] as const;
export type FoodCategory = typeof FOOD_CATEGORIES[number];
