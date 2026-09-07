import { Link } from "react-router-dom";
import { useRecipes } from "../hooks/useRecipes";
import { useGroceryItems } from "../hooks/useGroceryItems";
import { useShoppingList } from "../hooks/useShoppingList";
import { RecipeRow } from "../components/RecipeRow";

export default function RecipesPage() {
  const { recipes, loading, error, removeRecipe } = useRecipes();
  const { items: groceryItems } = useGroceryItems();
  const { addItem, findByName } = useShoppingList();

  async function handleAddMissingToList(names: string[]) {
    for (const name of names) {
      await addItem({ name, quantity: 1, note: null });
    }
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
            onRemove={removeRecipe}
          />
        ))}
      </div>
    </div>
  );
}
