import { useCallback, useEffect, useState } from "react";
import { recipeApi, type NewRecipe, type Recipe } from "../recipeApi";

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setRecipes(await recipeApi.listRecipes());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load recipes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function addRecipe(input: NewRecipe) {
    const created = await recipeApi.createRecipe(input);
    setRecipes((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    return created;
  }

  async function editRecipe(id: string, patch: NewRecipe) {
    const updated = await recipeApi.updateRecipe(id, patch);
    setRecipes((prev) => prev.map((r) => (r.id === id ? updated : r)));
    return updated;
  }

  async function removeRecipe(id: string) {
    const prev = recipes;
    setRecipes((p) => p.filter((r) => r.id !== id));
    try {
      await recipeApi.deleteRecipe(id);
    } catch (err) {
      setRecipes(prev);
      console.error(err);
    }
  }

  return { recipes, loading, error, reload, addRecipe, editRecipe, removeRecipe };
}
