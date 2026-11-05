import { DropdownMenu } from "radix-ui";
import { ChevronDown, LogOut, Settings, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { hasPermission, useAuth } from "@/auth";
import { ROUTES } from "@/routes/routeConfig";

function initials(name: string): string {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
}

function capitalize(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * The one fully functional piece of navbar chrome — everything here is
 * backed by the real authenticated session and the real logout flow
 * (Milestone 5), not a placeholder. The role shown is the user's actual
 * primary role, not a hardcoded label.
 */
function ProfileMenu() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    if (!user) {
        return null;
    }

    const primaryRole = user.roles[0];

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button
                    type="button"
                    aria-label="Account menu"
                    className="flex items-center gap-2.5 rounded-md py-1 pl-1 pr-2 hover:bg-slate-100 dark:hover:bg-white/5"
                >
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                        {initials(user.name)}
                    </span>
                    <span className="hidden text-left leading-tight sm:block">
                        <span className="block text-sm font-medium text-slate-900 dark:text-white">{user.name}</span>
                        {primaryRole && (
                            <span className="block text-xs text-slate-500 dark:text-slate-400">
                                {capitalize(primaryRole)}
                            </span>
                        )}
                    </span>
                    <ChevronDown aria-hidden="true" className="hidden h-4 w-4 text-slate-400 dark:text-slate-500 sm:block" />
                </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align="end"
                    sideOffset={8}
                    className="z-50 w-56 rounded-md border border-gray-200 bg-white p-1 shadow-lg"
                >
                    <div className="border-b border-gray-100 px-3 py-2">
                        <p className="truncate text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="truncate text-xs text-gray-500">{user.email}</p>
                    </div>

                    <DropdownMenu.Item
                        onSelect={() => { navigate(ROUTES.SETTINGS); }}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 outline-none hover:bg-gray-100 data-[highlighted]:bg-gray-100"
                    >
                        <Settings aria-hidden="true" className="h-4 w-4 text-gray-500" />
                        Settings
                    </DropdownMenu.Item>

                    {/* Users is deliberately not a sidebar item (see
                        navigationConfig.ts); this is its entry point,
                        shown only to people the route would let in. */}
                    {hasPermission(user, "users:read") && (
                        <DropdownMenu.Item
                            onSelect={() => { navigate(ROUTES.USERS); }}
                            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 outline-none hover:bg-gray-100 data-[highlighted]:bg-gray-100"
                        >
                            <Users aria-hidden="true" className="h-4 w-4 text-gray-500" />
                            Users
                        </DropdownMenu.Item>
                    )}

                    <DropdownMenu.Separator className="my-1 h-px bg-gray-100" />

                    <DropdownMenu.Item
                        onSelect={() => { void logout(); }}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 outline-none hover:bg-gray-100 data-[highlighted]:bg-gray-100"
                    >
                        <LogOut aria-hidden="true" className="h-4 w-4 text-gray-500" />
                        Log out
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}

export default ProfileMenu;
