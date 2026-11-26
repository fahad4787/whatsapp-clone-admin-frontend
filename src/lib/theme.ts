"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { STORAGE_KEYS } from "@/config/constants";

export type ThemePref = "light" | "dark" | "system";
export const THEME_PREFS: ThemePref[] = ["light", "dark", "system"];

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.theme);
    return v === "dark" || v === "system" ? v : "light";
  } catch {
    return "light";
  }
}

function resolve(pref: ThemePref) {
  if (pref !== "system") return pref;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function apply(pref: ThemePref) {
  const root = document.documentElement;
  // Swap colours in one frame without every transition firing at once.
  root.classList.add("theme-switching");
  if (resolve(pref) === "dark") root.dataset.theme = "dark";
  else delete root.dataset.theme;
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("theme-switching")));
}

function subscribe(cb: () => void) {
  // Another tab changed the theme: repaint this tab too, not just the menu's checkmark.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== null && e.key !== STORAGE_KEYS.theme) return;
    apply(readPref());
    cb();
  };
  listeners.add(cb);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

/** Current theme preference plus a setter. Persists to localStorage and follows the OS in "system" mode. */
export function useTheme() {
  const pref = useSyncExternalStore(subscribe, readPref, () => "light" as ThemePref);

  useEffect(() => {
    if (pref !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [pref]);

  const setPref = useCallback((next: ThemePref) => {
    try {
      localStorage.setItem(STORAGE_KEYS.theme, next);
    } catch {
      /* storage unavailable: still apply for this page view */
    }
    apply(next);
    emit();
  }, []);

  return { pref, setPref };
}
