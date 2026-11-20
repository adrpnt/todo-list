import { vi } from "vitest";

/**
 * Substituto do objeto `api` para os testes. Use com:
 * vi.mock("../services/api", async (importOriginal) => ({
 *   ...(await importOriginal()),
 *   api: (await import("../test/apiMock")).createApiMock(),
 * }));
 */
export function createApiMock() {
  return {
    auth: {
      me: vi.fn(),
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    },
    lists: {
      all: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      tasks: vi.fn(),
      addTask: vi.fn(),
    },
    tasks: {
      update: vi.fn(),
      remove: vi.fn(),
    },
  };
}
