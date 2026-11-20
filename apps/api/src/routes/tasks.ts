import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import {
  optionalBoolean,
  parseId,
  readJson,
  requireText,
} from "../lib/validation.ts";
import { requireAuth } from "../middleware/requireAuth.ts";
import type { AppEnv, Database, Task } from "../types.ts";

const TASK_NOT_FOUND = "Tarefa não encontrada";

export const TASK_COLUMNS =
  "id, list_id AS listId, text, done, created_at AS createdAt";

/** No SQLite o booleano é 0/1. */
export interface TaskRow extends Omit<Task, "done"> {
  done: number;
}

export function toTask(row: TaskRow): Task {
  return { ...row, done: row.done === 1 };
}

function findTask(db: Database, taskId: number, userId: number): Task {
  const row = db
    .prepare(
      `SELECT t.id, t.list_id AS listId, t.text, t.done, t.created_at AS createdAt
         FROM tasks t
         JOIN lists l ON l.id = t.list_id
        WHERE t.id = ? AND l.user_id = ?`,
    )
    .get(taskId, userId) as TaskRow | undefined;

  if (!row) {
    throw new HTTPException(404, { message: TASK_NOT_FOUND });
  }

  return toTask(row);
}

export function createTaskRoutes(db: Database) {
  const routes = new Hono<AppEnv>();

  routes.use("*", requireAuth(db));

  routes.patch("/:id", async (c) => {
    const taskId = parseId(c.req.param("id"), TASK_NOT_FOUND);
    const task = findTask(db, taskId, c.var.user.id);

    const body = await readJson(c);
    const text =
      body.text === undefined
        ? task.text
        : requireText(body.text, "Texto da tarefa", 200);
    const done = optionalBoolean(body.done, "Concluída") ?? task.done;

    db.prepare("UPDATE tasks SET text = ?, done = ? WHERE id = ?").run(
      text,
      done ? 1 : 0,
      taskId,
    );

    return c.json(findTask(db, taskId, c.var.user.id));
  });

  routes.delete("/:id", (c) => {
    const taskId = parseId(c.req.param("id"), TASK_NOT_FOUND);
    findTask(db, taskId, c.var.user.id);

    db.prepare("DELETE FROM tasks WHERE id = ?").run(taskId);

    return c.body(null, 204);
  });

  return routes;
}
