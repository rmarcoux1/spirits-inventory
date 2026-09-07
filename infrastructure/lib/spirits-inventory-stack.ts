import { Stack, StackProps, RemovalPolicy, Duration, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as path from "path";

export class SpiritsInventoryStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // --- Storage -----------------------------------------------------
    const table = new dynamodb.Table(this, "BottlesTable", {
      tableName: "SpiritsInventoryBottles",
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN, // don't lose the collection if the stack is torn down
    });

    // The on-hand pantry — separate from the shopping list below.
    const groceryItemsTable = new dynamodb.Table(this, "GroceryItemsTable", {
      tableName: "SpiritsInventoryGroceryItems",
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    // The shopping list — standalone, not linked to GroceryItems.
    const shoppingListTable = new dynamodb.Table(this, "ShoppingListTable", {
      tableName: "SpiritsInventoryShoppingList",
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    // Recipes — ingredient lists are just names, matched against
    // GroceryItems by name (same pattern as staples/the star toggle).
    const recipesTable = new dynamodb.Table(this, "RecipesTable", {
      tableName: "SpiritsInventoryRecipes",
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    // --- Shared API secret (v1 access control, see backend/src/lib/auth.ts) ---
    const apiSecret = new secretsmanager.Secret(this, "ApiSharedSecret", {
      description: "Shared x-api-key value the frontend and import scripts send on every request",
      generateSecretString: {
        excludePunctuation: true,
        passwordLength: 32,
      },
    });

    // --- Lambda function ------------------------------------------------
    // backend/ is a sibling of infrastructure/, not a subdirectory of it, so the
    // NodejsFunction bundler can't auto-detect the right project root/lock file
    // from here — point it at backend/ explicitly. Requires `npm install` to have
    // been run inside backend/ (so backend/package-lock.json exists).
    const backendRoot = path.join(__dirname, "..", "..", "backend");

    const commonProps: Partial<nodejs.NodejsFunctionProps> = {
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: Duration.seconds(10),
      memorySize: 256,
      projectRoot: backendRoot,
      depsLockFilePath: path.join(backendRoot, "package-lock.json"),
      bundling: { minify: true, sourceMap: false },
    };

    const bottlesFn = new nodejs.NodejsFunction(this, "BottlesFunction", {
      entry: path.join(backendRoot, "src", "handlers", "bottles.ts"),
      environment: {
        TABLE_NAME: table.tableName,
        // The ARN, not the value — the Lambda fetches the actual secret
        // value at runtime (see backend/src/lib/auth.ts) and caches it for
        // the life of the execution environment. Using the ARN here means
        // rotating the secret never requires a redeploy to "pick up" a new
        // value baked into the environment.
        API_KEY_SECRET_ARN: apiSecret.secretArn,
      },
      ...commonProps,
    });

    // Proxies the UPCitemdb barcode lookup server-side. Calling it directly
    // from the browser hits CORS (the browser blocks the response even
    // though the request succeeds) — doing it here sidesteps that entirely,
    // since CORS is a browser-enforced restriction that never applies to
    // server-to-server calls.
    const barcodeFn = new nodejs.NodejsFunction(this, "BarcodeFunction", {
      entry: path.join(backendRoot, "src", "handlers", "barcode.ts"),
      environment: {
        API_KEY_SECRET_ARN: apiSecret.secretArn,
      },
      ...commonProps,
    });

    table.grantReadWriteData(bottlesFn);
    apiSecret.grantRead(bottlesFn);
    apiSecret.grantRead(barcodeFn);

    // --- Grocery inventory Lambda --------------------------------------
    const groceryItemsFn = new nodejs.NodejsFunction(this, "GroceryItemsFunction", {
      entry: path.join(backendRoot, "src", "handlers", "groceryItems.ts"),
      environment: {
        GROCERY_ITEMS_TABLE_NAME: groceryItemsTable.tableName,
        API_KEY_SECRET_ARN: apiSecret.secretArn,
      },
      ...commonProps,
    });

    // --- Shopping list Lambda (standalone, also serves the Shortcuts export) ---
    const shoppingListFn = new nodejs.NodejsFunction(this, "ShoppingListFunction", {
      entry: path.join(backendRoot, "src", "handlers", "shoppingList.ts"),
      environment: {
        SHOPPING_LIST_TABLE_NAME: shoppingListTable.tableName,
        API_KEY_SECRET_ARN: apiSecret.secretArn,
      },
      ...commonProps,
    });

    groceryItemsTable.grantReadWriteData(groceryItemsFn);
    shoppingListTable.grantReadWriteData(shoppingListFn);
    apiSecret.grantRead(groceryItemsFn);
    apiSecret.grantRead(shoppingListFn);

    // --- Recipes Lambda --------------------------------------------------
    const recipesFn = new nodejs.NodejsFunction(this, "RecipesFunction", {
      entry: path.join(backendRoot, "src", "handlers", "recipes.ts"),
      environment: {
        RECIPES_TABLE_NAME: recipesTable.tableName,
        API_KEY_SECRET_ARN: apiSecret.secretArn,
      },
      ...commonProps,
    });

    recipesTable.grantReadWriteData(recipesFn);
    apiSecret.grantRead(recipesFn);

    // --- Recipe search Lambda (proxies TheMealDB server-side) -----------
    const recipeSearchFn = new nodejs.NodejsFunction(this, "RecipeSearchFunction", {
      entry: path.join(backendRoot, "src", "handlers", "recipeSearch.ts"),
      environment: {
        API_KEY_SECRET_ARN: apiSecret.secretArn,
      },
      ...commonProps,
    });

    apiSecret.grantRead(recipeSearchFn);

    // --- HTTP API --------------------------------------------------------
    const httpApi = new apigwv2.HttpApi(this, "SpiritsInventoryHttpApi", {
      apiName: "spirits-inventory-api",
      corsPreflight: {
        allowOrigins: [
          "http://localhost:5173", // local `npm run dev`
          "https://main.d1ifwkv7hj8q8u.amplifyapp.com", // Amplify Hosting
        ],
        allowMethods: [
          apigwv2.CorsHttpMethod.GET,
          apigwv2.CorsHttpMethod.POST,
          apigwv2.CorsHttpMethod.PUT,
          apigwv2.CorsHttpMethod.DELETE,
        ],
        allowHeaders: ["Content-Type", "x-api-key"],
      },
    });

    const bottlesIntegration = new integrations.HttpLambdaIntegration("BottlesIntegration", bottlesFn);
    const barcodeIntegration = new integrations.HttpLambdaIntegration("BarcodeIntegration", barcodeFn);
    const groceryItemsIntegration = new integrations.HttpLambdaIntegration("GroceryItemsIntegration", groceryItemsFn);
    const shoppingListIntegration = new integrations.HttpLambdaIntegration("ShoppingListIntegration", shoppingListFn);
    const recipesIntegration = new integrations.HttpLambdaIntegration("RecipesIntegration", recipesFn);
    const recipeSearchIntegration = new integrations.HttpLambdaIntegration("RecipeSearchIntegration", recipeSearchFn);

    httpApi.addRoutes({
      path: "/items",
      methods: [apigwv2.HttpMethod.GET, apigwv2.HttpMethod.POST],
      integration: bottlesIntegration,
    });
    httpApi.addRoutes({
      path: "/items/{id}",
      methods: [apigwv2.HttpMethod.PUT, apigwv2.HttpMethod.DELETE],
      integration: bottlesIntegration,
    });
    httpApi.addRoutes({
      path: "/barcode/{upc}",
      methods: [apigwv2.HttpMethod.GET],
      integration: barcodeIntegration,
    });
    httpApi.addRoutes({
      path: "/grocery-items",
      methods: [apigwv2.HttpMethod.GET, apigwv2.HttpMethod.POST],
      integration: groceryItemsIntegration,
    });
    httpApi.addRoutes({
      path: "/grocery-items/{id}",
      methods: [apigwv2.HttpMethod.PUT, apigwv2.HttpMethod.DELETE],
      integration: groceryItemsIntegration,
    });
    httpApi.addRoutes({
      path: "/shopping-list-items",
      methods: [apigwv2.HttpMethod.GET, apigwv2.HttpMethod.POST],
      integration: shoppingListIntegration,
    });
    httpApi.addRoutes({
      path: "/shopping-list-items/{id}",
      methods: [apigwv2.HttpMethod.PUT, apigwv2.HttpMethod.DELETE],
      integration: shoppingListIntegration,
    });
    httpApi.addRoutes({
      path: "/shopping-list",
      methods: [apigwv2.HttpMethod.GET],
      integration: shoppingListIntegration,
    });
    httpApi.addRoutes({
      path: "/recipes",
      methods: [apigwv2.HttpMethod.GET, apigwv2.HttpMethod.POST],
      integration: recipesIntegration,
    });
    httpApi.addRoutes({
      path: "/recipes/{id}",
      methods: [apigwv2.HttpMethod.PUT, apigwv2.HttpMethod.DELETE],
      integration: recipesIntegration,
    });
    httpApi.addRoutes({
      path: "/recipe-search",
      methods: [apigwv2.HttpMethod.GET],
      integration: recipeSearchIntegration,
    });

    new CfnOutput(this, "ApiUrl", { value: httpApi.apiEndpoint });
    new CfnOutput(this, "ApiSecretArn", { value: apiSecret.secretArn });
    new CfnOutput(this, "TableName", { value: table.tableName });
    new CfnOutput(this, "GroceryItemsTableName", { value: groceryItemsTable.tableName });
    new CfnOutput(this, "ShoppingListTableName", { value: shoppingListTable.tableName });
    new CfnOutput(this, "RecipesTableName", { value: recipesTable.tableName });
  }
}
