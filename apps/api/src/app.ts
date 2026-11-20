import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";

import { createAuthRoutes } from "./routes/auth.ts";
import type { Database } from "./types.ts";

interface AppOptions {
  logRequests?: boolean;
}

/** Recebe o banco por parâmetro para os testes usarem um SQLite em memória. */
export function createApp(db: Database, options: AppOptions = {}) {
  const app = new Hono().basePath("/api");

  if (options.logRequests) {
    app.use(logger());
  }

  app.get("/health", (c) => c.json({ status: "ok" }));
  app.route("/auth", createAuthRoutes(db));

  app.notFound((c) => c.json({ error: "Rota não encontrada" }, 404));

  app.onError((err, c) => {
    if (err instanceof HTTPException) {
      return c.json({ error: err.message }, err.status);
    }

    console.error(err);
    return c.json({ error: "Erro interno do servidor" }, 500);
  });

  return app;
}
