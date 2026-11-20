import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

import { SESSION_COOKIE, findSessionUser } from "../lib/session.ts";
import type { AppEnv, Database } from "../types.ts";

export function requireAuth(db: Database) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const token = getCookie(c, SESSION_COOKIE);
    const user = token ? findSessionUser(db, token) : null;

    if (!user) {
      throw new HTTPException(401, { message: "Sessão inválida ou expirada" });
    }

    c.set("user", user);
    await next();
  });
}
