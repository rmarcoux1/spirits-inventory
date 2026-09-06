#!/usr/bin/env node
// Backfill bottles from a CSV export. Talks to the live API — same
// validation the app itself uses — so no separate import endpoint was
// needed. No npm dependencies: uses Node's built-in global `fetch` (Node 18+).
//
// Usage:
//   VITE_API_URL=https://xxxx.execute-api.us-east-1.amazonaws.com \
//   VITE_API_KEY=your-shared-secret \
//   node scripts/import-bottles.mjs path/to/bottles.csv
//
// Or pass them as flags instead of env vars:
//   node scripts/import-bottles.mjs bottles.csv --api-url https://... --api-key ...
//
// Add --dry-run to parse and print what would be sent without calling the API.
//
// Expected CSV columns (header row required, any column order, extra columns
// ignored) — this matches a Supabase `bottles` export from the previous
// version of this app:
//   id, user_id, type, name, producer, country, vintage, proof, quantity,
//   spirit_type, purchase_price, purchase_date, created_at, updated_at
//
// - type:  one of wine, whiskey, champagne, sparkling wine
// - vintage, proof, quantity, purchase_price: numbers, or the literal string
//   "null" (as Supabase's CSV export writes empty cells) — either is treated
//   as absent.
// - id, user_id, created_at, updated_at: not sent to the API — the backend
//   assigns its own id and timestamps on create. user_id is dropped (no
//   per-user auth yet, see DEPLOY.md).
//
// One row = one bottle. Re-running against the same CSV will create
// duplicates — the API doesn't dedupe by name on the create endpoint itself
// (only the app's "Add bottle" form does that client-side), so only run this
// once per CSV, or clear the table first if you need to re-import.

import { readFile } from "node:fs/promises";

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") args.dryRun = true;
    else if (a === "--api-url") args.apiUrl = argv[++i];
    else if (a === "--api-key") args.apiKey = argv[++i];
    else args._.push(a);
  }
  return args;
}

// Minimal CSV parser: handles quoted fields with commas/escaped quotes, but
// assumes no embedded newlines inside quoted fields (fine for a database
// export of simple rows like this).
function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const parseLine = (line) => {
    const cells = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQuotes) {
        if (c === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (c === '"') {
          inQuotes = false;
        } else {
          cur += c;
        }
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        cells.push(cur);
        cur = "";
      } else {
        cur += c;
      }
    }
    cells.push(cur);
    return cells.map((c) => c.trim());
  };

  const header = parseLine(lines[0]).map((h) => h.toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = parseLine(line);
    const row = {};
    header.forEach((h, i) => (row[h] = cells[i] ?? ""));
    return row;
  });
}

// The Supabase export uses the literal string "null" for empty cells.
function nullable(value) {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed === "" || trimmed.toLowerCase() === "null" ? null : trimmed;
}

function nullableNumber(value) {
  const v = nullable(value);
  if (v === null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function rowToBottle(row) {
  return {
    type: row.type.trim(),
    name: row.name.trim(),
    producer: nullable(row.producer),
    country: nullable(row.country),
    vintage: nullableNumber(row.vintage),
    proof: nullableNumber(row.proof),
    quantity: nullableNumber(row.quantity) ?? 0,
    spirit_type: nullable(row.spirit_type),
    purchase_price: nullableNumber(row.purchase_price),
    purchase_date: nullable(row.purchase_date),
    barcode: null,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const csvPath = args._[0];
  if (!csvPath) {
    console.error("Usage: node scripts/import-bottles.mjs <path-to-csv> [--dry-run]");
    process.exit(1);
  }

  const apiUrl = (args.apiUrl ?? process.env.VITE_API_URL ?? "").replace(/\/$/, "");
  const apiKey = args.apiKey ?? process.env.VITE_API_KEY;
  if (!args.dryRun && (!apiUrl || !apiKey)) {
    console.error("Missing API URL/key. Set VITE_API_URL and VITE_API_KEY, or pass --api-url/--api-key.");
    process.exit(1);
  }

  const csvText = await readFile(csvPath, "utf8");
  const rows = parseCsv(csvText);
  const bottles = rows.map(rowToBottle);

  console.log(`Parsed ${bottles.length} rows from ${csvPath}`);
  const types = new Set(bottles.map((b) => b.type));
  console.log(`Types found: ${[...types].join(", ")}`);

  if (args.dryRun) {
    console.log("\nExample bottle:", JSON.stringify(bottles[0], null, 2));
    console.log("\n--dry-run: not calling the API. Re-run without it once this looks right.");
    return;
  }

  async function api(path, options = {}) {
    const res = await fetch(`${apiUrl}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, ...options.headers },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`${options.method ?? "GET"} ${path} -> ${res.status}: ${body}`);
    }
    return res.status === 204 ? null : res.json();
  }

  let created = 0;
  for (const bottle of bottles) {
    await api("/items", { method: "POST", body: JSON.stringify(bottle) });
    created++;
    if (created % 10 === 0) console.log(`  ${created}/${bottles.length}…`);
  }

  console.log(`\nDone. Created ${created} bottles.`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
