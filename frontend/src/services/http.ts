const API_URL = import.meta.env.VITE_API_URL as string;
const API_KEY = import.meta.env.VITE_API_KEY as string;

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  // If VITE_API_URL wasn't baked into this build (a local .env that was
  // never filled in, or a build that ran before .env existed), API_URL is
  // "" and the fetch below silently targets this same site instead of the
  // API. Since this is a client-routed SPA, that always 200s with
  // index.html — and res.json() on an HTML page fails with a cryptic
  // "Unexpected token '<' ... is not valid JSON" that gives no hint what
  // actually went wrong. Fail fast with a message that says so.
  if (!API_URL) {
    throw new Error(
      "VITE_API_URL is not set in this build — the app doesn't know where the API is, so every request would 404 back to this same page. " +
        "Set VITE_API_URL (and VITE_API_KEY) in frontend/.env and restart the dev server."
    );
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      ...options.headers,
    },
  });

  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get("content-type") ?? "";
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  if (!contentType.includes("application/json")) {
    // A 200 with no JSON body almost always means the request never reached
    // the API at all (wrong VITE_API_URL, a stale/incorrect ApiUrl value, or
    // the API route genuinely doesn't exist and Vite's dev server served
    // index.html instead of a 404).
    const body = await res.text();
    throw new Error(
      `Expected a JSON response from ${path} but got "${contentType || "unknown"}" instead. ` +
        "This usually means VITE_API_URL is wrong (pointing at the site itself, not the API), or the backend hasn't been deployed with cdk deploy yet. " +
        `First 120 chars of the response: ${body.slice(0, 120)}`
    );
  }
  return res.json() as Promise<T>;
}
