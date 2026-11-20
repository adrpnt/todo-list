import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, api } from "../services/api";
import { makeList, makeTask } from "../test/fixtures";
import { renderApp } from "../test/renderApp";

vi.mock("../services/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../services/api")>()),
  api: (await import("../test/apiMock")).createApiMock(),
}));

describe("TasksPage", () => {
  beforeEach(() => {
    vi.mocked(api.lists.get).mockResolvedValue(makeList({ title: "Mercado" }));
    vi.mocked(api.lists.tasks).mockResolvedValue([
      makeTask({ id: 1, text: "Comprar pão" }),
      makeTask({ id: 2, text: "Comprar café", done: true }),
    ]);
  });

  it("mostra a lista, as tarefas e quantas estão pendentes", async () => {
    renderApp({ route: "/lists/1" });

    expect(await screen.findByRole("heading", { name: "Mercado" })).toBeInTheDocument();
    expect(api.lists.get).toHaveBeenCalledWith(1);
    expect(api.lists.tasks).toHaveBeenCalledWith(1);
    expect(screen.getByRole("checkbox", { name: "Comprar pão" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Comprar café" })).toBeChecked();
    expect(screen.getByText("1 pendente")).toBeInTheDocument();
  });

  it("adiciona uma tarefa", async () => {
    vi.mocked(api.lists.addTask).mockResolvedValue(makeTask({ id: 3, text: "Comprar leite" }));
    const { user } = renderApp({ route: "/lists/1" });

    await user.type(await screen.findByLabelText("Nova tarefa"), "Comprar leite");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(api.lists.addTask).toHaveBeenCalledWith(1, "Comprar leite");
    expect(await screen.findByRole("checkbox", { name: "Comprar leite" })).toBeInTheDocument();
    expect(screen.getByText("2 pendentes")).toBeInTheDocument();
  });

  it("marca e desmarca uma tarefa como concluída", async () => {
    vi.mocked(api.tasks.update).mockResolvedValue(
      makeTask({ id: 1, text: "Comprar pão", done: true }),
    );
    const { user } = renderApp({ route: "/lists/1" });

    await user.click(await screen.findByRole("checkbox", { name: "Comprar pão" }));

    expect(api.tasks.update).toHaveBeenCalledWith(1, { done: true });
    expect(screen.getByRole("checkbox", { name: "Comprar pão" })).toBeChecked();
    expect(screen.getByText("0 pendentes")).toBeInTheDocument();
  });

  it("edita o texto de uma tarefa", async () => {
    vi.mocked(api.tasks.update).mockResolvedValue(
      makeTask({ id: 1, text: "Comprar pão integral" }),
    );
    const { user } = renderApp({ route: "/lists/1" });

    await user.click(await screen.findByRole("button", { name: 'Editar "Comprar pão"' }));
    const input = screen.getByLabelText("Editar tarefa");
    await user.clear(input);
    await user.type(input, "Comprar pão integral");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(api.tasks.update).toHaveBeenCalledWith(1, { text: "Comprar pão integral" });
    expect(await screen.findByText("Comprar pão integral")).toBeInTheDocument();
  });

  it("cancela a edição com Esc sem chamar a API", async () => {
    const { user } = renderApp({ route: "/lists/1" });

    await user.click(await screen.findByRole("button", { name: 'Editar "Comprar pão"' }));
    await user.type(screen.getByLabelText("Editar tarefa"), " mudou{Escape}");

    expect(api.tasks.update).not.toHaveBeenCalled();
    expect(screen.getByText("Comprar pão")).toBeInTheDocument();
  });

  it("exclui uma tarefa", async () => {
    vi.mocked(api.tasks.remove).mockResolvedValue(undefined);
    const { user } = renderApp({ route: "/lists/1" });

    await user.click(await screen.findByRole("button", { name: 'Excluir "Comprar pão"' }));

    expect(api.tasks.remove).toHaveBeenCalledWith(1);
    expect(screen.queryByText("Comprar pão")).not.toBeInTheDocument();
  });

  it("mostra o erro quando não consegue concluir a tarefa", async () => {
    vi.mocked(api.tasks.update).mockRejectedValue(new ApiError(500, "Erro interno do servidor"));
    const { user } = renderApp({ route: "/lists/1" });

    await user.click(await screen.findByRole("checkbox", { name: "Comprar pão" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Erro interno do servidor");
    expect(screen.getByRole("checkbox", { name: "Comprar pão" })).not.toBeChecked();
  });

  it("avisa quando a lista não existe", async () => {
    vi.mocked(api.lists.get).mockRejectedValue(new ApiError(404, "Lista não encontrada"));

    renderApp({ route: "/lists/99" });

    expect(
      await screen.findByRole("heading", { name: "Lista não encontrada" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "← todas as listas" })).toHaveAttribute("href", "/");
  });
});
