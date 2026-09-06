import type { BottleType } from "./types.js";

const SPIRIT_TYPES: BottleType[] = ["whiskey", "vodka", "gin", "rum", "tequila", "brandy", "mezcal", "liqueur"];

export function isSpiritType(type: BottleType | undefined): boolean {
  return !!type && SPIRIT_TYPES.includes(type);
}

export function guessType(title: string): BottleType | undefined {
  const t = title.toLowerCase();
  if (/champagne/.test(t)) return "champagne";
  if (/(prosecco|sparkling|cava|crémant)/.test(t)) return "sparkling wine";
  if (/mezcal/.test(t)) return "mezcal";
  if (/tequila/.test(t)) return "tequila";
  if (/(bourbon|whiskey|whisky|rye|scotch)/.test(t)) return "whiskey";
  if (/\bvodka\b/.test(t)) return "vodka";
  if (/\bgin\b/.test(t)) return "gin";
  if (/\brum\b/.test(t)) return "rum";
  if (/(brandy|cognac|armagnac)/.test(t)) return "brandy";
  if (/(liqueur|amaretto|schnapps|triple sec)/.test(t)) return "liqueur";
  if (/(wine|cabernet|merlot|pinot|chardonnay|riesling|syrah|malbec|zinfandel)/.test(t)) return "wine";
  return undefined;
}

export function guessSpiritType(title: string, type: BottleType | undefined): string | undefined {
  const t = title.toLowerCase();

  const stylesByType: Partial<Record<BottleType, string[]>> = {
    whiskey: ["bourbon", "rye", "scotch", "irish", "canadian", "japanese", "tennessee", "single malt", "blended"],
    wine: ["cabernet sauvignon", "merlot", "pinot noir", "syrah", "shiraz", "zinfandel", "pinot grigio", "sauvignon blanc", "chardonnay"],
    rum: ["white", "gold", "dark", "spiced", "aged", "overproof"],
    tequila: ["blanco", "reposado", "añejo", "extra añejo", "cristalino"],
    gin: ["london dry", "plymouth", "old tom", "navy strength", "contemporary"],
    vodka: ["flavored", "wheat", "potato", "corn", "grape"],
    brandy: ["cognac", "armagnac", "grappa", "pisco", "applejack"],
    mezcal: ["joven", "reposado", "añejo"],
    liqueur: ["amaretto", "triple sec", "coffee", "herbal", "cream", "fruit"],
  };

  const styles = type ? stylesByType[type] : undefined;
  if (!styles) return undefined;
  for (const s of styles) {
    if (t.includes(s)) return s;
  }
  return undefined;
}

// Retail titles reliably include volume ("750ML", "1.75L", "50ML") and,
// for spirits, proof ("90 Proof") — cheap to parse and saves manual entry
// on nearly every scan. Doesn't handle "1.5 Liter" spelled out or similar
// unusual phrasing; falls back to manual entry for those.
export function parseVolumeMl(title: string): number | undefined {
  const mlMatch = title.match(/(\d+(?:\.\d+)?)\s*mL\b/i);
  if (mlMatch) return Math.round(parseFloat(mlMatch[1]));

  const literMatch = title.match(/(\d+(?:\.\d+)?)\s*L\b/i);
  if (literMatch) return Math.round(parseFloat(literMatch[1]) * 1000);

  return undefined;
}

export function parseProof(title: string): number | undefined {
  const match = title.match(/(\d+(?:\.\d+)?)\s*Proof/i);
  return match ? parseFloat(match[1]) : undefined;
}

// UPCitemdb returns a broad retail category string, e.g. "Food, Beverages
// & Tobacco > Beverages > Beer" — map that (plus a title fallback) onto
// our grocery category list. Best-effort; unmatched items just fall back
// to "other" and get sorted manually.
export function guessGroceryCategory(
  upcCategory: string | undefined,
  title: string
): import("./groceryTypes.js").GroceryCategory {
  const c = (upcCategory ?? "").toLowerCase();
  const t = title.toLowerCase();
  const text = `${c} ${t}`;

  if (/\bbeer\b|\bale\b|\blager\b|\bipa\b/.test(text)) return "beer";
  if (/produce|fruit|vegetable/.test(text)) return "produce";
  if (/dairy|milk|cheese|yogurt|egg/.test(text)) return "dairy & eggs";
  if (/meat|seafood|poultry|beef|pork|chicken|fish/.test(text)) return "meat & seafood";
  if (/bakery|bread|bagel|tortilla/.test(text)) return "bakery";
  if (/frozen/.test(text)) return "frozen";
  if (/beverage|soda|juice|water|coffee|tea\b/.test(text)) return "beverages";
  if (/snack|chip|cookie|candy/.test(text)) return "snacks";
  if (/household|cleaning|paper|laundry/.test(text)) return "household";
  if (/personal care|health|beauty|hygiene/.test(text)) return "personal care";
  if (/food|grocery|pantry|pasta|sauce|canned|cereal/.test(text)) return "pantry";
  return "other";
}
