import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { vi } from "vitest";

import App from "../App";
import { AuthContext, type AuthContextValue } from "../contexts/AuthContext";
import { ThemeProvider } from "../contexts/ThemeProvider";
import { userFixture } from "./fixtures";

interface RenderAppOptions {
  route?: string;
  auth?: Partial<AuthContextValue>;
}

/** Renderiza o app inteiro (rotas e layouts) com um contexto de auth controlado. */
export function renderApp({ route = "/", auth = {} }: RenderAppOptions = {}) {
  const authValue: AuthContextValue = {
    user: userFixture,
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    ...auth,
  };

  const result = render(
    <ThemeProvider>
      <AuthContext value={authValue}>
        <MemoryRouter initialEntries={[route]}>
          <App />
        </MemoryRouter>
      </AuthContext>
    </ThemeProvider>,
  );

  return { ...result, authValue, user: userEvent.setup() };
}
