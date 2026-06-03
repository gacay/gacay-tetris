"use client";

import Pusher from "pusher-js";

let instance: Pusher | null = null;

/** Browser Pusher singleton. Returns null when Pusher isn't configured. */
export function getPusherClient(): Pusher | null {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
  if (!key || !cluster) return null;
  if (!instance) instance = new Pusher(key, { cluster });
  return instance;
}

export const CH = {
  lobbies: "lobbies",
  lobby: (id: string) => `lobby-${id}`,
};
