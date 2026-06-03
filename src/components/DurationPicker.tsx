"use client";

import { DURATIONS, formatDuration } from "@/lib/constants";
import { cn } from "./ui";
import { ClockIcon } from "./icons";

export function DurationPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {DURATIONS.map((d) => (
        <button
          key={d}
          onClick={() => onChange(d)}
          className={cn(
            "flex flex-col items-center gap-1.5 rounded-2xl border p-4 transition-all",
            value === d
              ? "border-accent bg-accent/10 text-accent"
              : "border-border bg-surface text-muted hover:border-accent/50",
          )}
        >
          <ClockIcon />
          <span className="font-bold">{formatDuration(d)}</span>
        </button>
      ))}
    </div>
  );
}
