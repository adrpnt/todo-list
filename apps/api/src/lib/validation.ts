import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

export type JsonBody = Record<string, unknown>;

function badRequest(message: string): never {
  throw new HTTPException(400, { message });
}

/** Lê o corpo JSON; qualquer coisa que não seja um objeto vira {}. */
export async function readJson(c: Context): Promise<JsonBody> {
  try {
    const body: unknown = await c.req.json();

    if (body && typeof body === "object" && !Array.isArray(body)) {
      return body as JsonBody;
    }
  } catch {
    // corpo ausente ou JSON inválido
  }

  return {};
}

export function requireText(value: unknown, label: string, maxLength: number) {
  if (typeof value !== "string" || value.trim() === "") {
    badRequest(`${label} é obrigatório`);
  }

  const text = value.trim();

  if (text.length > maxLength) {
    badRequest(`${label} deve ter no máximo ${maxLength} caracteres`);
  }

  return text;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function requireEmail(value: unknown): string {
  const email = requireText(value, "E-mail", 254).toLowerCase();

  if (!EMAIL_PATTERN.test(email)) {
    badRequest("E-mail inválido");
  }

  return email;
}

export function requirePassword(value: unknown): string {
  if (typeof value !== "string" || value.length < 8) {
    badRequest("A senha deve ter pelo menos 8 caracteres");
  }

  if (value.length > 128) {
    badRequest("A senha deve ter no máximo 128 caracteres");
  }

  return value;
}

export function optionalBoolean(value: unknown, label: string) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "boolean") {
    badRequest(`${label} deve ser verdadeiro ou falso`);
  }

  return value;
}

/** Converte o parâmetro de rota em id; ids inválidos respondem 404. */
export function parseId(value: string | undefined, notFoundMessage: string) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new HTTPException(404, { message: notFoundMessage });
  }

  return id;
}
