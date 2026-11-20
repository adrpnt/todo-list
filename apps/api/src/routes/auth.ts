import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";

import { hashPassword, verifyPassword } from "../lib/password.ts";
import {
  SESSION_COOKIE,
  clearSessionCookie,
  createSession,
  deleteSession,
  setSessionCookie,
} from "../lib/session.ts";
import {
  readJson,
  requireEmail,
  requirePassword,
  requireText,
} from "../lib/validation.ts";
import { requireAuth } from "../middleware/requireAuth.ts";
import type { AppEnv, Database, User } from "../types.ts";

interface UserWithPassword extends User {
  passwordHash: string;
}

export function createAuthRoutes(db: Database) {
  const routes = new Hono<AppEnv>();

  routes.post("/register", async (c) => {
    const body = await readJson(c);
    const name = requireText(body.name, "Nome", 80);
    const email = requireEmail(body.email);
    const password = requirePassword(body.password);

    const exists = db.prepare("SELECT 1 FROM users WHERE email = ?").get(email);

    if (exists) {
      throw new HTTPException(409, { message: "E-mail já cadastrado" });
    }

    const passwordHash = await hashPassword(password);
    const result = db
      .prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)")
      .run(name, email, passwordHash);

    const user: User = { id: Number(result.lastInsertRowid), name, email };
    setSessionCookie(c, createSession(db, user.id));

    return c.json(user, 201);
  });

  routes.post("/login", async (c) => {
    const body = await readJson(c);
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    const row = db
      .prepare(
        "SELECT id, name, email, password_hash AS passwordHash FROM users WHERE email = ?",
      )
      .get(email) as UserWithPassword | undefined;

    if (!row || !(await verifyPassword(password, row.passwordHash))) {
      throw new HTTPException(401, { message: "E-mail ou senha inválidos" });
    }

    setSessionCookie(c, createSession(db, row.id));

    return c.json({ id: row.id, name: row.name, email: row.email } satisfies User);
  });

  routes.post("/logout", (c) => {
    const token = getCookie(c, SESSION_COOKIE);

    if (token) {
      deleteSession(db, token);
    }

    clearSessionCookie(c);

    return c.body(null, 204);
  });

  routes.get("/me", requireAuth(db), (c) => c.json(c.var.user));

  return routes;
}
