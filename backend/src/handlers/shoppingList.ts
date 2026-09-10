import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { randomUUID } from "node:crypto";
import { DeleteCommand, PutCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../lib/dynamo.js";
import { jsonResponse } from "../lib/http.js";
import { isAuthorized } from "../lib/auth.js";
import type { NewShoppingListItem } from "../lib/groceryTypes.js";

const TABLE_NAME = process.env.SHOPPING_LIST_TABLE_NAME ?? "";

async function list(): Promise<APIGatewayProxyResultV2> {
  const result = await ddb.send(new ScanCommand({ TableName: TABLE_NAME }));
  const items = (result.Items ?? []).sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
  return jsonResponse(200, items);
}

async function create(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const body = JSON.parse(event.body ?? "{}") as NewShoppingListItem;
  if (!body.name) return jsonResponse(400, { message: "name is required" });

  const now = new Date().toISOString();
  const item = {
    id: randomUUID(),
    name: body.name,
    quantity: body.quantity ?? 1,
    note: body.note ?? null,
    created_at: now,
    updated_at: now,
  };

  await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return jsonResponse(201, item);
}

async function update(id: string, event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const patch = JSON.parse(event.body ?? "{}");
  const entries = Object.entries({ ...patch, updated_at: new Date().toISOString() });

  const updateExpr = "SET " + entries.map((_entry, i) => `#k${i} = :v${i}`).join(", ");
  const exprNames = Object.fromEntries(entries.map(([k], i) => [`#k${i}`, k]));
  const exprValues = Object.fromEntries(entries.map(([, v], i) => [`:v${i}`, v]));

  const result = await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: updateExpr,
      ExpressionAttributeNames: exprNames,
      ExpressionAttributeValues: exprValues,
      ReturnValues: "ALL_NEW",
    })
  );
  return jsonResponse(200, result.Attributes);
}

async function remove(id: string): Promise<APIGatewayProxyResultV2> {
  await ddb.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { id } }));
  return jsonResponse(204, null);
}

// The Shortcuts-friendly export (see DEPLOY.md) — now reads straight from
// this standalone list instead of filtering inventory items, so it always
// reflects exactly what's here, nothing more.
async function textExport(): Promise<APIGatewayProxyResultV2> {
  const result = await ddb.send(new ScanCommand({ TableName: TABLE_NAME }));
  const items = ((result.Items ?? []) as Array<Record<string, unknown>>).sort((a, b) =>
    String(a.name).localeCompare(String(b.name))
  );

  const lines: string[] = ["Shopping List", ""];
  if (items.length === 0) {
    lines.push("(nothing on the list right now)");
  } else {
    for (const item of items) {
      const qtyPart = typeof item.quantity === "number" && item.quantity > 1 ? ` (${item.quantity})` : "";
      const notePart = item.note ? ` — ${item.note}` : "";
      lines.push(`${item.name}${qtyPart}${notePart}`);
    }
  }

  return jsonResponse(200, {
    text: lines.join("\n").trim(),
    items: items.map((i) => ({ name: i.name, quantity: i.quantity, note: i.note })),
    count: items.length,
    generated_at: new Date().toISOString(),
  });
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  if (event.requestContext.http.method === "OPTIONS") return jsonResponse(200, {});

  if (!(await isAuthorized(event))) {
    return jsonResponse(401, { message: "Missing or invalid x-api-key" });
  }

  const method = event.requestContext.http.method;
  const id = event.pathParameters?.id;

  if (event.rawPath === "/shopping-list" && method === "GET") return textExport();

  if (method === "GET" && !id) return list();
  if (method === "POST" && !id) return create(event);
  if (method === "PUT" && id) return update(id, event);
  if (method === "DELETE" && id) return remove(id);

  return jsonResponse(404, { message: "Not found" });
}
