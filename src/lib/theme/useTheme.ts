"use client";

import { create } from "zustand";

export type Theme = "light" | "dark";

const STORAGE_KEY = "tetris:theme";

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

interface ThemeState {
  theme: Theme;
  /** Read the current theme that the no-FOUC inline script already applied. */
  hydrate: () => void;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

export const useTheme = create<ThemeState>((set, get) => ({
  theme: "light",
  hydrate: () => {
    if (typeof document === "undefined") return;
    const isDark = document.documentElement.classList.contains("dark");
    set({ theme: isDark ? "dark" : "light" });
  },
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },
  toggle: () => {
    const next: Theme = get().theme === "dark" ? "light" : "dark";
    applyTheme(next);
    set({ theme: next });
  },
}));
