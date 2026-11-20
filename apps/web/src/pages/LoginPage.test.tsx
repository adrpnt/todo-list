import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ApiError } from "../services/api";
import { renderApp } from "../test/renderApp";

describe("LoginPage", () => {
  it("envia e-mail e senha para o login", async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    const { user } = renderApp({ route: "/login", auth: { user: null, login } });

    await user.type(screen.getByLabelText("E-mail"), "ana@example.com");
    await user.type(screen.getByLabelText("Senha"), "senha-segura");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(login).toHaveBeenCalledWith("ana@example.com", "senha-segura");
  });

  it("mostra o erro devolvido pela API", async () => {
    const login = vi
      .fn()
      .mockRejectedValue(new ApiError(401, "E-mail ou senha inválidos"));
    const { user } = renderApp({ route: "/login", auth: { user: null, login } });

    await user.type(screen.getByLabelText("E-mail"), "ana@example.com");
    await user.type(screen.getByLabelText("Senha"), "errada123");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("E-mail ou senha inválidos");
    expect(screen.getByRole("button", { name: "Entrar" })).toBeEnabled();
  });

  it("leva para o cadastro", async () => {
    const { user } = renderApp({ route: "/login", auth: { user: null } });

    await user.click(screen.getByRole("link", { name: "Criar conta" }));

    expect(screen.getByRole("heading", { name: "Criar conta" })).toBeInTheDocument();
  });
});
