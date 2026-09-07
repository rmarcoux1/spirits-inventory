import { useParams } from "react-router-dom";
import { RecipeForm } from "../components/RecipeForm";
import { useRecipes } from "../hooks/useRecipes";

export default function EditRecipePage() {
  const { id } = useParams<{ id: string }>();
  const { recipes, loading, error, editRecipe } = useRecipes();
  const recipe = recipes.find((r) => r.id === id);

  if (loading) {
    return (
      <div className="page">
        <p className="state-message">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <p className="state-message state-message--error">{error}</p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="page">
        <p className="state-message state-message--error">Couldn't find that recipe.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <RecipeForm mode="edit" initial={recipe} onSubmit={(payload) => editRecipe(recipe.id, payload)} />
    </div>
  );
}
