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
  // Preserved from the original Supabase export for reference; unused by
  // the app itself while there's no per-user auth (see auth.ts).
  user_id?: string | null;
  created_at: string;
  updated_at: string;
}

export type NewBottle = Omit<Bottle, "id" | "created_at" | "updated_at">;
