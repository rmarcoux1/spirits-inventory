import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { recipeApi, type NewRecipe, type Recipe, type RecipeSearchResult } from "../recipeApi";

interface Props {
  mode: "add" | "edit";
  initial?: Recipe;
  onSubmit: (payload: NewRecipe) => Promise<unknown>;
}

export function RecipeForm({ mode, initial, onSubmit }: Props) {
  const navigate = useNavigate();
  const [name, setName] = useState(initial?.name ?? "");
  const [ingredientsText, setIngredientsText] = useState((initial?.ingredients ?? []).join("\n"));
  const [instructions, setInstructions] = useState(initial?.instructions ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<RecipeSearchResult[] | null>(null);
  const [searchStatus, setSearchStatus] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchStatus(null);
    try {
      const { results, error: searchError } = await recipeApi.searchRecipes(query.trim());
      if (searchError) {
        setSearchStatus(`Search failed (${searchError}) — try again, or enter the recipe manually below.`);
        setSearchResults(null);
      } else if (results.length === 0) {
        setSearchStatus(`No matches for "${query.trim()}". Try a simpler search term, e.g. the main ingredient.`);
        setSearchResults(null);
      } else {
        setSearchResults(results);
      }
    } catch (err) {
      setSearchStatus(err instanceof Error ? err.message : "Search failed");
      setSearchResults(null);
    } finally {
      setSearching(false);
    }
  }

  function handlePick(result: RecipeSearchResult) {
    setName(result.name);
    setIngredientsText(result.ingredients.join("\n"));
    setInstructions(result.instructions ?? "");
    setSearchResults(null);
    setSearchStatus(`Filled in from "${result.name}" — review and edit below before saving.`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ingredients = ingredientsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (!name.trim() || ingredients.length === 0) return;
    setSaving(true);
    setError(null);

    try {
      await onSubmit({ name: name.trim(), ingredients, instructions: instructions.trim() || null });
      navigate("/recipes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save recipe");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="form-card">
      <div className="form-card-header">
        <h2>{mode === "edit" ? "Edit recipe" : "Add recipe"}</h2>
      </div>

      <form onSubmit={handleSearch} className="manual-barcode-row">
        <input
          type="text"
          placeholder="Search recipes to import (e.g. &quot;chicken curry&quot;)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="btn-secondary" disabled={searching}>
          {searching ? "Searching…" : "Search"}
        </button>
      </form>

      {searchStatus && <p className="scan-status">{searchStatus}</p>}

      {searchResults && (
        <ul className="recipe-search-results">
          {searchResults.map((r) => (
            <li key={r.external_id} onClick={() => handlePick(r)}>
              {r.image_url && <img src={r.image_url} alt="" />}
              <div>
                <p className="recipe-search-result-name">{r.name}</p>
                <p className="recipe-search-result-meta">
                  {[r.category, r.area].filter(Boolean).join(" · ")} · {r.ingredients.length} ingredients
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="bottle-form">
        <label className="field full">
          <span>Name</span>
          <input required value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <label className="field full">
          <span>Ingredients — one per line</span>
          <textarea
            required
            rows={6}
            placeholder={"Eggs\nFlour\nMilk\nButter"}
            value={ingredientsText}
            onChange={(e) => setIngredientsText(e.target.value)}
          />
        </label>

        <label className="field full">
          <span>Instructions (optional)</span>
          <textarea rows={4} value={instructions} onChange={(e) => setInstructions(e.target.value)} />
        </label>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : mode === "edit" ? "Save changes" : "Add recipe"}
          </button>
        </div>
      </form>
    </div>
  );
}
