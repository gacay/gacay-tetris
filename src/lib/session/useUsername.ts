"use client";

import { create } from "zustand";

const STORAGE_KEY = "tetris:username";
export const MAX_USERNAME_LEN = 16;

export function sanitizeUsername(name: string): string {
  return name.replace(/\s+/g, " ").trim().slice(0, MAX_USERNAME_LEN);
}

interface UsernameState {
  username: string | null;
  /** True once we've read localStorage on the client (avoids a prompt flash). */
  hydrated: boolean;
  hydrate: () => void;
  setUsername: (name: string) => void;
  clear: () => void;
}

export const useUsername = create<UsernameState>((set) => ({
  username: null,
  hydrated: false,
  hydrate: () => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    const clean = stored ? sanitizeUsername(stored) : "";
    set({ username: clean || null, hydrated: true });
  },
  setUsername: (name) => {
    const clean = sanitizeUsername(name);
    if (!clean) return;
    try {
      localStorage.setItem(STORAGE_KEY, clean);
    } catch {
      /* ignore */
    }
    set({ username: clean });
  },
  clear: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    set({ username: null });
  },
}));
