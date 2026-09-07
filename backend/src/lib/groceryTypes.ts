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

// The on-hand pantry inventory — what you have and how much. Deliberately
// has nothing to do with the shopping list (see ShoppingListItem below):
// this is "what's in the house," not "what to buy."
export interface GroceryItem {
  id: string;
  name: string;
  brand: string | null;
  category: GroceryCategory;
  unit: string | null; // free text: "gal", "dozen", "lb", "each", etc.
  quantity: number; // current amount on hand
  is_staple: boolean; // buy every week — see "Add all staples" on the shopping list
  barcode: string | null;
  image_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type NewGroceryItem = Omit<GroceryItem, "id" | "created_at" | "updated_at">;

// The shopping list — a lightweight, standalone "things to buy" list.
// Intentionally not linked to a GroceryItem by any foreign key: adding
// "paper towels" doesn't require it to already exist (or ever exist) as a
// tracked inventory item, and checking it off doesn't touch inventory
// quantity. The one bridge is by name — see the frontend's GroceryDashboard,
// which lets you star an inventory item to add/remove it here, matching on
// name rather than a stored link.
export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number; // how many you need to buy — adjust with +/- once it's on the list
  note: string | null;
  created_at: string;
  updated_at: string;
}

export type NewShoppingListItem = Omit<ShoppingListItem, "id" | "created_at" | "updated_at">;

// A recipe's ingredient list is intentionally just names — no quantities or
// units. "Missing" means "you don't have any of this at all," not "you
// don't have enough for this recipe specifically." Real unit-aware
// shortfall math (2 cups flour vs. a 5lb bag on hand) would need a
// conversion table per ingredient; this keeps things fast to enter and
// good enough to be useful without that rabbit hole.
export interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  instructions: string | null;
  created_at: string;
  updated_at: string;
}

export type NewRecipe = Omit<Recipe, "id" | "created_at" | "updated_at">;
