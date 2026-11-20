import { type ReactNode, useEffect, useMemo, useState } from "react";

import { api, onUnauthorized } from "../services/api";
import { type UserType } from "../types/UserType";
import { AuthContext, type AuthContextValue } from "./AuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // Se qualquer chamada voltar 401, a sessão acabou: volta para o login.
    onUnauthorized(() => setUser(null));

    api.auth
      .me()
      .then((me) => active && setUser(me))
      .catch(() => active && setUser(null))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
      onUnauthorized(null);
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async login(email, password) {
        setUser(await api.auth.login({ email, password }));
      },
      async register(name, email, password) {
        setUser(await api.auth.register({ name, email, password }));
      },
      async logout() {
        try {
          await api.auth.logout();
        } finally {
          setUser(null);
        }
      },
    }),
    [user, loading],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
