"use client";

import { useRef, type ReactNode } from "react";
import type { Action } from "@/lib/engine";
import type { TetrisController } from "@/lib/game-react/useTetris";
import { cn } from "@/components/ui";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsDownIcon,
  LayersIcon,
  RotateCwIcon,
} from "@/components/icons";

function PadButton({
  onFire,
  repeat,
  label,
  disabled,
  className,
  children,
}: {
  onFire: () => void;
  repeat?: boolean;
  label: string;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const delay = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = () => {
    if (delay.current) clearTimeout(delay.current);
    if (interval.current) clearInterval(interval.current);
    delay.current = interval.current = null;
  };
  const start = (e: React.PointerEvent) => {
    e.preventDefault();
    if (disabled) return;
    onFire();
    if (repeat) {
      // press-and-hold auto-repeat (mirrors keyboard DAS/ARR)
      delay.current = setTimeout(() => {
        interval.current = setInterval(onFire, 55);
      }, 150);
    }
  };

  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        "flex h-14 touch-none select-none items-center justify-center rounded-2xl",
        "border border-border bg-surface text-fg/80 shadow-sm transition-transform",
        "active:scale-95 active:bg-surface-2 disabled:opacity-40",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function TouchControls({
  controller,
  enabled = true,
}: {
  controller: TetrisController;
  enabled?: boolean;
}) {
  const act = (a: Action) => () => controller.doAction(a);
  return (
    <div className="flex w-full max-w-md select-none items-stretch justify-between gap-3">
      <div className="grid flex-1 grid-cols-3 gap-1.5">
        <PadButton onFire={act("left")} repeat label="Move left" disabled={!enabled}>
          <ChevronLeftIcon width={24} height={24} />
        </PadButton>
        <PadButton
          onFire={act("softDrop")}
          repeat
          label="Soft drop"
          disabled={!enabled}
        >
          <ChevronDownIcon width={24} height={24} />
        </PadButton>
        <PadButton
          onFire={act("right")}
          repeat
          label="Move right"
          disabled={!enabled}
        >
          <ChevronRightIcon width={24} height={24} />
        </PadButton>
      </div>
      <div className="grid flex-1 grid-cols-3 gap-1.5">
        <PadButton onFire={act("hold")} label="Hold" disabled={!enabled}>
          <LayersIcon width={22} height={22} />
        </PadButton>
        <PadButton onFire={act("rotateCW")} label="Rotate" disabled={!enabled}>
          <RotateCwIcon width={22} height={22} />
        </PadButton>
        <PadButton
          onFire={act("hardDrop")}
          label="Hard drop"
          disabled={!enabled}
          className="text-accent"
        >
          <ChevronsDownIcon width={24} height={24} />
        </PadButton>
      </div>
    </div>
  );
}
