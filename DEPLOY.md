# Deploying Spirits Inventory

## Prerequisites
- Node.js 20+ and npm
- An AWS account, and the AWS CLI configured (`aws configure`) with credentials that can create DynamoDB tables, Lambda functions, API Gateway, Secrets Manager secrets, and IAM roles
- AWS CDK CLI: `npm install -g aws-cdk` (or use `npx cdk` from `/infrastructure`)
- If this is the first time using CDK in this AWS account/region: `cd infrastructure && npx cdk bootstrap`

## 1. Deploy the backend (infrastructure + Lambda)

```
cd backend
npm install
cd ../infrastructure
npm install
npx cdk deploy
```

(`backend/package-lock.json` needs to exist before `cdk deploy` — that's what `npm install` in `backend/` is for. CDK's `NodejsFunction` construct bundles the Lambda code directly from `backend/src/handlers/bottles.ts`; there's no separate backend build/deploy step.)

This provisions:
- Three DynamoDB tables: `SpiritsInventoryBottles`, `SpiritsInventoryGroceryItems` (on-hand pantry), `SpiritsInventoryShoppingList` (standalone shopping list), all with `id` as the primary key
- Four Lambda functions: `bottles`, `barcode` (shared lookup proxy for both sections), `groceryItems`, `shoppingList`
- An HTTP API (API Gateway v2) wired to those Lambdas:
  - `GET/POST /items`, `PUT/DELETE /items/{id}` — spirits
  - `GET /barcode/{upc}` — shared product lookup proxy
  - `GET/POST /grocery-items`, `PUT/DELETE /grocery-items/{id}` — the on-hand pantry
  - `GET/POST /shopping-list-items`, `PUT/DELETE /shopping-list-items/{id}` — the standalone shopping list
  - `GET /shopping-list` — the shopping list, pre-formatted as text for the Shortcuts export (see below)
- A Secrets Manager secret holding a random shared API key, fetched by each Lambda at runtime via its ARN

When it finishes, note the outputs printed in your terminal:
- `ApiUrl` — the base URL of your API
- `ApiSecretArn` — the ARN of the shared secret
- `TableName` — the DynamoDB table name

Get the secret's actual value:

```
aws secretsmanager get-secret-value --secret-id <ApiSecretArn> --query SecretString --output text
```

## 2. Configure and run the frontend

Copy `frontend/.env.example` to `frontend/.env` and fill in:
- `VITE_API_URL` = the `ApiUrl` output from step 1
- `VITE_API_KEY` = the secret value from step 1

```
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — that's the whole app, running locally and talking to your real AWS backend. There's no hosting service in this setup (no Amplify, no S3/CloudFront); the only AWS pieces are the backend from step 1. If you ever want it reachable from somewhere other than your own machine, you'd add a static host and add its origin to the `allowOrigins` list in `infrastructure/lib/spirits-inventory-stack.ts` — but that's a separate, optional step, not required for local use.

## 3. Import existing bottle data

If you have a CSV export (e.g. from a previous Supabase-based version of this app), backfill it once the backend is deployed (the frontend doesn't need to be running for this — the script talks directly to the API):

```
VITE_API_URL=https://xxxx.execute-api.us-east-1.amazonaws.com \
VITE_API_KEY=your-shared-secret \
node scripts/import-bottles.mjs scripts/bottles.csv --dry-run
```

Check the preview output, then drop `--dry-run` to actually write. See the comment block at the top of `scripts/import-bottles.mjs` for the expected CSV columns and what happens with existing-bottle matches.

## 4. First-time data setup (if not importing)

**Spirits**: use **Add bottle** — type (11 options: wine, champagne, sparkling
wine, whiskey, vodka, gin, rum, tequila, brandy, mezcal, liqueur), producer,
vintage or proof, style, quantity, and price. Scan or type a barcode to
auto-fill what it can find.

**Groceries**: use **Add item** — name, brand, category, unit, quantity, and
optionally a barcode. This is your on-hand pantry — how much of something you
currently have. It's intentionally disconnected from the shopping list below;
adding or editing a grocery item never touches the list, and vice versa.

**Shopping list**: its own separate thing — a lightweight "things to buy"
list, not linked to inventory quantity. Two ways to add to it: type directly
into the quick-add box on the Shopping List page (starts at quantity 1), or
tap the ★ on any item in Groceries to add it by name. The star acts as a
toggle — starred means "currently on the list," tap again to take it back
off — but that's determined by matching names against the shopping list each
time, not a stored link between the two records, so renaming an inventory
item after starring it will "lose" the connection (the star will just show
as off, and there'll be a separately-named entry sitting on the list).
Once something's on the list, adjust how many you need with the +/− stepper
on the Shopping List page itself — that's separate from, and has no effect
on, the item's on-hand quantity in Groceries. Tap the checkbox to take
something off the list once you've got it.

**Staples**: on the Add/Edit item form in Groceries, check "Staple — buy
every week" for anything you restock on a regular cadence. On the Shopping
List page, an "Add all staples" button appears whenever you have at least
one — tapping it adds every staple to the list in one shot, skipping any
that are already on there (matched by name, same as the star). Safe to tap
repeatedly; it won't create duplicates.

**Quick scan** (both sections): on the Inventory or Groceries dashboard, tap
**Quick scan**, then scan or type a barcode already in your inventory to
knock its quantity down by one. This looks up against what's already loaded
in your inventory (matching on the `barcode` field) — it does *not* call
UPCitemdb, so it works even if you're out of trial lookups for the day, and
it's instant since there's no network round-trip.

## Sending the shopping list to a shared Note on iPhone

Apple doesn't provide a public API for Notes, so there's no live two-way
sync — checking something off in Notes won't update the app, and vice versa.
What *does* work well: a Shortcuts automation that pulls the current list
from the API and drops it into a shared Note, run manually, via Siri, or on
a schedule.

There's a dedicated endpoint for this — `GET /shopping-list` — that reads
directly from the standalone shopping list above and returns pre-formatted
text ready to paste straight into a Note:

```
curl -H "x-api-key: your-shared-secret" https://your-api-url/shopping-list
```

```json
{
  "text": "🛒 Shopping List\n\n☐ Avocados (3)\n☐ Milk\n☐ Paper towels\n",
  "items": [...],
  "count": 3,
  "generated_at": "2026-09-06T..."
}
```

**Building the Shortcut** (Shortcuts app on iPhone):
1. New Shortcut → add **Get Contents of URL**
   - URL: `https://your-api-url/shopping-list`
   - Method: GET
   - Headers: add one — Key `x-api-key`, Value your shared secret
2. Add **Get Dictionary Value** → Key: `text` (pulls the pre-formatted string out of the JSON response)
3. Create the Note once by hand first: open Notes, make a new note, share it (top-right share icon → Share Note → add whoever you want on the list), and name it something findable, e.g. "Shopping List"
4. Back in Shortcuts, add **Find Notes** → match notes where Name is "Shopping List"
5. Add **Update Note** (or **Set Note**, naming varies by iOS version) → set its content to the dictionary value from step 2, targeting the note found in step 4 — this replaces the note's content each run, so it never just appends duplicates on top of itself
6. Run it once manually to test. If it works, you can:
   - Add it to your Home Screen for a one-tap refresh
   - Ask Siri to run it by name
   - Set up a **Personal Automation** (Automation tab → + → Time of Day, or "App → when I open Notes") to refresh it automatically

Since it overwrites the note each run rather than syncing incrementally, anyone you've shared the note with always sees the current list as of the last time someone ran the Shortcut — not live, but close enough for "refresh before you leave for the store."

## Notes / known limitations of this v1
- Access control is a single shared API key (`x-api-key` header), not per-user login — anyone with the key can read and write. Fine for a private household tool; move to Cognito later if you want individual accounts.
- Lists use a DynamoDB `Scan` — fine at personal-collection/pantry scale, but not the pattern to keep if any of the tables grow very large.
- Barcode auto-fill is proxied through the `barcode` Lambda (`backend/src/handlers/barcode.ts`) to UPCitemdb's free trial endpoint — calling UPCitemdb directly from the browser hits CORS (their API doesn't send an `Access-Control-Allow-Origin` header for browser requests), so the lookup happens server-side instead. The trial endpoint is still rate-limited (100 lookups/day, shared across whoever's IP the Lambda runs from) and not wine-specific — good for a head start, not a complete catalog. If you're doing heavy scanning sessions, you may hit that limit; the app falls back to manual entry when a lookup fails or finds nothing.
- Grocery category auto-guessing from a barcode scan is best-effort (keyword matching against UPCitemdb's category string and the product title) — expect to correct it sometimes, especially for less common categories.
- No purchase history or price tracking — deliberately removed. If you want that back later (cost-over-time, spend by category), it'd need to come back as its own feature rather than reviving the old one, since the shopping list and inventory are now intentionally decoupled from any notion of "what you paid."
- The shopping list and the on-hand inventory are fully independent — adding, checking off, or removing something on the shopping list never touches inventory quantity, and there's no "restock" action that updates both at once. That's by design, not a bug: it keeps "what to buy" and "what I have" as two separate lists you manage separately.
- The shared-Note sync (`/shopping-list`) is one-way and refresh-on-run, not live — see the Shortcuts section above. Your shared API key ends up stored inside the Shortcut on your phone; fine for personal use, just don't share the Shortcut file itself with anyone you don't want having API access.
