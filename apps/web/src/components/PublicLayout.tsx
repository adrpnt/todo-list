import { Navigate, Outlet, useLocation } from "react-router";

import { useAuth } from "../hooks/useAuth";
import { LoadingScreen } from "./LoadingScreen";
import { ThemeToggle } from "./ThemeToggle";

/** Telas de login/cadastro: quem já está logado volta para onde queria ir. */
export function PublicLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (user) {
    const from = (location.state as { from?: string } | null)?.from ?? "/";
    return <Navigate to={from} replace />;
  }

  return (
    <div className="shell">
      <header className="topbar">
        <span className="brand">Livro de registros</span>
        <ThemeToggle />
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
