"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type Action,
  apply,
  createGame,
  type GameEvent,
  type GameState,
  NEXT_COUNT,
  type PieceType,
  step,
  togglePause,
} from "@/lib/engine";
import { useAudio } from "@/lib/audio/useAudio";

export interface GameStats {
  score: number;
  lines: number;
  level: number;
}

export interface Hud extends GameStats {
  status: GameState["status"];
  combo: number;
  hold: PieceType | null;
  next: PieceType[];
}

export interface Banner {
  text: string;
  tone: "normal" | "great";
  id: number;
}

export interface TetrisController {
  stateRef: React.RefObject<GameState>;
  /** Visual-only event queue drained by the canvas renderer for effects. */
  visualQueueRef: React.RefObject<GameEvent[]>;
  hud: Hud;
  banner: Banner | null;
  doAction: (a: Action) => void;
  pause: () => void;
  restart: () => void;
  forceGameOver: () => void;
}

interface Options {
  seed?: number;
  paused?: boolean;
  onGameOver?: (stats: GameStats) => void;
  onScore?: (score: number) => void;
}

function lineName(n: number): string {
  return n === 1 ? "Single" : n === 2 ? "Double" : n === 3 ? "Triple" : "Quad";
}

export function useTetris(options: Options = {}): TetrisController {
  const [initialState] = useState(() => createGame(options.seed));
  const stateRef = useRef<GameState>(initialState);
  const seedRef = useRef(options.seed);
  useEffect(() => {
    seedRef.current = options.seed;
  }, [options.seed]);

  const visualQueueRef = useRef<GameEvent[]>([]);
  const endedRef = useRef(false);
  const lastScoreRef = useRef(0);

  const pausedRef = useRef(!!options.paused);
  useEffect(() => {
    pausedRef.current = !!options.paused;
  }, [options.paused]);

  const onGameOverRef = useRef(options.onGameOver);
  const onScoreRef = useRef(options.onScore);
  useEffect(() => {
    onGameOverRef.current = options.onGameOver;
    onScoreRef.current = options.onScore;
  });

  const play = useAudio((s) => s.play);
  const playRef = useRef(play);
  useEffect(() => {
    playRef.current = play;
  }, [play]);

  const [hud, setHud] = useState<Hud>({
    score: 0,
    lines: 0,
    level: 1,
    status: "playing",
    combo: -1,
    hold: null,
    next: [],
  });
  const hudRef = useRef(hud);

  const [banner, setBanner] = useState<Banner | null>(null);
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bannerId = useRef(0);

  const showBanner = useCallback((text: string, tone: Banner["tone"]) => {
    bannerId.current += 1;
    setBanner({ text, tone, id: bannerId.current });
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    bannerTimer.current = setTimeout(() => setBanner(null), 1300);
  }, []);

  const syncHud = useCallback((s: GameState) => {
    const prev = hudRef.current;
    const nextQueue = s.queue.slice(0, NEXT_COUNT);
    if (
      prev.score !== s.score ||
      prev.lines !== s.lines ||
      prev.level !== s.level ||
      prev.status !== s.status ||
      prev.combo !== s.combo ||
      prev.hold !== s.hold ||
      prev.next.join() !== nextQueue.join()
    ) {
      const nextHud: Hud = {
        score: s.score,
        lines: s.lines,
        level: s.level,
        status: s.status,
        combo: s.combo,
        hold: s.hold,
        next: nextQueue,
      };
      hudRef.current = nextHud;
      setHud(nextHud);
    }
    if (s.score !== lastScoreRef.current) {
      lastScoreRef.current = s.score;
      onScoreRef.current?.(s.score);
    }
  }, []);

  const handleEvents = useCallback(
    (events: GameEvent[]) => {
      const p = playRef.current;
      for (const e of events) {
        switch (e.type) {
          case "move":
            p("move");
            break;
          case "rotate":
            p("rotate");
            break;
          case "softdrop":
            p("softdrop");
            break;
          case "harddrop":
            p("harddrop");
            visualQueueRef.current.push(e);
            break;
          case "lock":
            p("lock");
            break;
          case "hold":
            p("hold");
            break;
          case "levelup":
            p("levelup");
            showBanner(`Level ${e.level}`, "great");
            break;
          case "gameover":
            p("gameover");
            break;
          case "lineclear": {
            visualQueueRef.current.push(e);
            let text: string;
            let tone: Banner["tone"] = "normal";
            if (e.tspin !== "none") {
              p("tspin");
              text = `T-Spin ${lineName(e.lines)}`;
              tone = "great";
            } else if (e.lines === 4) {
              p("tetris");
              text = "Tetris!";
              tone = "great";
            } else {
              p("lineclear");
              text = lineName(e.lines);
            }
            if (e.b2b) text = `B2B ${text}`;
            if (e.combo >= 1) text += ` · Combo ${e.combo + 1}`;
            showBanner(text, tone);
            break;
          }
        }
      }
    },
    [showBanner],
  );

  const checkGameOver = useCallback((s: GameState) => {
    if (s.status === "over" && !endedRef.current) {
      endedRef.current = true;
      onGameOverRef.current?.({
        score: s.score,
        lines: s.lines,
        level: s.level,
      });
    }
  }, []);

  const doAction = useCallback(
    (a: Action) => {
      if (pausedRef.current) return;
      const s = stateRef.current;
      if (!s || s.status !== "playing") return;
      const next = apply(s, a);
      stateRef.current = next;
      handleEvents(next.events);
      syncHud(next);
      checkGameOver(next);
    },
    [handleEvents, syncHud, checkGameOver],
  );

  const pause = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    stateRef.current = togglePause(s);
    syncHud(stateRef.current);
  }, [syncHud]);

  const restart = useCallback(() => {
    endedRef.current = false;
    lastScoreRef.current = 0;
    stateRef.current = createGame(seedRef.current);
    visualQueueRef.current = [];
    hudRef.current = {
      score: 0,
      lines: 0,
      level: 1,
      status: "playing",
      combo: -1,
      hold: null,
      next: [],
    };
    setHud(hudRef.current);
    setBanner(null);
  }, []);

  const forceGameOver = useCallback(() => {
    const s = stateRef.current;
    if (!s || s.status === "over") return;
    stateRef.current = { ...s, status: "over", events: [] };
    syncHud(stateRef.current);
    playRef.current("gameover");
    checkGameOver(stateRef.current);
  }, [syncHud, checkGameOver]);

  // Main logic loop (gravity + lock timers).
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(now - last, 100);
      last = now;
      const s = stateRef.current;
      if (s && !pausedRef.current && s.status === "playing") {
        const next = step(s, dt);
        stateRef.current = next;
        if (next.events.length) handleEvents(next.events);
        syncHud(next);
        checkGameOver(next);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      if (bannerTimer.current) clearTimeout(bannerTimer.current);
    };
  }, [handleEvents, syncHud, checkGameOver]);

  return {
    stateRef: stateRef as React.RefObject<GameState>,
    visualQueueRef,
    hud,
    banner,
    doAction,
    pause,
    restart,
    forceGameOver,
  };
}
