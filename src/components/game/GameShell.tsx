"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CanvasBoard } from "@/lib/game-react/render/CanvasBoard";
import { PiecePreview } from "@/lib/game-react/render/PiecePreview";
import { useGameInput } from "@/lib/game-react/useGameInput";
import type { TetrisController } from "@/lib/game-react/useTetris";
import { TouchControls } from "./TouchControls";
import { Button, cn } from "@/components/ui";

function Panel({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("card p-2.5 sm:p-3", className)}>
      <div className="mb-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-muted">
        {label}
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card px-2.5 py-2 text-center sm:px-3">
      <div className="text-[0.6rem] font-bold uppercase tracking-widest text-muted">
        {label}
      </div>
      <div className="font-mono text-base font-bold tabular-nums sm:text-xl">
        {value}
      </div>
    </div>
  );
}

export function GameShell({
  controller,
  inputEnabled = true,
  topSlot,
  bottomSlot,
  overlay,
}: {
  controller: TetrisController;
  inputEnabled?: boolean;
  topSlot?: ReactNode;
  bottomSlot?: ReactNode;
  overlay?: ReactNode;
}) {
  useGameInput(controller, inputEnabled);
  const { hud, banner } = controller;

  // Show on-screen controls on touch devices / small screens.
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse), (max-width: 639px)");
    // Sync to the media query on mount (client-only, avoids a hydration mismatch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsTouch(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsTouch(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <div className="flex w-full flex-col items-center gap-3">
      {topSlot}

      <div className="flex w-full items-stretch justify-center gap-2 sm:gap-4">
        {/* Left column: hold + stats */}
        <div className="flex w-16 shrink-0 flex-col gap-2 sm:w-28 sm:gap-3">
          <Panel label="Hold">
            <PiecePreview type={hud.hold} />
          </Panel>
          <Stat label="Score" value={hud.score.toLocaleString()} />
          <Stat label="Level" value={hud.level} />
          <Stat label="Lines" value={hud.lines} />
        </div>

        {/* Board — height is also capped by available width (width = height / 2)
            so the two side columns never push it off a narrow screen. */}
        <div className="relative aspect-[10/20] h-[min(52vh,calc((100vw_-_168px)*2),560px)] max-w-full shrink-0 touch-none sm:h-[min(64vh,560px)]">
          <CanvasBoard controller={controller} />

          <AnimatePresence>
            {banner && (
              <motion.div
                key={banner.id}
                initial={{ opacity: 0, y: -8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="pointer-events-none absolute inset-x-0 top-[12%] flex justify-center"
              >
                <span
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-extrabold shadow-lg backdrop-blur",
                    banner.tone === "great"
                      ? "bg-accent/90 text-accent-fg"
                      : "bg-surface/90 text-fg",
                  )}
                >
                  {banner.text}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {hud.status === "paused" && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-2xl bg-bg/70 backdrop-blur-sm">
              <p className="text-2xl font-extrabold">Paused</p>
              <Button onClick={controller.pause}>Resume</Button>
            </div>
          )}

          {overlay}
        </div>

        {/* Right column: next queue */}
        <div className="flex w-16 shrink-0 flex-col gap-2 sm:w-28">
          <Panel label="Next" className="flex-1">
            <div className="flex flex-col gap-1.5">
              {hud.next.slice(0, 5).map((t, i) => (
                <PiecePreview
                  key={i}
                  type={t}
                  className={i >= 3 ? "hidden sm:block" : undefined}
                />
              ))}
            </div>
          </Panel>
        </div>
      </div>

      {bottomSlot}

      {isTouch && (
        <div className="mt-1 w-full px-1">
          <TouchControls controller={controller} enabled={inputEnabled} />
        </div>
      )}

      <p className="mt-1 hidden max-w-xl text-center text-xs text-muted sm:block">
        ← → move · ↓ soft drop · Space hard drop · ↑ / X rotate · Z rotate ccw ·
        C hold · P pause
      </p>
    </div>
  );
}
