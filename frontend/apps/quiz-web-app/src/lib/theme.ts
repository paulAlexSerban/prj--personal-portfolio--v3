import type { AppSettings } from "@/store/types";

type Theme = AppSettings["theme"];

const QUERY = "(prefers-color-scheme: dark)";

function resolveDark(theme: Theme): boolean {
  if (theme === "dark") return true;
  if (theme === "light") return false;
  return typeof window !== "undefined" && window.matchMedia(QUERY).matches;
}

/** Apply a theme to the document root immediately. */
export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", resolveDark(theme));
}

let systemListener: ((e: MediaQueryListEvent) => void) | null = null;

/**
 * Apply the current theme and (for `system`) keep it in sync with the OS
 * preference. Safe to call repeatedly — the previous OS listener is replaced.
 */
export function initTheme(getTheme: () => Theme): void {
  if (typeof window === "undefined") return;
  applyTheme(getTheme());

  const mq = window.matchMedia(QUERY);
  if (systemListener) mq.removeEventListener("change", systemListener);
  systemListener = () => {
    if (getTheme() === "system") applyTheme("system");
  };
  mq.addEventListener("change", systemListener);
}
