import { apiRequest } from "./services/http";

export type GroceryCategory =
  | "produce"
  | "dairy & eggs"
  | "meat & seafood"
  | "bakery"
  | "pantry"
  | "frozen"
  | "beverages"
  | "beer"
  | "snacks"
  | "household"
  | "personal care"
  | "other";

export const GROCERY_CATEGORIES: GroceryCategory[] = [
  "produce",
  "dairy & eggs",
  "meat & seafood",
  "bakery",
  "pantry",
  "frozen",
  "beverages",
  "beer",
  "snacks",
  "household",
  "personal care",
  "other",
];

const CATEGORY_ICONS: Record<GroceryCategory, string> = {
  produce: "🥬",
  "dairy & eggs": "🥛",
  "meat & seafood": "🥩",
  bakery: "🍞",
  pantry: "🥫",
  frozen: "🧊",
  beverages: "🧃",
  beer: "🍺",
  snacks: "🍿",
  household: "🧻",
  "personal care": "🧴",
  other: "🛒",
};

export function categoryIcon(category: GroceryCategory): string {
  return CATEGORY_ICONS[category] ?? "🛒";
}

export function categoryLabel(category: GroceryCategory | null | undefined): string {
  if (!category) return "Uncategorized";
  return category.replace(/\b\w/g, (c) => c.toUpperCase());
}

// --- On-hand inventory (the pantry) ------------------------------------

export interface GroceryItem {
  id: string;
  name: string;
  brand: string | null;
  category: GroceryCategory;
  unit: string | null;
  quantity: number;
  is_staple: boolean;
  barcode: string | null;
  image_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type NewGroceryItem = Omit<GroceryItem, "id" | "created_at" | "updated_at">;

// --- Shopping list (standalone, not linked to inventory) ---------------

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export type NewShoppingListItem = Omit<ShoppingListItem, "id" | "created_at" | "updated_at">;

export const groceryApi = {
  listItems: () => apiRequest<GroceryItem[]>("/grocery-items"),
  createItem: (item: NewGroceryItem) =>
    apiRequest<GroceryItem>("/grocery-items", { method: "POST", body: JSON.stringify(item) }),
  updateItem: (id: string, patch: Partial<NewGroceryItem>) =>
    apiRequest<GroceryItem>(`/grocery-items/${id}`, { method: "PUT", body: JSON.stringify(patch) }),
  deleteItem: (id: string) => apiRequest<void>(`/grocery-items/${id}`, { method: "DELETE" }),
};

export const shoppingListApi = {
  listItems: () => apiRequest<ShoppingListItem[]>("/shopping-list-items"),
  createItem: (item: NewShoppingListItem) =>
    apiRequest<ShoppingListItem>("/shopping-list-items", { method: "POST", body: JSON.stringify(item) }),
  updateItem: (id: string, patch: Partial<NewShoppingListItem>) =>
    apiRequest<ShoppingListItem>(`/shopping-list-items/${id}`, { method: "PUT", body: JSON.stringify(patch) }),
  deleteItem: (id: string) => apiRequest<void>(`/shopping-list-items/${id}`, { method: "DELETE" }),
};
