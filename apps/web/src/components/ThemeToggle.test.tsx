import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { ThemeProvider } from "../contexts/ThemeProvider";
import { ThemeToggle } from "./ThemeToggle";

function renderToggle() {
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );

  return userEvent.setup();
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    delete document.documentElement.dataset.theme;
  });

  it("começa no tema salvo pelo usuário", () => {
    localStorage.setItem("@theme", "dark");

    renderToggle();

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(screen.getByRole("button", { name: "Ativar tema claro" })).toBeInTheDocument();
  });

  it("usa o tema já aplicado no html quando não há preferência salva", () => {
    document.documentElement.dataset.theme = "dark";

    renderToggle();

    expect(screen.getByRole("button", { name: "Ativar tema claro" })).toBeInTheDocument();
  });

  it("cai no tema claro sem preferência nem tema aplicado", () => {
    renderToggle();

    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("alterna o tema e salva a escolha", async () => {
    const user = renderToggle();

    await user.click(screen.getByRole("button", { name: "Ativar tema escuro" }));

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("@theme")).toBe("dark");

    await user.click(screen.getByRole("button", { name: "Ativar tema claro" }));

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem("@theme")).toBe("light");
  });
});
