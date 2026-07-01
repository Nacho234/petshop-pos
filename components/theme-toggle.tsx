"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { useStore } from "@/lib/store";
import type { ThemePref } from "@/lib/types";
import { cx } from "./ui";

function apply(theme: ThemePref) {
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = theme === "dark" || (theme === "system" && systemDark);
  document.documentElement.classList.toggle("dark", dark);
  localStorage.setItem("caja-theme", theme);
}

/** Keeps the DOM `.dark` class in sync with the stored preference. */
export function useApplyTheme() {
  const theme = useStore((s) => s.theme);
  useEffect(() => {
    apply(theme);
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);
}

/** Resolved dark state (handles the "system" preference). */
function useResolvedDark(): boolean {
  const theme = useStore((s) => s.theme);
  // Safe to read matchMedia in the initializer: this only renders after the app
  // has hydrated (AppShell shows a splash until then), so there is no SSR pass.
  const [systemDark, setSystemDark] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemDark(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return theme === "dark" || (theme === "system" && systemDark);
}

/** Labeled light/dark switch (used in the sidebar). Two states only. */
export function ThemeSwitch() {
  const isDark = useResolvedDark();
  const setTheme = useStore((s) => s.setTheme);
  return (
    <button
      role="switch"
      aria-checked={isDark}
      aria-label="Modo oscuro"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex w-full items-center justify-between rounded-lg px-1 py-1.5 hover:bg-surface-2"
    >
      <span className="flex items-center gap-2 text-sm font-semibold text-fg-muted">
        {isDark ? (
          <MoonIcon size={18} weight="fill" />
        ) : (
          <SunIcon size={18} weight="fill" />
        )}
        Modo oscuro
      </span>
      <span
        className={cx(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          isDark ? "bg-accent" : "bg-border-strong"
        )}
      >
        <span
          className={cx(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            isDark ? "translate-x-[1.375rem]" : "translate-x-0.5"
          )}
        />
      </span>
    </button>
  );
}

/** Compact icon toggle (used in the mobile top bar). */
export function ThemeToggle({ className }: { className?: string }) {
  const isDark = useResolvedDark();
  const setTheme = useStore((s) => s.setTheme);
  const Icon = isDark ? MoonIcon : SunIcon;
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={`Modo ${isDark ? "oscuro" : "claro"}. Cambiar a ${isDark ? "claro" : "oscuro"}`}
      title="Cambiar tema"
      className={cx(
        "grid h-10 w-10 place-items-center rounded-lg text-fg-muted hover:bg-surface-2 hover:text-fg",
        className
      )}
    >
      <Icon size={20} weight="fill" />
    </button>
  );
}
