"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import type { Channel } from "pusher-js";
import { joinLobby, listLobbies, type LobbyListItem } from "@/lib/api";
import { CH, getPusherClient } from "@/lib/pusher/pusherClient";
import { RequireUsername } from "@/components/RequireUsername";
import { LobbyCard } from "@/components/LobbyCard";
import { Button, IconButton } from "@/components/ui";
import { ArrowLeftIcon, PlusIcon, RefreshIcon, UsersIcon } from "@/components/icons";
import { useAudio } from "@/lib/audio/useAudio";

function LobbyBrowser({ username }: { username: string }) {
  const router = useRouter();
  const play = useAudio((s) => s.play);
  const [lobbies, setLobbies] = useState<LobbyListItem[] | null>(null);
  const [joining, setJoining] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLobbies(await listLobbies());
  }, []);

  useEffect(() => {
    let active = true;
    // Initial load — refresh is async, so setState only runs after the fetch resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    const iv = setInterval(() => {
      if (active) void refresh();
    }, 3000);

    const pusher = getPusherClient();
    let channel: Channel | null = null;
    if (pusher) {
      channel = pusher.subscribe(CH.lobbies);
      channel.bind("lobby-list-changed", () => void refresh());
    }
    return () => {
      active = false;
      clearInterval(iv);
      if (pusher && channel) {
        channel.unbind_all();
        pusher.unsubscribe(CH.lobbies);
      }
    };
  }, [refresh]);

  const join = async (l: LobbyListItem) => {
    setJoining(l.id);
    setNotice(null);
    play("ui");
    try {
      const res = await joinLobby(l.id, username);
      if (res.ok) router.push(`/multiplayer/${l.id}`);
      else {
        setNotice("That lobby just filled up — try another!");
        void refresh();
      }
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setJoining(null);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex items-center gap-3">
        <Link href="/" aria-label="Back to menu">
          <IconButton>
            <ArrowLeftIcon />
          </IconButton>
        </Link>
        <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight">
          <UsersIcon width={26} height={26} className="text-accent" />
          Public Lobbies
        </h1>
      </div>

      <div className="flex gap-2">
        <Button
          className="flex-1"
          onClick={() => {
            play("ui");
            router.push("/multiplayer/create");
          }}
        >
          <PlusIcon width={18} height={18} />
          Create lobby
        </Button>
        <IconButton
          onClick={() => {
            play("ui");
            void refresh();
          }}
          title="Refresh"
          className="border border-border"
        >
          <RefreshIcon />
        </IconButton>
      </div>

      {notice && (
        <div className="card border-accent/50 p-3 text-center text-sm">
          {notice}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {lobbies === null ? (
          <div className="card p-10 text-center text-muted">Loading…</div>
        ) : lobbies.length === 0 ? (
          <div className="card p-10 text-center text-muted">
            No open lobbies right now — create one and wait for a challenger!
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {lobbies.map((l) => (
              <LobbyCard
                key={l.id}
                lobby={l}
                joining={joining === l.id}
                onJoin={() => join(l)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

export default function MultiplayerPage() {
  return (
    <RequireUsername>
      {(username) => <LobbyBrowser username={username} />}
    </RequireUsername>
  );
}
