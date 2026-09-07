// Fuzzy matching between a recipe ingredient string ("2 large eggs, beaten")
// and an inventory item name ("Eggs"). Strips quantities, units, and common
// prep/descriptor words, then requires every token of the shorter phrase to
// appear in the longer one. Deliberately generous — a false "you have this"
// costs you a glance in the kitchen, but a false "you're missing this" nags
// you to re-buy something you already own, which is the more annoying
// failure mode for a personal recipe box.
//
// This is intentionally simple (no stemming library, no edit-distance
// scoring) — it's tuned by the test cases in the comment below, not a
// general-purpose NLP tool. If you find a real pair of ingredients it gets
// wrong, the fix is almost always adding a word to STOPWORDS.

const STOPWORDS = new Set([
  // prep / descriptors
  "fresh", "chopped", "diced", "sliced", "minced", "grated", "crushed",
  "boneless", "skinless", "large", "small", "medium", "ripe", "raw",
  "cooked", "whole", "ground", "organic", "frozen", "canned", "dried",
  "extra", "virgin", "unsalted", "salted", "room", "temperature",
  "cut", "into", "pieces", "cubed", "halved", "peeled", "seeded", "trimmed",
  "beaten", "melted", "softened", "divided",
  // filler words
  "of", "a", "the", "and", "or", "to", "taste", "for", "garnish",
  "optional", "plus", "more",
  // units of measurement
  "cup", "cups", "tablespoon", "tablespoons", "tbsp", "teaspoon",
  "teaspoons", "tsp", "pound", "pounds", "lb", "lbs", "ounce", "ounces",
  "oz", "gram", "grams", "kg", "ml", "liter", "liters", "litre", "litres",
  "pint", "quart", "gallon", "clove", "cloves", "can", "cans", "package",
  "packages", "jar", "jars", "bunch", "slice", "slices", "stick", "sticks",
  "pinch", "dash", "handful", "bottle", "bottles", "box", "boxes",
]);

function singularize(word: string): string {
  if (word.endsWith("ies") && word.length > 4) return word.slice(0, -3) + "y";
  if (word.endsWith("es") && word.length > 4) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) return word.slice(0, -1);
  return word;
}

function normalize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ") // drop parenthetical asides, e.g. "(or vegetable oil)"
    .replace(/[^a-z\s]/g, " ") // strip numbers/punctuation — quantities aren't meaningful for matching
    .split(/\s+/)
    .filter(Boolean)
    .map(singularize)
    .filter((w) => !STOPWORDS.has(w) && w.length > 1);
}

export function fuzzyMatch(ingredient: string, inventoryName: string): boolean {
  const a = normalize(ingredient);
  const b = normalize(inventoryName);
  if (a.length === 0 || b.length === 0) return false;

  const setB = new Set(b);
  const overlap = a.filter((t) => setB.has(t)).length;
  const minLen = Math.min(a.length, b.length);
  return overlap >= minLen;
}

const LEADING_QTY_UNIT_RE =
  /^[\d\s./½¼¾⅓⅔-]+\s*(cups?|tablespoons?|tbsp|teaspoons?|tsp|pounds?|lbs?|ounces?|oz|grams?|kg|ml|liters?|litres?|pints?|quarts?|gallons?|cloves?|cans?|packages?|jars?|bunch(es)?|slices?|sticks?|pinch(es)?|dash(es)?|handfuls?|bottles?|boxes?)?\s*(of\s+)?/i;

// Turns a raw recipe ingredient line into a reasonable inventory item name
// — strips the leading quantity/unit and anything after a comma (prep
// notes like ", chopped" or ", to taste"), then title-cases what's left.
// Not perfect (hyphenated words like "all-purpose" only capitalize the
// first segment), but good enough starting point for a name you can still
// edit afterward.
export function cleanIngredientName(raw: string): string {
  let s = raw.trim();
  s = s.replace(LEADING_QTY_UNIT_RE, "");
  s = s.split(",")[0].trim();
  if (!s) s = raw.trim();
  return s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}
