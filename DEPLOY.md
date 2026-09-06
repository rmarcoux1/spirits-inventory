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
- A DynamoDB table (`SpiritsInventoryBottles`), `id` as the primary key
- One Lambda function (`bottles`) with read/write access to the table
- An HTTP API (API Gateway v2) wired to that Lambda: `GET/POST /items`, `PUT/DELETE /items/{id}`
- A Secrets Manager secret holding a random shared API key, fetched by the Lambda at runtime via its ARN

When it finishes, note the outputs printed in your terminal:
- `ApiUrl` — the base URL of your API
- `ApiSecretArn` — the ARN of the shared secret
- `TableName` — the DynamoDB table name

Get the secret's actual value:

```
aws secretsmanager get-secret-value --secret-id <ApiSecretArn> --query SecretString --output text
```

## 2. Configure and deploy the frontend

Copy `frontend/.env.example` to `frontend/.env` and fill in:
- `VITE_API_URL` = the `ApiUrl` output from step 1
- `VITE_API_KEY` = the secret value from step 1

Test locally first:

```
cd frontend
npm install
npm run dev
```

Then deploy via **AWS Amplify Hosting**:
1. Push this repo to GitHub (or GitLab/Bitbucket/CodeCommit)
2. In the AWS Amplify console, choose "New app" → "Host web app" → connect the repo, and point the app root at `frontend/` (Amplify's monorepo setting)
3. Amplify will pick up `amplify.yml` at the repo root automatically for the build
4. In the Amplify app's environment variables, add `VITE_API_URL` and `VITE_API_KEY` with the same values as your `.env`
5. Deploy — Amplify gives you a live URL, and will auto-deploy on every push to your connected branch going forward
6. Once you know your Amplify URL (or a custom domain), add it to the `allowOrigins` list in `infrastructure/lib/spirits-inventory-stack.ts` and redeploy the stack (`npx cdk deploy`) — otherwise the browser will block requests from that origin

## 3. Import existing bottle data

If you have a CSV export (e.g. from a previous Supabase-based version of this app), backfill it once both the backend and frontend are live:

```
VITE_API_URL=https://xxxx.execute-api.us-east-1.amazonaws.com \
VITE_API_KEY=your-shared-secret \
node scripts/import-bottles.mjs scripts/bottles.csv --dry-run
```

Check the preview output, then drop `--dry-run` to actually write. See the comment block at the top of `scripts/import-bottles.mjs` for the expected CSV columns and what happens with existing-bottle matches.

## 4. First-time data setup (if not importing)

Open the site and use **Add bottle** to start logging your collection — type (wine/whiskey/champagne/sparkling wine), producer, vintage or proof, quantity, and price. The barcode scanner button pulls in name/producer/type automatically when a match is found.

## Notes / known limitations of this v1
- Access control is a single shared API key (`x-api-key` header), not per-user login — anyone with the key can read and write. Fine for a private household tool; move to Cognito later if you want individual accounts.
- The bottles list uses a DynamoDB `Scan` — fine at collection scale (dozens to low hundreds of bottles), but wouldn't be the pattern to keep at large scale.
- Barcode auto-fill uses a free UPC lookup (see `frontend/src/services/barcodeApi.ts`) that's rate-limited and not wine-specific — good for a head start, not a complete catalog.
