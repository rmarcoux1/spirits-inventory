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

export function categoryLabel(category: GroceryCategory): string {
  return category.replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface GroceryItem {
  id: string;
  name: string;
  brand: string | null;
  category: GroceryCategory;
  unit: string | null;
  quantity: number;
  barcode: string | null;
  image_url: string | null;
  notes: string | null;
  on_shopping_list: boolean;
  last_price: number | null;
  created_at: string;
  updated_at: string;
}

export type NewGroceryItem = Omit<GroceryItem, "id" | "created_at" | "updated_at" | "last_price">;

export interface GroceryPurchase {
  id: string;
  item_id: string;
  price: number;
  quantity: number;
  store: string | null;
  purchased_at: string;
  created_at: string;
}

export type NewGroceryPurchase = Omit<GroceryPurchase, "id" | "item_id" | "created_at">;

export const groceryApi = {
  listItems: () => apiRequest<GroceryItem[]>("/grocery-items"),
  createItem: (item: NewGroceryItem) =>
    apiRequest<GroceryItem>("/grocery-items", { method: "POST", body: JSON.stringify(item) }),
  updateItem: (id: string, patch: Partial<NewGroceryItem>) =>
    apiRequest<GroceryItem>(`/grocery-items/${id}`, { method: "PUT", body: JSON.stringify(patch) }),
  deleteItem: (id: string) => apiRequest<void>(`/grocery-items/${id}`, { method: "DELETE" }),

  logPurchase: (itemId: string, purchase: NewGroceryPurchase) =>
    apiRequest<{ purchase: GroceryPurchase; item: GroceryItem }>(`/grocery-items/${itemId}/purchases`, {
      method: "POST",
      body: JSON.stringify(purchase),
    }),
  listPurchasesForItem: (itemId: string) => apiRequest<GroceryPurchase[]>(`/grocery-items/${itemId}/purchases`),
  listAllPurchases: () => apiRequest<GroceryPurchase[]>("/grocery-purchases"),
};
