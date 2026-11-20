import { type ListType } from "../types/ListType";
import { type TaskType } from "../types/TaskType";
import { type UserType } from "../types/UserType";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

let unauthorizedHandler: (() => void) | null = null;

/** Registra quem deve ser avisado quando a API responder 401 (sessão expirada). */
export function onUnauthorized(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Algo deu errado. Tente novamente.";
}

async function request<T>(path: string, method = "GET", body?: unknown) {
  let response: Response;

  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: "same-origin",
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Não foi possível conectar ao servidor.");
  }

  if (response.status === 401) {
    unauthorizedHandler?.();
  }

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    throw new ApiError(
      response.status,
      data?.error ?? "Algo deu errado. Tente novamente.",
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  auth: {
    me: () => request<UserType>("/auth/me"),
    login: (data: { email: string; password: string }) =>
      request<UserType>("/auth/login", "POST", data),
    register: (data: { name: string; email: string; password: string }) =>
      request<UserType>("/auth/register", "POST", data),
    logout: () => request<void>("/auth/logout", "POST"),
  },
  lists: {
    all: () => request<ListType[]>("/lists"),
    get: (id: number) => request<ListType>(`/lists/${id}`),
    create: (title: string) => request<ListType>("/lists", "POST", { title }),
    update: (id: number, title: string) =>
      request<ListType>(`/lists/${id}`, "PATCH", { title }),
    remove: (id: number) => request<void>(`/lists/${id}`, "DELETE"),
    tasks: (id: number) => request<TaskType[]>(`/lists/${id}/tasks`),
    addTask: (id: number, text: string) =>
      request<TaskType>(`/lists/${id}/tasks`, "POST", { text }),
  },
  tasks: {
    update: (id: number, data: Partial<Pick<TaskType, "text" | "done">>) =>
      request<TaskType>(`/tasks/${id}`, "PATCH", data),
    remove: (id: number) => request<void>(`/tasks/${id}`, "DELETE"),
  },
};
