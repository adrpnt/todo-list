import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "./services/api";
import { renderApp } from "./test/renderApp";

vi.mock("./services/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./services/api")>()),
  api: (await import("./test/apiMock")).createApiMock(),
}));

describe("App", () => {
  beforeEach(() => {
    vi.mocked(api.lists.all).mockResolvedValue([]);
  });

  it("mostra o carregamento enquanto a sessão é verificada", () => {
    renderApp({ auth: { user: null, loading: true } });

    expect(screen.getByRole("status")).toHaveTextContent("Abrindo o livro…");
  });

  it("manda visitantes para o login ao acessar uma página privada", async () => {
    renderApp({ route: "/lists/1", auth: { user: null } });

    expect(await screen.findByRole("heading", { name: "Entrar" })).toBeInTheDocument();
  });

  it("manda quem já está logado do login para as listas", async () => {
    renderApp({ route: "/login" });

    expect(await screen.findByRole("heading", { name: "Suas listas" })).toBeInTheDocument();
  });

  it("redireciona rotas desconhecidas para a página inicial", async () => {
    renderApp({ route: "/nao-existe" });

    expect(await screen.findByRole("heading", { name: "Suas listas" })).toBeInTheDocument();
  });

  it("mostra o nome do usuário e permite sair", async () => {
    const { user, authValue } = renderApp();

    expect(screen.getByText("Ana Souza")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sair" }));

    expect(authValue.logout).toHaveBeenCalledOnce();
  });
});
