import { createApp } from "../app.ts";
import { createDatabase } from "../db.ts";

export function setupApp() {
  const db = createDatabase(":memory:");
  const app = createApp(db);

  /** Faz a requisição com corpo JSON e, se informado, o cookie de sessão. */
  function request(
    method: string,
    path: string,
    { body, cookie }: { body?: unknown; cookie?: string } = {},
  ) {
    const headers: Record<string, string> = {};

    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (cookie) headers.Cookie = cookie;

    return app.request(path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  /** Cadastra um usuário e devolve o cookie de sessão pronto para reuso. */
  async function registerUser(
    overrides: Partial<{ name: string; email: string; password: string }> = {},
  ) {
    const response = await request("POST", "/api/auth/register", {
      body: {
        name: "Ana",
        email: "ana@example.com",
        password: "senha-segura",
        ...overrides,
      },
    });

    return sessionCookieFrom(response);
  }

  return { app, db, request, registerUser };
}

export function sessionCookieFrom(response: Response): string {
  const header = response.headers.get("set-cookie") ?? "";

  return header.split(";")[0];
}
