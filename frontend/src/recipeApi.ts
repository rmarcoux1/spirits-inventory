import { apiRequest } from "./services/http";

export interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  instructions: string | null;
  created_at: string;
  updated_at: string;
}

export type NewRecipe = Omit<Recipe, "id" | "created_at" | "updated_at">;

export interface RecipeSearchResult {
  external_id: string;
  name: string;
  ingredients: string[];
  instructions: string | null;
  image_url: string | null;
  category: string | null;
  area: string | null;
}

export const recipeApi = {
  listRecipes: () => apiRequest<Recipe[]>("/recipes"),
  createRecipe: (recipe: NewRecipe) => apiRequest<Recipe>("/recipes", { method: "POST", body: JSON.stringify(recipe) }),
  updateRecipe: (id: string, patch: Partial<NewRecipe>) =>
    apiRequest<Recipe>(`/recipes/${id}`, { method: "PUT", body: JSON.stringify(patch) }),
  deleteRecipe: (id: string) => apiRequest<void>(`/recipes/${id}`, { method: "DELETE" }),
  searchRecipes: (query: string) =>
    apiRequest<{ results: RecipeSearchResult[]; error?: string }>(`/recipe-search?q=${encodeURIComponent(query)}`),
};
