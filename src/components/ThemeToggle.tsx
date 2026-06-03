"use client";

import { useTheme } from "@/lib/theme/useTheme";
import { useAudio } from "@/lib/audio/useAudio";
import { IconButton } from "./ui";
import { MoonIcon, SunIcon } from "./icons";

export function ThemeToggle() {
  const theme = useTheme((s) => s.theme);
  const toggle = useTheme((s) => s.toggle);
  const play = useAudio((s) => s.play);

  return (
    <IconButton
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title="Toggle theme"
      onClick={() => {
        toggle();
        play("ui");
      }}
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </IconButton>
  );
}
