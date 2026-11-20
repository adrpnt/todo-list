import { Link, Navigate, Outlet, useLocation } from "react-router";

import { useAuth } from "../hooks/useAuth";
import { LoadingScreen } from "./LoadingScreen";
import { ThemeToggle } from "./ThemeToggle";

/** Só deixa passar quem está logado; os demais vão para o login. */
export function PrivateLayout() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="brand">
          Livro de registros
        </Link>

        <div className="topbar-actions">
          <span className="topbar-user">{user.name}</span>
          <ThemeToggle />
          <button type="button" className="action-btn" onClick={logout}>
            Sair
          </button>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
