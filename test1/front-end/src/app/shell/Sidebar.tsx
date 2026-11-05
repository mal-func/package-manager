/**
 * -----------------------------------------------------------------------------
 * File: Sidebar.tsx
 * Layer: Application Shell
 *
 * Purpose:
 * Renders the application's primary navigation.
 *
 * Responsibilities:
 * - Render navigation items.
 * - Delegate navigation data to configuration.
 * - Present as a static panel on desktop, an accessible slide-over
 *   drawer (Radix Dialog) on mobile.
 * - Support a collapsed (icon-only) desktop state.
 *
 * Not Responsible For:
 * - Route definitions.
 * - Permissions.
 * - Navigation configuration.
 * -----------------------------------------------------------------------------
 */

import { Dialog } from "radix-ui";
import { Menu } from "lucide-react";
import { NavLink } from "react-router-dom";

import { PermissionGate } from "@/auth";
import { appConfig } from "@/config/appConfig";

import { navigationConfig, type NavigationItem } from "../../config/navigation/navigationConfig.ts";

function NavigationLink({
    item,
    onNavigate,
    collapsed,
}: {
    item: NavigationItem;
    onNavigate?: () => void;
    collapsed?: boolean;
}) {
    const Icon = item.icon;

    return (
        <li>
            <NavLink
                to={item.path}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        collapsed ? "justify-center" : ""
                    } ${
                        isActive
                            ? "bg-slate-100 text-slate-900 dark:bg-white/10 dark:text-white"
                            : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
                    }`
                }
            >
                {Icon && <Icon aria-hidden="true" className="h-4 w-4 flex-shrink-0" />}
                {!collapsed && item.label}
            </NavLink>
        </li>
    );
}

function SidebarNav({ onNavigate, collapsed }: { onNavigate?: () => void; collapsed?: boolean }) {
    return (
        <nav className="flex-1 overflow-y-auto">
            <ul className="space-y-1">
                {navigationConfig.map((item: NavigationItem) =>
                    item.permission ? (
                        <PermissionGate key={item.path} permission={item.permission}>
                            <NavigationLink item={item} onNavigate={onNavigate} collapsed={collapsed} />
                        </PermissionGate>
                    ) : (
                        <NavigationLink key={item.path} item={item} onNavigate={onNavigate} collapsed={collapsed} />
                    ),
                )}
            </ul>
        </nav>
    );
}

function SidebarBrand({ collapsed }: { collapsed?: boolean }) {
    return (
        <div className="flex items-center gap-2.5 px-1 py-2">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white p-1 shadow-sm">
                <img src="/cdis_logo.png" alt={appConfig.app.name} className="h-full w-full object-contain" />
            </span>
            {!collapsed && (
                <div className="leading-tight">
                    <div className="text-sm font-bold tracking-wide text-slate-900 dark:text-white">{appConfig.app.name}</div>
                    <div className="text-[10px] font-semibold tracking-widest text-slate-500 dark:text-slate-400">
                        DASHBOARD
                    </div>
                </div>
            )}
        </div>
    );
}

function SidebarCollapseToggle({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
    return (
        <div className="flex items-center justify-start px-1 pb-2">
            <button
                type="button"
                onClick={onToggle}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
            >
                <Menu aria-hidden="true" className="h-5 w-5" />
            </button>
        </div>
    );
}

interface SidebarProps {
    mobileOpen: boolean;
    onMobileOpenChange: (open: boolean) => void;
    collapsed: boolean;
    onCollapsedChange: (collapsed: boolean) => void;
}

function Sidebar({ mobileOpen, onMobileOpenChange, collapsed, onCollapsedChange }: SidebarProps) {
    return (
        <>
            {/* Desktop: static, always visible */}
            <aside
                className={`hidden md:fixed md:inset-y-0 md:flex md:flex-col md:border-r md:border-slate-200 md:bg-white md:p-4 md:transition-[width] md:duration-200 dark:md:border-white/10 dark:md:bg-slate-900 ${
                    collapsed ? "md:w-20" : "md:w-64"
                }`}
            >
                <SidebarCollapseToggle collapsed={collapsed} onToggle={() => { onCollapsedChange(!collapsed); }} />

                <SidebarBrand collapsed={collapsed} />

                <div className="mt-4 flex flex-1 flex-col">
                    <SidebarNav collapsed={collapsed} />
                </div>
            </aside>

            {/* Mobile: accessible slide-over drawer (never collapsed) */}
            <Dialog.Root open={mobileOpen} onOpenChange={onMobileOpenChange}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 md:hidden" />
                    <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white p-4 shadow-lg dark:bg-slate-900 md:hidden">
                        <Dialog.Title className="sr-only">Navigation menu</Dialog.Title>
                        <SidebarBrand />
                        <div className="mt-4 flex flex-1 flex-col">
                            <SidebarNav onNavigate={() => { onMobileOpenChange(false); }} />
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </>
    );
}

export default Sidebar;
