import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";

import { createApp } from "./app.ts";
import { createDatabase } from "./db.ts";

const port = Number(process.env.PORT ?? 3000);
const dbPath =
  process.env.DB_PATH ?? fileURLToPath(new URL("../data/app.db", import.meta.url));

const db = createDatabase(dbPath);
const app = createApp(db, { logRequests: true });

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API rodando em http://localhost:${info.port}`);
});
