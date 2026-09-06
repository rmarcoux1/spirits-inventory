import { apiRequest } from "./services/http";

export type BottleType =
  | "wine"
  | "champagne"
  | "sparkling wine"
  | "whiskey"
  | "vodka"
  | "gin"
  | "rum"
  | "tequila"
  | "brandy"
  | "mezcal"
  | "liqueur";

export interface Bottle {
  id: string;
  type: BottleType;
  name: string;
  producer: string | null;
  country: string | null;
  vintage: number | null;
  proof: number | null;
  volume_ml: number | null;
  quantity: number;
  spirit_type: string | null;
  purchase_price: number | null;
  purchase_date: string | null;
  barcode: string | null;
  image_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type NewBottle = Omit<Bottle, "id" | "created_at" | "updated_at">;

export const BOTTLE_TYPES: BottleType[] = [
  "wine",
  "champagne",
  "sparkling wine",
  "whiskey",
  "vodka",
  "gin",
  "rum",
  "tequila",
  "brandy",
  "mezcal",
  "liqueur",
];

// Types where "vintage" is a meaningful field.
export const VINTAGE_TYPES: BottleType[] = ["wine", "champagne"];

// Types where "proof" is a meaningful field (i.e. spirits, not wine/bubbles).
export const SPIRIT_TYPES: BottleType[] = ["whiskey", "vodka", "gin", "rum", "tequila", "brandy", "mezcal", "liqueur"];

// Style/variety options shown as a dropdown for types that have a fairly
// standard set of categories. Types not listed here (currently none) would
// fall back to free text, but every type currently has a defined list.
export const STYLE_OPTIONS: Record<BottleType, string[]> = {
  wine: ["cabernet sauvignon", "merlot", "pinot noir", "syrah", "shiraz", "zinfandel", "pinot grigio", "sauvignon blanc", "chardonnay"],
  champagne: ["brut", "extra brut", "rosé", "blanc de blancs", "blanc de noirs", "demi-sec"],
  "sparkling wine": ["prosecco", "cava", "crémant", "moscato", "pétillant naturel"],
  whiskey: ["bourbon", "rye", "scotch", "irish", "canadian", "japanese", "tennessee", "single malt", "blended"],
  vodka: ["plain", "flavored", "wheat", "potato", "corn", "grape"],
  gin: ["london dry", "plymouth", "old tom", "navy strength", "contemporary"],
  rum: ["white", "gold", "dark", "spiced", "aged", "overproof"],
  tequila: ["blanco", "reposado", "añejo", "extra añejo", "cristalino"],
  brandy: ["cognac", "armagnac", "grappa", "pisco", "applejack"],
  mezcal: ["joven", "reposado", "añejo"],
  liqueur: ["amaretto", "triple sec", "coffee", "herbal", "cream", "fruit"],
};

const ICONS: Record<BottleType, string> = {
  wine: "🍷",
  champagne: "🍾",
  "sparkling wine": "🥂",
  whiskey: "🥃",
  vodka: "🍸",
  gin: "🌿",
  rum: "🥥",
  tequila: "🌵",
  brandy: "🍶",
  mezcal: "🐛",
  liqueur: "🍹",
};

export function typeIcon(type: BottleType): string {
  return ICONS[type] ?? "🍾";
}

export function typeLabel(type: BottleType): string {
  return type.replace(/\b\w/g, (c) => c.toUpperCase());
}

export const api = {
  listBottles: () => apiRequest<Bottle[]>("/items"),
  createBottle: (bottle: NewBottle) => apiRequest<Bottle>("/items", { method: "POST", body: JSON.stringify(bottle) }),
  updateBottle: (id: string, patch: Partial<NewBottle>) =>
    apiRequest<Bottle>(`/items/${id}`, { method: "PUT", body: JSON.stringify(patch) }),
  deleteBottle: (id: string) => apiRequest<void>(`/items/${id}`, { method: "DELETE" }),
};
