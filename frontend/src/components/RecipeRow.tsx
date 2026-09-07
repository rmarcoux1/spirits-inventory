import { useState } from "react";
import { Link } from "react-router-dom";
import type { Recipe } from "../recipeApi";
import type { GroceryItem } from "../groceryApi";
import { fuzzyMatch } from "../services/fuzzyMatch";

interface Props {
  recipe: Recipe;
  groceryItems: GroceryItem[];
  findOnShoppingList: (name: string) => boolean;
  onAddMissingToList: (names: string[]) => Promise<unknown>;
  onAddToInventory: (name: string) => Promise<unknown>;
  onRemove: (id: string) => void;
}

// "Have it" means a fuzzy-matching inventory item exists with quantity > 0
// — see services/fuzzyMatch.ts. Still not unit-aware: it only knows
// whether you have *any* of an ingredient, not whether you have *enough*.
function haveIngredient(name: string, groceryItems: GroceryItem[]): boolean {
  return groceryItems.some((i) => i.quantity > 0 && fuzzyMatch(name, i.name));
}

export function RecipeRow({
  recipe,
  groceryItems,
  findOnShoppingList,
  onAddMissingToList,
  onAddToInventory,
  onRemove,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [addingIngredient, setAddingIngredient] = useState<string | null>(null);

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

  // "Turns out I already have this" — adds it straight to Groceries
  // inventory instead of the shopping list, for when "missing" was wrong
  // because it just wasn't tracked yet.
  async function handleAddToInventory(ingredient: string) {
    setAddingIngredient(ingredient);
    try {
      await onAddToInventory(ingredient);
      setStatus(`Added "${ingredient}" to your inventory.`);
    } finally {
      setAddingIngredient(null);
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
          {recipe.ingredients.map((ing) => {
            const have = haveIngredient(ing, groceryItems);
            return (
              <li key={ing} className={have ? "have" : "missing"}>
                <span>
                  {have ? "✓" : "✗"} {ing}
                </span>
                {!have && (
                  <button
                    className="btn-ghost recipe-ingredient-add"
                    onClick={() => handleAddToInventory(ing)}
                    disabled={addingIngredient === ing}
                  >
                    {addingIngredient === ing ? "Adding…" : "+ I have this"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {expanded && recipe.instructions && <p className="recipe-instructions">{recipe.instructions}</p>}
    </div>
  );
}
