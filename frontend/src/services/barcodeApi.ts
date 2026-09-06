import type { BottleType } from "../api";
import { apiRequest } from "./http";

export interface BarcodeLookupResult {
  barcode: string;
  found: boolean;
  name?: string;
  producer?: string;
  type?: BottleType;
  spirit_type?: string;
  image_url?: string;
  volume_ml?: number;
  proof?: number;
  notes?: string;
  // Best-guess grocery category — irrelevant when looking up a bottle,
  // used by the grocery add-item form.
  grocery_category?: string;
  // Set when the request itself failed (network error, non-2xx response,
  // or the backend couldn't reach UPCitemdb) — as opposed to a clean
  // response with no matching product. See the comment in this function
  // for why this distinction matters.
  error?: string;
}

// The actual UPCitemdb call happens server-side now, in the `barcode`
// Lambda (backend/src/handlers/barcode.ts) — calling their trial endpoint
// directly from the browser hit CORS (the request reaches UPCitemdb fine,
// but the browser blocks reading the response since UPCitemdb doesn't send
// an Access-Control-Allow-Origin header for browser-origin requests).
// Server-to-server calls aren't subject to CORS at all, so routing through
// our own API sidesteps the problem rather than working around it.
export async function lookupBarcode(barcode: string): Promise<BarcodeLookupResult> {
  try {
    return await apiRequest<BarcodeLookupResult>(`/barcode/${encodeURIComponent(barcode)}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Barcode lookup error", err);
    return { barcode, found: false, error: message };
  }
}
