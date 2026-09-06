# Spirits Inventory

Track wine and whiskey (plus champagne and sparkling wine) inventory, with camera barcode scanning.

- `/infrastructure` — AWS CDK app: DynamoDB table, Lambda function, HTTP API
- `/backend` — Lambda handler source (Node.js)
- `/frontend` — React app (Vite), deployed via AWS Amplify Hosting
- `/scripts` — data import script for backfilling from a CSV export

See `DEPLOY.md` for setup and deploy steps.
