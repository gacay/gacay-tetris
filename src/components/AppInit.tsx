"use client";

import { useEffect } from "react";
import { useTheme } from "@/lib/theme/useTheme";
import { useUsername } from "@/lib/session/useUsername";
import { useAudio } from "@/lib/audio/useAudio";

/** Hydrates client stores from localStorage and unlocks audio on first gesture. */
export default function AppInit() {
  useEffect(() => {
    useTheme.getState().hydrate();
    useUsername.getState().hydrate();
    useAudio.getState().hydrate();

    const unlock = () => useAudio.getState().unlock();
    const opts: AddEventListenerOptions = { once: true };
    window.addEventListener("pointerdown", unlock, opts);
    window.addEventListener("keydown", unlock, opts);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  return null;
}
