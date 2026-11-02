/**
 * -----------------------------------------------------------------------------
 * File: Navbar.tsx
 * Layer: Application Shell
 *
 * Purpose:
 * Provides the top navigation bar for the application.
 *
 * Responsibilities:
 * - Render the application header.
 * - Provide the mobile navigation toggle.
 * - Compose navigation search, notifications, and the account menu.
 *
 * Not Responsible For:
 * - Authentication.
 * - Routing.
 * - Business Logic.
 * -----------------------------------------------------------------------------
 */

import { Menu, MoonStar } from "lucide-react";

import { useTheme } from "./theme";
import NavSearch from "./NavSearch";
import NotificationsMenu from "./NotificationsMenu";
import ProfileMenu from "./ProfileMenu";

interface NavbarProps {
    onMenuClick: () => void;
}

function Navbar({ onMenuClick }: NavbarProps) {
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 dark:border-white/10 dark:bg-slate-900 md:px-6">
            <button
                type="button"
                onClick={onMenuClick}
                aria-label="Open navigation menu"
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white md:hidden"
            >
                <Menu aria-hidden="true" className="h-5 w-5" />
            </button>

            <div className="ml-auto flex items-center gap-2">
                <NavSearch />
                <NotificationsMenu />

                {/*
                  Shell-only toggle: switches Sidebar/Navbar chrome
                  between light and dark (ThemeProvider in
                  app/shell/theme). Page content is unaffected.
                */}
                <button
                    type="button"
                    onClick={toggleTheme}
                    aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                    className="hidden rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white sm:block"
                >
                    <MoonStar aria-hidden="true" className="h-5 w-5" />
                </button>

                <ProfileMenu />
            </div>
        </header>
    );
}

export default Navbar;
