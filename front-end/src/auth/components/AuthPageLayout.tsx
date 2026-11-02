import type { ReactNode } from "react";

import { LayoutDashboard, RefreshCw, ShieldCheck } from "lucide-react";

import { appConfig } from "@/config/appConfig";

const FEATURES: Array<{ icon: typeof ShieldCheck; iconClassName: string; text: string }> = [
  {
    icon: ShieldCheck,
    iconClassName: "text-accent-green",
    text: "Role-based access control, enforced permission-by-permission on every request",
  },
  {
    icon: RefreshCw,
    iconClassName: "text-accent-blue",
    text: "Rotating sessions with automatic refresh-token theft detection",
  },
  {
    icon: LayoutDashboard,
    iconClassName: "text-accent-yellow",
    text: "A working dashboard, tables, and charts — ready from day one",
  },
];

/**
 * The two-panel shell shared by the Login and Register pages: brand
 * panel on the left (lg and up), the page's own form on the right.
 * Extracted from LoginPage unchanged so both pages stay identical.
 */
export function AuthPageLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen bg-white">
      {/* Brand panel — hidden below lg. Background is a dark navy gradient
          matching the app shell's Sidebar/Navbar (slate-900), with soft
          accent-color blurs from the logo palette for depth, plus a faint
          dot-grid texture so the panel isn't a flat color field. */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 px-12 py-12 text-white lg:flex">
        <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent-orange/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-accent-blue/15 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute right-16 top-1/3 h-48 w-48 rounded-full bg-accent-yellow/10 blur-3xl" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.13)_1px,transparent_1px)] bg-[length:22px_22px]"
        />

        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-lg">
            <img src="/cdis_logo.png" alt="" className="h-full w-full object-contain" />
          </span>
          <span className="text-sm font-semibold tracking-wide">{appConfig.app.name}</span>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold leading-tight text-balance">
            A secure foundation for every project your team ships.
          </h2>

          <ul className="mt-8 space-y-4">
            {FEATURES.map(({ icon: Icon, iconClassName, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/15">
                  <Icon aria-hidden="true" className={`h-3.5 w-3.5 ${iconClassName}`} />
                </span>
                <span className="text-sm leading-snug text-white/85">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/50">&copy; {new Date().getFullYear()} {appConfig.app.name}</p>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-1 flex-col items-center justify-center gap-8 px-6 py-12 lg:w-1/2">
        <div className="flex items-center gap-2.5 lg:hidden">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
            <img src="/cdis_logo.png" alt="" className="h-full w-full object-contain" />
          </span>
          <span className="text-sm font-semibold text-gray-900">{appConfig.app.name}</span>
        </div>

        {children}
      </div>
    </main>
  );
}
