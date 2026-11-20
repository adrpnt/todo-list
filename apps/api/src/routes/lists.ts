import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { parseId, readJson, requireText } from "../lib/validation.ts";
import { requireAuth } from "../middleware/requireAuth.ts";
import type { AppEnv, Database, Task, TaskList } from "../types.ts";
import { TASK_COLUMNS, toTask, type TaskRow } from "./tasks.ts";

const LIST_NOT_FOUND = "Lista não encontrada";

const SELECT_LISTS = `
  SELECT l.id,
         l.title,
         l.created_at AS createdAt,
         COUNT(t.id) AS totalTasks,
         COALESCE(SUM(t.done = 0), 0) AS pendingTasks
    FROM lists l
    LEFT JOIN tasks t ON t.list_id = l.id
   WHERE l.user_id = ?`;

export function findList(db: Database, listId: number, userId: number): TaskList {
  const list = db
    .prepare(`${SELECT_LISTS} AND l.id = ? GROUP BY l.id`)
    .get(userId, listId) as TaskList | undefined;

  if (!list) {
    throw new HTTPException(404, { message: LIST_NOT_FOUND });
  }

  return list;
}

export function createListRoutes(db: Database) {
  const routes = new Hono<AppEnv>();

  routes.use("*", requireAuth(db));

  routes.get("/", (c) => {
    const lists = db
      .prepare(`${SELECT_LISTS} GROUP BY l.id ORDER BY l.id`)
      .all(c.var.user.id) as unknown as TaskList[];

    return c.json(lists);
  });

  routes.post("/", async (c) => {
    const body = await readJson(c);
    const title = requireText(body.title, "Título", 80);

    const result = db
      .prepare("INSERT INTO lists (user_id, title) VALUES (?, ?)")
      .run(c.var.user.id, title);

    return c.json(findList(db, Number(result.lastInsertRowid), c.var.user.id), 201);
  });

  routes.get("/:id", (c) => {
    const listId = parseId(c.req.param("id"), LIST_NOT_FOUND);

    return c.json(findList(db, listId, c.var.user.id));
  });

  routes.patch("/:id", async (c) => {
    const listId = parseId(c.req.param("id"), LIST_NOT_FOUND);
    findList(db, listId, c.var.user.id);

    const body = await readJson(c);
    const title = requireText(body.title, "Título", 80);

    db.prepare("UPDATE lists SET title = ? WHERE id = ?").run(title, listId);

    return c.json(findList(db, listId, c.var.user.id));
  });

  routes.delete("/:id", (c) => {
    const listId = parseId(c.req.param("id"), LIST_NOT_FOUND);
    findList(db, listId, c.var.user.id);

    db.prepare("DELETE FROM lists WHERE id = ?").run(listId);

    return c.body(null, 204);
  });

  routes.get("/:id/tasks", (c) => {
    const listId = parseId(c.req.param("id"), LIST_NOT_FOUND);
    findList(db, listId, c.var.user.id);

    const rows = db
      .prepare(`SELECT ${TASK_COLUMNS} FROM tasks WHERE list_id = ? ORDER BY id`)
      .all(listId) as unknown as TaskRow[];

    return c.json(rows.map(toTask));
  });

  routes.post("/:id/tasks", async (c) => {
    const listId = parseId(c.req.param("id"), LIST_NOT_FOUND);
    findList(db, listId, c.var.user.id);

    const body = await readJson(c);
    const text = requireText(body.text, "Texto da tarefa", 200);

    const result = db
      .prepare("INSERT INTO tasks (list_id, text) VALUES (?, ?)")
      .run(listId, text);

    const row = db
      .prepare(`SELECT ${TASK_COLUMNS} FROM tasks WHERE id = ?`)
      .get(result.lastInsertRowid) as unknown as TaskRow;

    return c.json(toTask(row) satisfies Task, 201);
  });

  return routes;
}
