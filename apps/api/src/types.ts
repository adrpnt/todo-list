import type { DatabaseSync } from "node:sqlite";

export type Database = DatabaseSync;

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface TaskList {
  id: number;
  title: string;
  createdAt: string;
  totalTasks: number;
  pendingTasks: number;
}

export interface Task {
  id: number;
  listId: number;
  text: string;
  done: boolean;
  createdAt: string;
}

export interface AppEnv {
  Variables: {
    user: User;
  };
}
