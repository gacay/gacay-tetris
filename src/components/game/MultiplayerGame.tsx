"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GameShell } from "./GameShell";
import { GameOverlay } from "./GameOverlay";
import { useTetris } from "@/lib/game-react/useTetris";
import { seedFromString } from "@/lib/engine";
import { finishLobby, postLobbyScore, type LobbyState } from "@/lib/api";
import { formatClock } from "@/lib/constants";
import { useAudio } from "@/lib/audio/useAudio";
import { Button, cn } from "@/components/ui";

function PlayerTag({
  name,
  score,
  align,
}: {
  name: string;
  score: number;
  align: "left" | "right";
}) {
  return (
    <div className={cn("min-w-0 flex-1", align === "right" && "text-right")}>
      <div className="truncate text-xs font-semibold text-muted">{name}</div>
      <div className="font-mono text-lg font-bold tabular-nums">
        {score.toLocaleString()}
      </div>
    </div>
  );
}

export function MultiplayerGame({
  lobby,
  username,
  role,
  serverNow,
  refetch,
}: {
  lobby: LobbyState;
  username: string;
  role: "host" | "guest";
  serverNow: () => number;
  refetch: () => void;
}) {
  const router = useRouter();
  const play = useAudio((s) => s.play);
  const isHost = role === "host";

  const startMs = lobby.startedAt ? Date.parse(lobby.startedAt) : null;
  const durMs = lobby.durationSec * 1000;
  const finished = lobby.status === "FINISHED";
  const oppName = isHost ? lobby.guestUsername ?? "Opponent" : lobby.hostUsername;
  const oppScore = isHost ? lobby.guestScore : lobby.hostScore;

  // Ticking clock for countdown / remaining time.
  const [, setTick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 100);
    return () => clearInterval(iv);
  }, []);

  const now = serverNow();
  const countingDown = !finished && startMs !== null && now < startMs;
  const timeUp = !finished && startMs !== null && now >= startMs + durMs;
  const msToStart = startMs !== null ? startMs - now : 0;
  const msRemaining = startMs !== null ? startMs + durMs - now : durMs;

  // Throttled live-score reporting (~once / 750ms) plus a trailing send.
  const lastSentAt = useRef(0);
  const pending = useRef<number | null>(null);
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queueScore = (score: number) => {
    pending.current = score;
    const MIN = 750;
    const since = Date.now() - lastSentAt.current;
    if (since >= MIN) {
      lastSentAt.current = Date.now();
      void postLobbyScore(lobby.id, username, score);
    } else if (!flushTimer.current) {
      flushTimer.current = setTimeout(() => {
        flushTimer.current = null;
        lastSentAt.current = Date.now();
        if (pending.current != null)
          void postLobbyScore(lobby.id, username, pending.current);
      }, MIN - since);
    }
  };

  const finishSent = useRef(false);
  const onGameOver = (stats: { score: number }) => {
    void (async () => {
      try {
        await postLobbyScore(lobby.id, username, stats.score);
        if (!finishSent.current) {
          finishSent.current = true;
          await finishLobby(lobby.id, username);
          refetch();
        }
      } catch {
        /* network hiccup — lazy finalization on the server still resolves the match */
      }
    })();
  };

  const controller = useTetris({
    seed: seedFromString(lobby.id),
    paused: countingDown,
    onScore: queueScore,
    onGameOver,
  });
  const controllerRef = useRef(controller);
  useEffect(() => {
    controllerRef.current = controller;
  });

  // When the clock runs out, end the local game (funnels into onGameOver).
  const timeUpHandled = useRef(false);
  useEffect(() => {
    if (timeUp && !timeUpHandled.current) {
      timeUpHandled.current = true;
      controllerRef.current.forceGameOver();
    }
  }, [timeUp]);

  // Countdown beeps + "go".
  const lastCount = useRef<number | null>(null);
  useEffect(() => {
    if (countingDown) {
      const s = Math.ceil(msToStart / 1000);
      if (lastCount.current !== s) {
        lastCount.current = s;
        if (s > 0) play("count");
      }
    } else if (lastCount.current && lastCount.current > 0) {
      lastCount.current = 0;
      play("go");
    }
  }, [countingDown, msToStart, play]);

  const myScore = controller.hud.score;
  const localDone = controller.hud.status === "over";
  const iWon = finished && lobby.winner === username && lobby.winner !== "DRAW";
  const draw = finished && lobby.winner === "DRAW";

  const topSlot = (
    <div className="card flex w-full max-w-md items-center gap-3 px-4 py-2">
      <PlayerTag name={`${username} (you)`} score={myScore} align="left" />
      <div className="shrink-0 text-center">
        <div className="text-[0.55rem] uppercase tracking-widest text-muted">
          Time
        </div>
        <div className="font-mono text-2xl font-bold tabular-nums">
          {formatClock(finished ? 0 : Math.max(0, msRemaining))}
        </div>
      </div>
      <PlayerTag name={oppName} score={oppScore} align="right" />
    </div>
  );

  let overlay = null;
  if (countingDown) {
    overlay = (
      <GameOverlay>
        <div className="text-xs uppercase tracking-widest text-muted">
          Get ready
        </div>
        <div className="brand-gradient my-1 text-7xl font-extrabold">
          {Math.max(1, Math.ceil(msToStart / 1000))}
        </div>
        <div className="text-muted">vs {oppName}</div>
      </GameOverlay>
    );
  } else if (finished) {
    overlay = (
      <GameOverlay>
        <h2 className="text-2xl font-extrabold">
          {draw ? "Draw!" : iWon ? "You win! 🎉" : "You lose"}
        </h2>
        <div className="my-5 flex items-center justify-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[0.6rem] uppercase tracking-widest text-muted">
              You
            </div>
            <div className="truncate font-mono text-lg font-bold tabular-nums">
              {myScore.toLocaleString()}
            </div>
          </div>
          <div className="shrink-0 text-muted">vs</div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[0.6rem] uppercase tracking-widest text-muted">
              {oppName}
            </div>
            <div className="truncate font-mono text-lg font-bold tabular-nums">
              {oppScore.toLocaleString()}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button className="w-full" onClick={() => router.push("/multiplayer")}>
            Back to lobbies
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
    );
  } else if (localDone) {
    overlay = (
      <GameOverlay>
        <h2 className="text-xl font-extrabold">Topped out!</h2>
        <p className="mt-2 text-sm text-muted">
          Final score {myScore.toLocaleString()}. Waiting for the match to end…
        </p>
      </GameOverlay>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 py-4">
      <GameShell
        controller={controller}
        inputEnabled={!countingDown && !finished && !localDone}
        topSlot={topSlot}
        overlay={overlay}
      />
    </div>
  );
}
