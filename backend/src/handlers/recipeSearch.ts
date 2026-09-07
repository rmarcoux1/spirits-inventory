import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { jsonResponse } from "../lib/http.js";
import { isAuthorized } from "../lib/auth.js";

// TheMealDB's free tier: no signup, uses the shared public test key "1".
// Good enough for a personal recipe box; if this ever needs nutrition data
// or dietary filtering, Spoonacular/Edamam are the paid upgrade path, but
// both need their own API key and a daily-quota story this doesn't.
const SEARCH_URL = "https://www.themealdb.com/api/json/v1/1/search.php";

interface TheMealDbMeal {
  idMeal: string;
  strMeal: string;
  strInstructions?: string;
  strMealThumb?: string;
  strCategory?: string;
  strArea?: string;
  [key: string]: string | undefined; // strIngredient1..20, strMeasure1..20
}

function extractIngredients(meal: TheMealDbMeal): string[] {
  const lines: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ingredient && ingredient.trim()) {
      const line = measure && measure.trim() ? `${measure.trim()} ${ingredient.trim()}` : ingredient.trim();
      lines.push(line);
    }
  }
  return lines;
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  if (event.requestContext.http.method === "OPTIONS") return jsonResponse(200, {});

  if (!(await isAuthorized(event))) {
    return jsonResponse(401, { message: "Missing or invalid x-api-key" });
  }

  const query = event.queryStringParameters?.q;
  if (!query) return jsonResponse(400, { message: "Missing ?q= search query" });

  try {
    const res = await fetch(`${SEARCH_URL}?s=${encodeURIComponent(query)}`);
    if (!res.ok) {
      return jsonResponse(200, { results: [], error: `Upstream search failed: ${res.status}` });
    }

    const data = (await res.json()) as { meals: TheMealDbMeal[] | null };
    const meals = data.meals ?? [];

    const results = meals.map((meal) => ({
      external_id: meal.idMeal,
      name: meal.strMeal,
      ingredients: extractIngredients(meal),
      instructions: meal.strInstructions?.trim() || null,
      image_url: meal.strMealThumb || null,
      category: meal.strCategory || null,
      area: meal.strArea || null,
    }));

    return jsonResponse(200, { results });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse(200, { results: [], error: message });
  }
}
