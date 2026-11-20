import { createContext } from "react";

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "@theme";

export interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

/** Escolha salva > tema já aplicado no <html> > preferência do sistema. */
export function getInitialTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (isTheme(stored)) return stored;

  const applied = document.documentElement.dataset.theme;
  if (isTheme(applied)) return applied;

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}
