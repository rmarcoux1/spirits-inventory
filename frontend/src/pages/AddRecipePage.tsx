import { RecipeForm } from "../components/RecipeForm";
import { useRecipes } from "../hooks/useRecipes";

export default function AddRecipePage() {
  const { addRecipe } = useRecipes();

  return (
    <div className="page">
      <RecipeForm mode="add" onSubmit={addRecipe} />
    </div>
  );
}
