"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUsername } from "@/lib/session/useUsername";
import { UsernamePrompt } from "@/components/UsernamePrompt";
import { GameShell } from "@/components/game/GameShell";
import { GameOverlay } from "@/components/game/GameOverlay";
import { useTetris, type GameStats } from "@/lib/game-react/useTetris";
import { postScore } from "@/lib/api";
import { Button, IconButton } from "@/components/ui";
import { ArrowLeftIcon, RefreshIcon, TrophyIcon } from "@/components/icons";

function SinglePlayerGame({ username }: { username: string }) {
  const router = useRouter();
  const [final, setFinal] = useState<GameStats | null>(null);
  const submitted = useRef(false);

  const controller = useTetris({
    onGameOver: (stats) => {
      setFinal(stats);
      if (!submitted.current) {
        submitted.current = true;
        postScore({
          username,
          points: stats.score,
          mode: "SINGLE",
          lines: stats.lines,
          level: stats.level,
        }).catch(() => {
          /* leaderboard write failed (e.g. offline) — keep playing */
        });
      }
    },
  });

  const restart = () => {
    submitted.current = false;
    setFinal(null);
    controller.restart();
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 py-4">
      <GameShell
        controller={controller}
        topSlot={
          <div className="flex w-full max-w-md items-center justify-between">
            <Link href="/" aria-label="Back to menu">
              <IconButton>
                <ArrowLeftIcon />
              </IconButton>
            </Link>
            <span className="text-sm font-semibold text-muted">
              Single Player · {username}
            </span>
            <IconButton onClick={restart} aria-label="Restart" title="Restart">
              <RefreshIcon />
            </IconButton>
          </div>
        }
        overlay={
          final && (
            <GameOverlay>
              <h2 className="text-2xl font-extrabold">Game Over</h2>
              <p className="mt-1 text-sm text-muted">
                Saved to the leaderboard as{" "}
                <span className="font-semibold text-fg">{username}</span>
              </p>
              <div className="my-5 grid grid-cols-3 gap-2">
                <div className="min-w-0">
                  <div className="text-[0.6rem] uppercase tracking-widest text-muted">
                    Score
                  </div>
                  <div className="truncate font-mono text-base font-bold tabular-nums">
                    {final.score.toLocaleString()}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-[0.6rem] uppercase tracking-widest text-muted">
                    Lines
                  </div>
                  <div className="truncate font-mono text-base font-bold tabular-nums">
                    {final.lines}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-[0.6rem] uppercase tracking-widest text-muted">
                    Level
                  </div>
                  <div className="truncate font-mono text-base font-bold tabular-nums">
                    {final.level}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={restart} className="w-full">
                  Play again
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => router.push("/leaderboard")}
                >
                  <TrophyIcon width={16} height={16} />
                  Leaderboard
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => router.push("/")}
                >
                  Home
                </Button>
              </div>
            </GameOverlay>
          )
        }
      />
    </div>
  );
}

export default function PlayPage() {
  const router = useRouter();
  const username = useUsername((s) => s.username);
  const hydrated = useUsername((s) => s.hydrated);

  if (!hydrated) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted">
        Loading…
      </div>
    );
  }

  if (!username) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <UsernamePrompt
          open
          onComplete={() => {}}
          onCancel={() => router.push("/")}
        />
      </div>
    );
  }

  return <SinglePlayerGame username={username} />;
}
