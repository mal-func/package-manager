import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from "react";

import { ThemeContext, type Theme } from "./ThemeContext";

const STORAGE_KEY = "cdis-shell-theme";

function isTheme(value: string | null): value is Theme {
    return value === "light" || value === "dark";
}

function readStoredTheme(): Theme {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    // The shell has always rendered dark navy chrome — default to "dark"
    // (not system preference) so existing users see no visual change
    // until they actively choose otherwise.
    return isTheme(stored) ? stored : "dark";
}

export function ThemeProvider({ children }: PropsWithChildren) {
    const [theme, setTheme] = useState<Theme>(readStoredTheme);

    useEffect(() => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        window.localStorage.setItem(STORAGE_KEY, theme);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme((current) => (current === "dark" ? "light" : "dark"));
    }, []);

    const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
