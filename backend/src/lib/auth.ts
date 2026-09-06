import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

/**
 * v1 access control: a shared secret passed as the `x-api-key` header,
 * checked against a value stored in Secrets Manager (created by CDK — see
 * infrastructure/lib/spirits-inventory-stack.ts). No per-user login — good enough for
 * a small personal/household tool that isn't meant to be publicly writable.
 *
 * The stack only gives each Lambda the secret's ARN (API_KEY_SECRET_ARN),
 * not its value — the value is fetched here at runtime and cached in
 * module scope so it's only one Secrets Manager call per cold start, not
 * per request.
 *
 * Swap this for Cognito or API Gateway native API keys later if you need
 * per-user auth or usage tracking.
 */
const secretsClient = new SecretsManagerClient({});
let cachedSecret: string | undefined;

async function getExpectedKey(): Promise<string | undefined> {
  if (cachedSecret) return cachedSecret;
  const arn = process.env.API_KEY_SECRET_ARN;
  if (!arn) return undefined;

  const result = await secretsClient.send(new GetSecretValueCommand({ SecretId: arn }));
  cachedSecret = result.SecretString;
  return cachedSecret;
}

export async function isAuthorized(event: APIGatewayProxyEventV2): Promise<boolean> {
  const expected = await getExpectedKey();
  if (!expected) return false;
  const provided = event.headers?.["x-api-key"] ?? event.headers?.["X-Api-Key"];
  return provided === expected;
}
