import { describe, expect, it } from "vitest";

import type { TaskList } from "../types.ts";
import { setupApp } from "../test/helpers.ts";

describe("rotas de listas", () => {
  it("exige sessão", async () => {
    const { request } = setupApp();

    const response = await request("GET", "/api/lists");

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Sessão inválida ou expirada" });
  });

  it("cria, lista, renomeia e exclui uma lista", async () => {
    const { request, registerUser } = setupApp();
    const cookie = await registerUser();

    const created = await request("POST", "/api/lists", {
      cookie,
      body: { title: "  Mercado  " },
    });
    expect(created.status).toBe(201);
    const list = (await created.json()) as TaskList;
    expect(list).toMatchObject({ id: 1, title: "Mercado", totalTasks: 0, pendingTasks: 0 });

    const renamed = await request("PATCH", `/api/lists/${list.id}`, {
      cookie,
      body: { title: "Feira" },
    });
    expect(await renamed.json()).toMatchObject({ title: "Feira" });

    const all = await request("GET", "/api/lists", { cookie });
    expect(await all.json()).toEqual([expect.objectContaining({ title: "Feira" })]);

    const removed = await request("DELETE", `/api/lists/${list.id}`, { cookie });
    expect(removed.status).toBe(204);

    const afterDelete = await request("GET", `/api/lists/${list.id}`, { cookie });
    expect(afterDelete.status).toBe(404);
  });

  it("conta tarefas totais e pendentes", async () => {
    const { request, registerUser } = setupApp();
    const cookie = await registerUser();
    await request("POST", "/api/lists", { cookie, body: { title: "Casa" } });
    await request("POST", "/api/lists/1/tasks", { cookie, body: { text: "Lavar louça" } });
    await request("POST", "/api/lists/1/tasks", { cookie, body: { text: "Varrer" } });
    await request("PATCH", "/api/tasks/1", { cookie, body: { done: true } });

    const response = await request("GET", "/api/lists/1", { cookie });

    expect(await response.json()).toMatchObject({ totalTasks: 2, pendingTasks: 1 });
  });

  it("exclui as tarefas junto com a lista", async () => {
    const { db, request, registerUser } = setupApp();
    const cookie = await registerUser();
    await request("POST", "/api/lists", { cookie, body: { title: "Casa" } });
    await request("POST", "/api/lists/1/tasks", { cookie, body: { text: "Varrer" } });

    await request("DELETE", "/api/lists/1", { cookie });

    expect(db.prepare("SELECT COUNT(*) AS total FROM tasks").get()).toEqual({ total: 0 });
  });

  it("valida o título", async () => {
    const { request, registerUser } = setupApp();
    const cookie = await registerUser();

    const empty = await request("POST", "/api/lists", { cookie, body: { title: "   " } });
    const tooLong = await request("POST", "/api/lists", {
      cookie,
      body: { title: "a".repeat(81) },
    });

    expect(empty.status).toBe(400);
    expect(await empty.json()).toEqual({ error: "Título é obrigatório" });
    expect(tooLong.status).toBe(400);
  });

  it("não deixa um usuário ver ou alterar listas de outro", async () => {
    const { request, registerUser } = setupApp();
    const ana = await registerUser();
    const bia = await registerUser({ name: "Bia", email: "bia@example.com" });
    await request("POST", "/api/lists", { cookie: ana, body: { title: "Da Ana" } });

    const all = await request("GET", "/api/lists", { cookie: bia });
    expect(await all.json()).toEqual([]);

    for (const [method, path, body] of [
      ["GET", "/api/lists/1", undefined],
      ["PATCH", "/api/lists/1", { title: "Invadida" }],
      ["DELETE", "/api/lists/1", undefined],
      ["GET", "/api/lists/1/tasks", undefined],
      ["POST", "/api/lists/1/tasks", { text: "Intrusa" }],
    ] as const) {
      const response = await request(method, path, { cookie: bia, body });
      expect(response.status, `${method} ${path}`).toBe(404);
    }
  });

  it("responde 404 para id inválido", async () => {
    const { request, registerUser } = setupApp();
    const cookie = await registerUser();

    const response = await request("GET", "/api/lists/abc", { cookie });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Lista não encontrada" });
  });
});
