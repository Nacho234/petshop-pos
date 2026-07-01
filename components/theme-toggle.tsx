"use client";

import { useEffect } from "react";
import { MoonIcon, SunIcon, DesktopIcon } from "@phosphor-icons/react";
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

const order: ThemePref[] = ["light", "dark", "system"];
const labels: Record<ThemePref, string> = {
  light: "Tema claro",
  dark: "Tema oscuro",
  system: "Tema del sistema",
};

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const next = order[(order.indexOf(theme) + 1) % order.length];
  const Icon = theme === "light" ? SunIcon : theme === "dark" ? MoonIcon : DesktopIcon;

  return (
    <button
      onClick={() => setTheme(next)}
      title={`${labels[theme]} — cambiar`}
      aria-label={`${labels[theme]}. Cambiar a ${labels[next].toLowerCase()}`}
      className={cx(
        "grid h-10 w-10 place-items-center rounded-lg text-fg-muted hover:bg-surface-2 hover:text-fg",
        className
      )}
    >
      <Icon size={20} weight="bold" />
    </button>
  );
}
