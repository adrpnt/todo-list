import { describe, expect, it } from "vitest";

import { sessionCookieFrom, setupApp } from "../test/helpers.ts";

describe("rotas de autenticação", () => {
  describe("POST /api/auth/register", () => {
    it("cria o usuário, inicia a sessão e não expõe a senha", async () => {
      const { request } = setupApp();

      const response = await request("POST", "/api/auth/register", {
        body: { name: "Ana", email: "Ana@Example.com", password: "senha-segura" },
      });

      expect(response.status).toBe(201);
      expect(await response.json()).toEqual({
        id: 1,
        name: "Ana",
        email: "ana@example.com",
      });

      const setCookie = response.headers.get("set-cookie") ?? "";
      expect(setCookie).toMatch(/^session=/);
      expect(setCookie).toContain("HttpOnly");
      expect(setCookie).toContain("SameSite=Lax");
    });

    it("guarda a senha com hash", async () => {
      const { db, registerUser } = setupApp();
      await registerUser();

      const row = db.prepare("SELECT password_hash AS hash FROM users").get() as {
        hash: string;
      };

      expect(row.hash).not.toContain("senha-segura");
      expect(row.hash).toMatch(/^[0-9a-f]{32}:[0-9a-f]{128}$/);
    });

    it("recusa e-mail já cadastrado", async () => {
      const { request, registerUser } = setupApp();
      await registerUser();

      const response = await request("POST", "/api/auth/register", {
        body: { name: "Outra", email: "ANA@example.com", password: "outra-senha" },
      });

      expect(response.status).toBe(409);
      expect(await response.json()).toEqual({ error: "E-mail já cadastrado" });
    });

    it.each([
      [{ email: "ana@example.com", password: "senha-segura" }, "Nome é obrigatório"],
      [{ name: "Ana", email: "ana", password: "senha-segura" }, "E-mail inválido"],
      [
        { name: "Ana", email: "ana@example.com", password: "curta" },
        "A senha deve ter pelo menos 8 caracteres",
      ],
    ])("valida os campos (%j)", async (body, error) => {
      const { request } = setupApp();

      const response = await request("POST", "/api/auth/register", { body });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error });
    });
  });

  describe("POST /api/auth/login", () => {
    it("autentica com credenciais válidas", async () => {
      const { request, registerUser } = setupApp();
      await registerUser();

      const response = await request("POST", "/api/auth/login", {
        body: { email: "ana@example.com", password: "senha-segura" },
      });

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        id: 1,
        name: "Ana",
        email: "ana@example.com",
      });
      expect(sessionCookieFrom(response)).toMatch(/^session=.+/);
    });

    it("recusa senha incorreta e e-mail inexistente com a mesma mensagem", async () => {
      const { request, registerUser } = setupApp();
      await registerUser();

      const wrongPassword = await request("POST", "/api/auth/login", {
        body: { email: "ana@example.com", password: "senha-errada" },
      });
      const unknownEmail = await request("POST", "/api/auth/login", {
        body: { email: "bia@example.com", password: "senha-segura" },
      });

      for (const response of [wrongPassword, unknownEmail]) {
        expect(response.status).toBe(401);
        expect(await response.json()).toEqual({ error: "E-mail ou senha inválidos" });
      }
    });
  });

  describe("GET /api/auth/me", () => {
    it("retorna o usuário da sessão", async () => {
      const { request, registerUser } = setupApp();
      const cookie = await registerUser();

      const response = await request("GET", "/api/auth/me", { cookie });

      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ name: "Ana" });
    });

    it("responde 401 sem sessão ou com sessão desconhecida", async () => {
      const { request } = setupApp();

      const withoutCookie = await request("GET", "/api/auth/me");
      const invalidCookie = await request("GET", "/api/auth/me", {
        cookie: "session=inexistente",
      });

      expect(withoutCookie.status).toBe(401);
      expect(invalidCookie.status).toBe(401);
    });

    it("responde 401 quando a sessão expirou", async () => {
      const { db, request, registerUser } = setupApp();
      const cookie = await registerUser();
      db.prepare("UPDATE sessions SET expires_at = ?").run(Date.now() - 1);

      const response = await request("GET", "/api/auth/me", { cookie });

      expect(response.status).toBe(401);
      expect(db.prepare("SELECT COUNT(*) AS total FROM sessions").get()).toEqual({
        total: 0,
      });
    });
  });

  describe("POST /api/auth/logout", () => {
    it("invalida a sessão no servidor e limpa o cookie", async () => {
      const { request, registerUser } = setupApp();
      const cookie = await registerUser();

      const response = await request("POST", "/api/auth/logout", { cookie });

      expect(response.status).toBe(204);
      expect(response.headers.get("set-cookie")).toMatch(/^session=;.*Max-Age=0/);

      const me = await request("GET", "/api/auth/me", { cookie });
      expect(me.status).toBe(401);
    });
  });
});
