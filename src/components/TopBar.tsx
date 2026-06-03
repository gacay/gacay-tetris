"use client";

import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { MuteToggle, MusicToggle } from "./SoundToggles";
import { TrophyIcon } from "./icons";
import { IconButton } from "./ui";

function Logo() {
  // A tiny pastel "T" tetromino as the mark.
  const cells = [
    { x: 0, y: 1, c: "var(--piece-t)" },
    { x: 1, y: 0, c: "var(--piece-t)" },
    { x: 1, y: 1, c: "var(--piece-t)" },
    { x: 2, y: 1, c: "var(--piece-t)" },
  ];
  return (
    <span className="grid grid-cols-3 grid-rows-2 gap-[2px] transition-transform group-hover:rotate-6">
      {Array.from({ length: 6 }).map((_, i) => {
        const x = i % 3;
        const y = Math.floor(i / 3);
        const cell = cells.find((c) => c.x === x && c.y === y);
        return (
          <span
            key={i}
            className="h-2.5 w-2.5 rounded-[3px]"
            style={{
              background: cell ? cell.c : "transparent",
              boxShadow: cell ? "inset 0 0 0 1px rgba(255,255,255,.4)" : undefined,
            }}
          />
        );
      })}
    </span>
  );
}

export default function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-bg/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="group flex items-center gap-2.5">
          <Logo />
          <span className="brand-gradient text-lg font-extrabold tracking-tight">
            Pastel Tetris
          </span>
        </Link>
        <nav className="flex items-center gap-0.5">
          <Link href="/leaderboard" aria-label="Leaderboard" title="Leaderboard">
            <IconButton>
              <TrophyIcon />
            </IconButton>
          </Link>
          <MusicToggle />
          <MuteToggle />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
