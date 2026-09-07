import { Link } from "react-router-dom";
import { useRecipes } from "../hooks/useRecipes";
import { useGroceryItems } from "../hooks/useGroceryItems";
import { useShoppingList } from "../hooks/useShoppingList";
import { RecipeRow } from "../components/RecipeRow";
import { cleanIngredientName } from "../services/fuzzyMatch";

export default function RecipesPage() {
  const { recipes, loading, error, removeRecipe } = useRecipes();
  const { items: groceryItems, addItem: addGroceryItem } = useGroceryItems();
  const { addItem: addToShoppingList, findByName } = useShoppingList();

  async function handleAddMissingToList(names: string[]) {
    for (const name of names) {
      await addToShoppingList({ name, quantity: 1, note: null });
    }
  }

  // "Turns out I already have this" — creates it as a real inventory item
  // (category defaults to "pantry" since we can't reliably guess one from
  // just an ingredient name; easy to correct via Edit afterward).
  async function handleAddToInventory(ingredient: string) {
    await addGroceryItem({
      name: cleanIngredientName(ingredient),
      brand: null,
      category: "pantry",
      unit: null,
      quantity: 1,
      is_staple: false,
      barcode: null,
      image_url: null,
      notes: null,
    });
  }

  return (
    <div className="page">
      <div className="page-header-row">
        <p className="section-heading" style={{ margin: 0 }}>
          Recipes
        </p>
        <Link to="/recipes/add" className="btn-primary">
          + Add recipe
        </Link>
      </div>

      {loading && <p className="state-message">Loading recipes…</p>}
      {error && <p className="state-message state-message--error">{error}</p>}

      {!loading && !error && recipes.length === 0 && (
        <div className="empty-state">
          <p>No recipes yet.</p>
          <Link to="/recipes/add" className="btn-secondary">
            Add your first recipe
          </Link>
        </div>
      )}

      <div className="recipe-list">
        {recipes.map((recipe) => (
          <RecipeRow
            key={recipe.id}
            recipe={recipe}
            groceryItems={groceryItems}
            findOnShoppingList={(name) => !!findByName(name)}
            onAddMissingToList={handleAddMissingToList}
            onAddToInventory={handleAddToInventory}
            onRemove={removeRecipe}
          />
        ))}
      </div>
    </div>
  );
}
