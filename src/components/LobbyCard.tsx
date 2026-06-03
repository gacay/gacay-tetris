"use client";

import { motion } from "framer-motion";
import type { LobbyListItem } from "@/lib/api";
import { formatDuration } from "@/lib/constants";
import { Button } from "./ui";
import { ClockIcon, UserIcon } from "./icons";

export function LobbyCard({
  lobby,
  onJoin,
  joining,
}: {
  lobby: LobbyListItem;
  onJoin: () => void;
  joining: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="card flex items-center justify-between gap-3 p-4"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 font-semibold">
          <UserIcon width={16} height={16} className="text-accent" />
          <span className="truncate">{lobby.hostUsername}</span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-sm text-muted">
          <ClockIcon width={14} height={14} />
          {formatDuration(lobby.durationSec)} match
        </div>
      </div>
      <Button size="sm" onClick={onJoin} disabled={joining}>
        {joining ? "Joining…" : "Join"}
      </Button>
    </motion.div>
  );
}
