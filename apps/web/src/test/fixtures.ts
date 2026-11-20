import { type ListType } from "../types/ListType";
import { type TaskType } from "../types/TaskType";
import { type UserType } from "../types/UserType";

export const userFixture: UserType = {
  id: 1,
  name: "Ana Souza",
  email: "ana@example.com",
};

export function makeList(overrides: Partial<ListType> = {}): ListType {
  return {
    id: 1,
    title: "Mercado",
    createdAt: "2026-11-20T12:00:00.000Z",
    totalTasks: 0,
    pendingTasks: 0,
    ...overrides,
  };
}

export function makeTask(overrides: Partial<TaskType> = {}): TaskType {
  return {
    id: 1,
    listId: 1,
    text: "Comprar pão",
    done: false,
    createdAt: "2026-11-20T12:00:00.000Z",
    ...overrides,
  };
}
