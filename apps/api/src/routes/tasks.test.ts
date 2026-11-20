import { beforeEach, describe, expect, it } from "vitest";

import type { Task } from "../types.ts";
import { setupApp } from "../test/helpers.ts";

describe("rotas de tarefas", () => {
  let ctx: ReturnType<typeof setupApp>;
  let cookie: string;

  beforeEach(async () => {
    ctx = setupApp();
    cookie = await ctx.registerUser();
    await ctx.request("POST", "/api/lists", { cookie, body: { title: "Casa" } });
  });

  it("cria e lista as tarefas de uma lista em ordem de criação", async () => {
    const first = await ctx.request("POST", "/api/lists/1/tasks", {
      cookie,
      body: { text: "Lavar louça" },
    });
    await ctx.request("POST", "/api/lists/1/tasks", { cookie, body: { text: "Varrer" } });

    expect(first.status).toBe(201);
    expect(await first.json()).toMatchObject({
      id: 1,
      listId: 1,
      text: "Lavar louça",
      done: false,
    });

    const response = await ctx.request("GET", "/api/lists/1/tasks", { cookie });
    const tasks = (await response.json()) as Task[];
    expect(tasks.map((task) => task.text)).toEqual([
      "Lavar louça",
      "Varrer",
    ]);
  });

  it("marca como concluída e edita o texto", async () => {
    await ctx.request("POST", "/api/lists/1/tasks", { cookie, body: { text: "Varrer" } });

    const done = await ctx.request("PATCH", "/api/tasks/1", { cookie, body: { done: true } });
    expect(await done.json()).toMatchObject({ text: "Varrer", done: true });

    const edited = await ctx.request("PATCH", "/api/tasks/1", {
      cookie,
      body: { text: "Varrer a sala" },
    });
    expect(await edited.json()).toMatchObject({ text: "Varrer a sala", done: true });
  });

  it("valida os campos da tarefa", async () => {
    await ctx.request("POST", "/api/lists/1/tasks", { cookie, body: { text: "Varrer" } });

    const emptyText = await ctx.request("POST", "/api/lists/1/tasks", {
      cookie,
      body: { text: "" },
    });
    const invalidDone = await ctx.request("PATCH", "/api/tasks/1", {
      cookie,
      body: { done: "sim" },
    });

    expect(emptyText.status).toBe(400);
    expect(await emptyText.json()).toEqual({ error: "Texto da tarefa é obrigatório" });
    expect(invalidDone.status).toBe(400);
  });

  it("exclui a tarefa", async () => {
    await ctx.request("POST", "/api/lists/1/tasks", { cookie, body: { text: "Varrer" } });

    const response = await ctx.request("DELETE", "/api/tasks/1", { cookie });

    expect(response.status).toBe(204);
    const tasks = await ctx.request("GET", "/api/lists/1/tasks", { cookie });
    expect(await tasks.json()).toEqual([]);
  });

  it("não deixa um usuário alterar tarefas de outro", async () => {
    await ctx.request("POST", "/api/lists/1/tasks", { cookie, body: { text: "Varrer" } });
    const bia = await ctx.registerUser({ name: "Bia", email: "bia@example.com" });

    const patch = await ctx.request("PATCH", "/api/tasks/1", {
      cookie: bia,
      body: { done: true },
    });
    const remove = await ctx.request("DELETE", "/api/tasks/1", { cookie: bia });

    expect(patch.status).toBe(404);
    expect(remove.status).toBe(404);
  });
});
