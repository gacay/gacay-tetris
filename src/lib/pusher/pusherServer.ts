import Pusher from "pusher";

let instance: Pusher | null = null;

export function getPusherServer(): Pusher | null {
  if (instance) return instance;
  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
  if (!appId || !key || !secret || !cluster) return null; // not configured -> polling only
  instance = new Pusher({ appId, key, secret, cluster, useTLS: true });
  return instance;
}

export async function trigger(
  channel: string,
  event: string,
  data: unknown,
): Promise<void> {
  const p = getPusherServer();
  if (!p) return;
  try {
    await p.trigger(channel, event, data);
  } catch (err) {
    console.error("Pusher trigger failed:", err);
  }
}

export const CH = {
  lobbies: "lobbies",
  lobby: (id: string) => `lobby-${id}`,
};

export const EV = {
  listChanged: "lobby-list-changed",
  gameStarted: "game-started",
  scoreUpdated: "score-updated",
  gameFinished: "game-finished",
};
