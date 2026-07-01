"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  ChartBarIcon,
  ReceiptIcon,
  ShoppingCartIcon,
  TagIcon,
  WalletIcon,
} from "@phosphor-icons/react";
import { useHydrated } from "@/lib/store";
import { useOpenSession } from "@/lib/selectors";
import { BusinessBadge } from "./business-badge";
import { ThemeToggle, useApplyTheme } from "./theme-toggle";
import { cx } from "./ui";

interface NavItem {
  href: string;
  label: string;
  icon: typeof ShoppingCartIcon;
}

const NAV: NavItem[] = [
  { href: "/pos", label: "Vender", icon: ShoppingCartIcon },
  { href: "/productos", label: "Productos", icon: TagIcon },
  { href: "/caja", label: "Caja", icon: WalletIcon },
  { href: "/reportes", label: "Reportes", icon: ChartBarIcon },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppShell({ children }: { children: ReactNode }) {
  useApplyTheme();
  const hydrated = useHydrated();
  const pathname = usePathname();
  const openSession = useOpenSession();

  if (!hydrated) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-fg">
            <ReceiptIcon size={26} weight="fill" />
          </div>
          <p className="text-sm font-medium text-fg-subtle">Cargando Caja…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-surface px-3 py-4 lg:flex">
        <div className="flex items-center gap-2 px-1 pb-4">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-fg">
            <ReceiptIcon size={19} weight="fill" />
          </span>
          <span className="font-display text-lg font-bold text-fg">Caja</span>
        </div>

        <BusinessBadge />

        <nav className="mt-4 flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                  active
                    ? "bg-accent-soft text-accent"
                    : "text-fg-muted hover:bg-surface-2 hover:text-fg"
                )}
              >
                <Icon size={20} weight={active ? "fill" : "regular"} />
                <span className="flex-1">{item.label}</span>
                {item.href === "/caja" && openSession && (
                  <span
                    className="h-2 w-2 rounded-full bg-success"
                    title="Caja abierta"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center justify-between border-t border-border pt-3">
          <p className="px-1 text-xs text-fg-subtle">Sin conexión a DB · local</p>
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-surface/90 px-3 py-2.5 backdrop-blur lg:hidden">
        <div className="flex-1">
          <BusinessBadge />
        </div>
        <ThemeToggle />
      </header>

      {/* Main */}
      <main className="min-w-0 flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold",
                active ? "text-accent" : "text-fg-subtle"
              )}
            >
              <Icon size={23} weight={active ? "fill" : "regular"} />
              {item.label}
              {item.href === "/caja" && openSession && (
                <span className="absolute right-[calc(50%-1.35rem)] top-1.5 h-2 w-2 rounded-full bg-success" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
