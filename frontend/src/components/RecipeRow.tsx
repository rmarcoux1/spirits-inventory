import { useState } from "react";
import { Link } from "react-router-dom";
import type { Recipe } from "../recipeApi";
import type { GroceryItem } from "../groceryApi";

interface Props {
  recipe: Recipe;
  groceryItems: GroceryItem[];
  findOnShoppingList: (name: string) => boolean;
  onAddMissingToList: (names: string[]) => Promise<unknown>;
  onRemove: (id: string) => void;
}

// "Have it" just means a matching-name inventory item exists with
// quantity > 0 — no unit-aware "do I have enough for this recipe"
// comparison. See the comment on the Recipe type for why.
function haveIngredient(name: string, groceryItems: GroceryItem[]): boolean {
  const target = name.trim().toLowerCase();
  return groceryItems.some((i) => i.name.trim().toLowerCase() === target && i.quantity > 0);
}

export function RecipeRow({ recipe, groceryItems, findOnShoppingList, onAddMissingToList, onRemove }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const missing = recipe.ingredients.filter((ing) => !haveIngredient(ing, groceryItems));
  const haveCount = recipe.ingredients.length - missing.length;

  async function handleAddMissing() {
    const toAdd = missing.filter((ing) => !findOnShoppingList(ing));
    setAdding(true);
    try {
      if (toAdd.length > 0) await onAddMissingToList(toAdd);
      setStatus(
        missing.length === 0
          ? "You have everything for this recipe!"
          : toAdd.length === 0
            ? "The missing ingredients are already on your list."
            : `Added ${toAdd.length} ingredient${toAdd.length === 1 ? "" : "s"} to the list.`
      );
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="recipe-row">
      <div className="recipe-row-main">
        <div className="recipe-row-info">
          <h4>{recipe.name}</h4>
          <p className="recipe-row-meta">
            {haveCount}/{recipe.ingredients.length} ingredients on hand
          </p>
        </div>
        <div className="recipe-row-actions">
          <button className="btn-secondary" onClick={handleAddMissing} disabled={adding}>
            {adding ? "Adding…" : "Add missing to list"}
          </button>
          <button className="btn-ghost" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Hide" : "Ingredients"}
          </button>
          <Link to={`/recipes/edit/${recipe.id}`} className="btn-ghost">
            Edit
          </Link>
          <button className="btn-ghost btn-remove" onClick={() => onRemove(recipe.id)}>
            Remove
          </button>
        </div>
      </div>

      {status && <p className="scan-status">{status}</p>}

      {expanded && (
        <ul className="recipe-ingredient-list">
          {recipe.ingredients.map((ing) => (
            <li key={ing} className={haveIngredient(ing, groceryItems) ? "have" : "missing"}>
              {haveIngredient(ing, groceryItems) ? "✓" : "✗"} {ing}
            </li>
          ))}
        </ul>
      )}
      {expanded && recipe.instructions && <p className="recipe-instructions">{recipe.instructions}</p>}
    </div>
  );
}
