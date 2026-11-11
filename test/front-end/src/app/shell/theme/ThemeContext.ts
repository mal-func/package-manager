import { createContext } from "react";

export type Theme = "light" | "dark";

/**
 * Shell theme context contract.
 *
 * Scope: the app chrome (Sidebar, Navbar) only — not a full app-wide
 * theme. Page content is unaffected by this toggle.
 */
export interface ThemeContextValue {
    theme: Theme;
    toggleTheme(): void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
