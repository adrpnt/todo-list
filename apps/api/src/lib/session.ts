import { createHash, randomBytes } from "node:crypto";
import type { Context } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";

import type { Database, User } from "../types.ts";

export const SESSION_COOKIE = "session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 dias

interface SessionRow extends User {
  expiresAt: number;
}

/** O banco guarda só o hash do token: um vazamento do .db não expõe sessões válidas. */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createSession(db: Database, userId: number): string {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;

  db.prepare(
    "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)",
  ).run(hashToken(token), userId, expiresAt);

  return token;
}

export function findSessionUser(db: Database, token: string): User | null {
  const row = db
    .prepare(
      `SELECT u.id, u.name, u.email, s.expires_at AS expiresAt
         FROM sessions s
         JOIN users u ON u.id = s.user_id
        WHERE s.id = ?`,
    )
    .get(hashToken(token)) as SessionRow | undefined;

  if (!row) {
    return null;
  }

  if (row.expiresAt <= Date.now()) {
    deleteSession(db, token);
    return null;
  }

  return { id: row.id, name: row.name, email: row.email };
}

export function deleteSession(db: Database, token: string): void {
  db.prepare("DELETE FROM sessions WHERE id = ?").run(hashToken(token));
}

export function setSessionCookie(c: Context, token: string): void {
  setCookie(c, SESSION_COOKIE, token, {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie(c: Context): void {
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
}
