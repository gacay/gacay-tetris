"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Channel } from "pusher-js";
import { getLobby, type LobbyState } from "@/lib/api";
import { CH, getPusherClient } from "@/lib/pusher/pusherClient";

/**
 * Live lobby state. Pusher pushes trigger an immediate refetch; a slow poll is
 * kept as a safety net (and the only transport when Pusher isn't configured).
 */
export function useLobby(id: string, pollMs = 1500) {
  const [lobby, setLobby] = useState<LobbyState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const offsetRef = useRef(0);

  const refetch = useCallback(async () => {
    try {
      const l = await getLobby(id);
      offsetRef.current = l.serverNow - Date.now();
      setLobby(l);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id]);

  useEffect(() => {
    let active = true;
    // Initial load — refetch is async, so setState only runs after the fetch resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refetch();
    const interval = setInterval(() => {
      if (active) void refetch();
    }, pollMs);

    const pusher = getPusherClient();
    let channel: Channel | null = null;
    if (pusher) {
      channel = pusher.subscribe(CH.lobby(id));
      const onAny = () => void refetch();
      channel.bind("game-started", onAny);
      channel.bind("score-updated", onAny);
      channel.bind("game-finished", onAny);
    }

    return () => {
      active = false;
      clearInterval(interval);
      if (pusher && channel) {
        channel.unbind_all();
        pusher.unsubscribe(CH.lobby(id));
      }
    };
  }, [id, pollMs, refetch]);

  /** Server-aligned wall clock (ms). */
  const serverNow = useCallback(() => Date.now() + offsetRef.current, []);

  return { lobby, error, refetch, serverNow };
}
