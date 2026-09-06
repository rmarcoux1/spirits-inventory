import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { randomUUID } from "node:crypto";
import { DeleteCommand, PutCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../lib/dynamo.js";
import { jsonResponse } from "../lib/http.js";
import { isAuthorized } from "../lib/auth.js";
import type { NewGroceryItem } from "../lib/groceryTypes.js";

const TABLE_NAME = process.env.GROCERY_ITEMS_TABLE_NAME ?? "";

async function list(): Promise<APIGatewayProxyResultV2> {
  const result = await ddb.send(new ScanCommand({ TableName: TABLE_NAME }));
  return jsonResponse(200, result.Items ?? []);
}

async function create(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const body = JSON.parse(event.body ?? "{}") as NewGroceryItem;
  if (!body.name || !body.category) {
    return jsonResponse(400, { message: "name and category are required" });
  }

  const now = new Date().toISOString();
  const item = {
    ...body,
    quantity: body.quantity ?? 0,
    on_shopping_list: body.on_shopping_list ?? false,
    last_price: null,
    id: randomUUID(),
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

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  if (event.requestContext.http.method === "OPTIONS") return jsonResponse(200, {});

  if (!(await isAuthorized(event))) {
    return jsonResponse(401, { message: "Missing or invalid x-api-key" });
  }

  const method = event.requestContext.http.method;
  const id = event.pathParameters?.id;

  if (method === "GET" && !id) return list();
  if (method === "POST" && !id) return create(event);
  if (method === "PUT" && id) return update(id, event);
  if (method === "DELETE" && id) return remove(id);

  return jsonResponse(404, { message: "Not found" });
}
