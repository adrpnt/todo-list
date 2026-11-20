import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ApiError, api } from "../services/api";
import { makeList } from "../test/fixtures";
import { renderApp } from "../test/renderApp";

vi.mock("../services/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../services/api")>()),
  api: (await import("../test/apiMock")).createApiMock(),
}));

describe("ListsPage", () => {
  it("cumprimenta o usuário e mostra as listas com o resumo de tarefas", async () => {
    vi.mocked(api.lists.all).mockResolvedValue([
      makeList({ id: 1, title: "Mercado", totalTasks: 3, pendingTasks: 2 }),
      makeList({ id: 2, title: "Casa", totalTasks: 2, pendingTasks: 0 }),
      makeList({ id: 3, title: "Viagem" }),
    ]);

    renderApp();

    expect(screen.getByText("Olá, Ana")).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "Mercado" })).toHaveAttribute(
      "href",
      "/lists/1",
    );
    expect(screen.getByText("2 pendentes de 3")).toBeInTheDocument();
    expect(screen.getByText("concluída · 2 tarefas")).toBeInTheDocument();
    expect(screen.getByText("nenhuma tarefa")).toBeInTheDocument();
    expect(screen.getByText("3 listas")).toBeInTheDocument();
  });

  it("mostra um aviso quando ainda não há listas", async () => {
    vi.mocked(api.lists.all).mockResolvedValue([]);

    renderApp();

    expect(
      await screen.findByText("Nenhuma lista ainda. Crie a primeira acima."),
    ).toBeInTheDocument();
  });

  it("cria uma lista", async () => {
    vi.mocked(api.lists.all).mockResolvedValue([]);
    vi.mocked(api.lists.create).mockResolvedValue(makeList({ id: 7, title: "Feira" }));
    const { user } = renderApp();

    await user.type(await screen.findByLabelText("Nova lista"), "  Feira ");
    await user.click(screen.getByRole("button", { name: "Criar" }));

    expect(api.lists.create).toHaveBeenCalledWith("Feira");
    expect(await screen.findByRole("link", { name: "Feira" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nova lista")).toHaveValue("");
  });

  it("não cria lista sem título", async () => {
    vi.mocked(api.lists.all).mockResolvedValue([]);
    const { user } = renderApp();

    await user.click(await screen.findByRole("button", { name: "Criar" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Escreva algo antes de adicionar.");
    expect(api.lists.create).not.toHaveBeenCalled();
  });

  it("renomeia uma lista", async () => {
    vi.mocked(api.lists.all).mockResolvedValue([makeList()]);
    vi.mocked(api.lists.update).mockResolvedValue(makeList({ title: "Supermercado" }));
    const { user } = renderApp();

    await user.click(await screen.findByRole("button", { name: 'Renomear "Mercado"' }));
    const input = screen.getByLabelText("Renomear lista");
    await user.clear(input);
    await user.type(input, "Supermercado{Enter}");

    expect(api.lists.update).toHaveBeenCalledWith(1, "Supermercado");
    expect(await screen.findByRole("link", { name: "Supermercado" })).toBeInTheDocument();
  });

  it("exclui uma lista depois de confirmar", async () => {
    vi.mocked(api.lists.all).mockResolvedValue([makeList()]);
    vi.mocked(api.lists.remove).mockResolvedValue(undefined);
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    const { user } = renderApp();

    await user.click(await screen.findByRole("button", { name: 'Excluir "Mercado"' }));

    expect(confirm).toHaveBeenCalledWith(
      'Excluir a lista "Mercado" e todas as suas tarefas?',
    );
    expect(api.lists.remove).toHaveBeenCalledWith(1);
    expect(await screen.findByText(/Nenhuma lista ainda/)).toBeInTheDocument();
  });

  it("mantém a lista quando a exclusão é cancelada", async () => {
    vi.mocked(api.lists.all).mockResolvedValue([makeList()]);
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const { user } = renderApp();

    await user.click(await screen.findByRole("button", { name: 'Excluir "Mercado"' }));

    expect(api.lists.remove).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Mercado" })).toBeInTheDocument();
  });

  it("mostra o erro quando não consegue carregar as listas", async () => {
    vi.mocked(api.lists.all).mockRejectedValue(
      new ApiError(0, "Não foi possível conectar ao servidor."),
    );

    renderApp();

    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText("Não foi possível conectar ao servidor.")).toBeInTheDocument();
  });
});
