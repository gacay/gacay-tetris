"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { fetchScores, type Mode, type ScoreRow } from "@/lib/api";
import { useAudio } from "@/lib/audio/useAudio";
import { cn, IconButton } from "@/components/ui";
import { ArrowLeftIcon, TrophyIcon } from "@/components/icons";

const TABS: { key: Mode; label: string }[] = [
  { key: "SINGLE", label: "Single Player" },
  { key: "MULTI", label: "Multiplayer" },
];

const RANK_STYLE: Record<number, string> = {
  1: "bg-[#f7d774] text-[#5b4a14]",
  2: "bg-[#d8d8e6] text-[#43435a]",
  3: "bg-[#f7b58c] text-[#5c3a22]",
};

function Row({ row, rank }: { row: ScoreRow; rank: number }) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(rank * 0.03, 0.3) }}
      className="flex items-center gap-3 border-b border-border/60 px-4 py-3 last:border-0"
    >
      <span
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold",
          RANK_STYLE[rank] ?? "bg-surface-2 text-muted",
        )}
      >
        {rank}
      </span>
      <span className="flex-1 truncate font-semibold">{row.username}</span>
      <span className="hidden text-xs text-muted sm:block">
        {row.lines} lines · Lv {row.level}
      </span>
      <span className="w-24 text-right font-mono font-bold tabular-nums">
        {row.points.toLocaleString()}
      </span>
    </motion.li>
  );
}

export default function LeaderboardPage() {
  const [mode, setMode] = useState<Mode>("SINGLE");
  const [rows, setRows] = useState<ScoreRow[] | null>(null);
  const play = useAudio((s) => s.play);

  useEffect(() => {
    let active = true;
    fetchScores(mode).then((r) => {
      if (active) setRows(r);
    });
    return () => {
      active = false;
    };
  }, [mode]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex items-center gap-3">
        <Link href="/" aria-label="Back to menu">
          <IconButton>
            <ArrowLeftIcon />
          </IconButton>
        </Link>
        <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight">
          <TrophyIcon width={26} height={26} className="text-accent" />
          Leaderboard
        </h1>
      </div>

      <div className="flex gap-1 rounded-2xl border border-border bg-surface-2 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              if (t.key !== mode) setRows(null);
              setMode(t.key);
              play("ui");
            }}
            className={cn(
              "flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
              mode === t.key
                ? "bg-accent text-accent-fg shadow"
                : "text-muted hover:text-fg",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 text-[0.65rem] font-bold uppercase tracking-widest text-muted">
          <span>Top 10</span>
          <span>Points</span>
        </div>
        {rows === null ? (
          <div className="px-4 py-12 text-center text-muted">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-12 text-center text-muted">
            No scores yet — be the first to make the board!
          </div>
        ) : (
          <ul>
            {rows.map((r, i) => (
              <Row key={r.id} row={r} rank={i + 1} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
