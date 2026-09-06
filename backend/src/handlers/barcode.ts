import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { jsonResponse } from "../lib/http.js";
import { isAuthorized } from "../lib/auth.js";
import { guessType, guessSpiritType, parseVolumeMl, parseProof, isSpiritType, guessGroceryCategory } from "../lib/barcodeGuess.js";

// UPCitemdb's trial endpoint covers a lot of retail wine/spirits UPCs but
// is rate-limited (100 requests/day) and not wine-specific. Calling it
// from here (server-to-server) instead of directly from the browser
// avoids CORS entirely — the browser only enforces CORS on requests made
// by page JavaScript, never on server-to-server calls.
const LOOKUP_URL = "https://api.upcitemdb.com/prod/trial/lookup";

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  if (event.requestContext.http.method === "OPTIONS") return jsonResponse(200, {});

  if (!(await isAuthorized(event))) {
    return jsonResponse(401, { message: "Missing or invalid x-api-key" });
  }

  const barcode = event.pathParameters?.upc;
  if (!barcode) return jsonResponse(400, { message: "Missing barcode" });

  try {
    const res = await fetch(`${LOOKUP_URL}?upc=${encodeURIComponent(barcode)}`);
    if (!res.ok) {
      return jsonResponse(200, { barcode, found: false, error: `Upstream lookup failed: ${res.status}` });
    }

    const data = (await res.json()) as {
      items?: { title?: string; brand?: string; description?: string; images?: string[]; category?: string }[];
    };
    const item = data.items?.[0];
    if (!item) return jsonResponse(200, { barcode, found: false });

    const title = item.title ?? "";
    const type = guessType(title);
    return jsonResponse(200, {
      barcode,
      found: true,
      name: item.title,
      producer: item.brand,
      type,
      spirit_type: guessSpiritType(title, type),
      image_url: item.images?.[0],
      volume_ml: parseVolumeMl(title),
      proof: isSpiritType(type) ? parseProof(title) : undefined,
      notes: item.description || undefined,
      // Used by the grocery module — irrelevant for spirits, harmless to
      // include either way since the frontend just ignores fields it
      // doesn't ask for.
      grocery_category: guessGroceryCategory(item.category, title),
    });
  } catch (err) {
    // A genuine failure reaching UPCitemdb from our own Lambda (their
    // service down, DNS issue, etc) — distinct from the browser-side CORS
    // failure this endpoint exists to avoid.
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse(200, { barcode, found: false, error: message });
  }
}
