import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { randomUUID } from "node:crypto";
import { PutCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../lib/dynamo.js";
import { jsonResponse } from "../lib/http.js";
import { isAuthorized } from "../lib/auth.js";
import type { NewGroceryPurchase } from "../lib/groceryTypes.js";

const PURCHASES_TABLE = process.env.GROCERY_PURCHASES_TABLE_NAME ?? "";
const ITEMS_TABLE = process.env.GROCERY_ITEMS_TABLE_NAME ?? "";

// Logging a purchase is the only thing that grows price history — it's
// also treated as a restock: the item's on-hand quantity goes up by
// however many units this purchase was for, and last_price is set to a
// per-unit price so "how much does this usually cost" reads sensibly
// regardless of pack size.
async function recordPurchase(itemId: string, event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const body = JSON.parse(event.body ?? "{}") as NewGroceryPurchase;
  if (body.price == null || body.quantity == null) {
    return jsonResponse(400, { message: "price and quantity are required" });
  }

  const now = new Date().toISOString();
  const purchase = {
    id: randomUUID(),
    item_id: itemId,
    price: body.price,
    quantity: body.quantity,
    store: body.store ?? null,
    purchased_at: body.purchased_at ?? now,
    created_at: now,
  };

  await ddb.send(new PutCommand({ TableName: PURCHASES_TABLE, Item: purchase }));

  const unitPrice = body.quantity > 0 ? Math.round((body.price / body.quantity) * 100) / 100 : null;
  const result = await ddb.send(
    new UpdateCommand({
      TableName: ITEMS_TABLE,
      Key: { id: itemId },
      UpdateExpression: "SET quantity = quantity + :qty, last_price = :price, updated_at = :now",
      ExpressionAttributeValues: { ":qty": body.quantity, ":price": unitPrice, ":now": now },
      ReturnValues: "ALL_NEW",
    })
  );

  return jsonResponse(201, { purchase, item: result.Attributes });
}

async function listForItem(itemId: string): Promise<APIGatewayProxyResultV2> {
  // A Scan+filter, not a Query — fine at personal-pantry scale (matches
  // the same tradeoff already made for the bottles list). Add a GSI on
  // item_id if this ever needs to handle a much larger item count.
  const result = await ddb.send(
    new ScanCommand({
      TableName: PURCHASES_TABLE,
      FilterExpression: "item_id = :itemId",
      ExpressionAttributeValues: { ":itemId": itemId },
    })
  );
  return jsonResponse(200, result.Items ?? []);
}

async function listAll(): Promise<APIGatewayProxyResultV2> {
  const result = await ddb.send(new ScanCommand({ TableName: PURCHASES_TABLE }));
  return jsonResponse(200, result.Items ?? []);
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  if (event.requestContext.http.method === "OPTIONS") return jsonResponse(200, {});

  if (!(await isAuthorized(event))) {
    return jsonResponse(401, { message: "Missing or invalid x-api-key" });
  }

  const method = event.requestContext.http.method;
  const itemId = event.pathParameters?.id;

  if (method === "POST" && itemId) return recordPurchase(itemId, event);
  if (method === "GET" && itemId) return listForItem(itemId);
  if (method === "GET" && !itemId) return listAll();

  return jsonResponse(404, { message: "Not found" });
}
