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

export interface GroceryItem {
  id: string;
  name: string;
  brand: string | null;
  category: GroceryCategory;
  unit: string | null; // free text: "gal", "dozen", "lb", "each", etc.
  quantity: number; // current amount on hand
  barcode: string | null;
  image_url: string | null;
  notes: string | null;
  on_shopping_list: boolean;
  // Denormalized from the most recent purchase entry, so the item list can
  // show a current price without joining against GroceryPurchases on every
  // read. The source of truth for price history is GroceryPurchases.
  last_price: number | null;
  created_at: string;
  updated_at: string;
}

export type NewGroceryItem = Omit<GroceryItem, "id" | "created_at" | "updated_at" | "last_price">;

export interface GroceryPurchase {
  id: string;
  item_id: string;
  price: number; // total paid for this purchase
  quantity: number; // units bought at this price
  store: string | null;
  purchased_at: string; // ISO date
  created_at: string;
}

export type NewGroceryPurchase = Omit<GroceryPurchase, "id" | "item_id" | "created_at">;
