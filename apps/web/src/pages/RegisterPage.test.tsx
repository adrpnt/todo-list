import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ApiError } from "../services/api";
import { renderApp } from "../test/renderApp";

describe("RegisterPage", () => {
  it("envia nome, e-mail e senha para o cadastro", async () => {
    const register = vi.fn().mockResolvedValue(undefined);
    const { user } = renderApp({ route: "/register", auth: { user: null, register } });

    await user.type(screen.getByLabelText("Nome"), "Ana Souza");
    await user.type(screen.getByLabelText("E-mail"), "ana@example.com");
    await user.type(screen.getByLabelText("Senha"), "senha-segura");
    await user.click(screen.getByRole("button", { name: "Criar conta" }));

    expect(register).toHaveBeenCalledWith("Ana Souza", "ana@example.com", "senha-segura");
  });

  it("mostra o erro devolvido pela API", async () => {
    const register = vi.fn().mockRejectedValue(new ApiError(409, "E-mail já cadastrado"));
    const { user } = renderApp({ route: "/register", auth: { user: null, register } });

    await user.type(screen.getByLabelText("Nome"), "Ana");
    await user.type(screen.getByLabelText("E-mail"), "ana@example.com");
    await user.type(screen.getByLabelText("Senha"), "senha-segura");
    await user.click(screen.getByRole("button", { name: "Criar conta" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("E-mail já cadastrado");
  });
});
