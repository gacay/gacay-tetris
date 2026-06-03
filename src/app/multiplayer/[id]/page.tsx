"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { joinLobby } from "@/lib/api";
import type { LobbyState } from "@/lib/api";
import { formatDuration } from "@/lib/constants";
import { useLobby } from "@/lib/realtime/useLobby";
import { RequireUsername } from "@/components/RequireUsername";
import { MultiplayerGame } from "@/components/game/MultiplayerGame";
import { Button } from "@/components/ui";
import {
  ArrowLeftIcon,
  CheckIcon,
  ClockIcon,
  CopyIcon,
  UserIcon,
  UsersIcon,
} from "@/components/icons";

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center text-muted">
      {children}
    </div>
  );
}

function WaitingRoom({ lobby }: { lobby: LobbyState }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-4 py-8">
      <motion.div
        className="grid h-20 w-20 place-items-center rounded-full bg-accent/15 text-accent"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ repeat: Infinity, duration: 1.6 }}
      >
        <UsersIcon width={34} height={34} />
      </motion.div>
      <div className="text-center">
        <h1 className="text-2xl font-extrabold">Waiting for an opponent…</h1>
        <p className="mt-1 flex items-center justify-center gap-1.5 text-muted">
          <ClockIcon width={16} height={16} />
          {formatDuration(lobby.durationSec)} match · hosted by {lobby.hostUsername}
        </p>
      </div>

      <Button variant="secondary" onClick={copy} className="w-full">
        {copied ? <CheckIcon width={16} height={16} /> : <CopyIcon width={16} height={16} />}
        {copied ? "Link copied!" : "Copy invite link"}
      </Button>
      <Link href="/multiplayer" className="text-sm text-muted hover:text-fg">
        ← Cancel and back to lobbies
      </Link>
    </div>
  );
}

function JoinPanel({
  lobby,
  username,
  onJoined,
}: {
  lobby: LobbyState;
  username: string;
  onJoined: () => void;
}) {
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const join = async () => {
    setJoining(true);
    setError(null);
    try {
      const res = await joinLobby(lobby.id, username);
      if (res.ok) onJoined();
      else setError("This lobby just filled up.");
    } catch (e) {
      setError((e as Error).message);
      setJoining(false);
    }
  };
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-5 px-4 py-8 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-accent/15 text-accent">
        <UserIcon width={28} height={28} />
      </div>
      <div>
        <h1 className="text-2xl font-extrabold">Join {lobby.hostUsername}?</h1>
        <p className="mt-1 flex items-center justify-center gap-1.5 text-muted">
          <ClockIcon width={16} height={16} />
          {formatDuration(lobby.durationSec)} match
        </p>
      </div>
      {error && <p className="text-sm text-[#e08585]">{error}</p>}
      <Button onClick={join} disabled={joining} size="lg" className="w-full">
        {joining ? "Joining…" : "Join match"}
      </Button>
      <Link href="/multiplayer" className="text-sm text-muted hover:text-fg">
        ← Back to lobbies
      </Link>
    </div>
  );
}

function Room({ username }: { username: string }) {
  const params = useParams();
  const id = String(params.id);
  const { lobby, error, refetch, serverNow } = useLobby(id);

  if (error) {
    return (
      <Centered>
        <p>This lobby doesn&apos;t exist anymore.</p>
        <Link href="/multiplayer">
          <Button variant="secondary">Back to lobbies</Button>
        </Link>
      </Centered>
    );
  }
  if (!lobby) return <Centered>Loading lobby…</Centered>;

  const role =
    username === lobby.hostUsername
      ? "host"
      : username === lobby.guestUsername
        ? "guest"
        : "none";

  if (role === "host" || role === "guest") {
    if (lobby.status === "WAITING") return <WaitingRoom lobby={lobby} />;
    return (
      <MultiplayerGame
        lobby={lobby}
        username={username}
        role={role}
        serverNow={serverNow}
        refetch={refetch}
      />
    );
  }

  // Non-participant.
  if (lobby.status === "WAITING" && !lobby.guestUsername) {
    return <JoinPanel lobby={lobby} username={username} onJoined={refetch} />;
  }
  return (
    <Centered>
      <p>This match is already {lobby.status.toLowerCase()}.</p>
      <Link href="/multiplayer">
        <Button variant="secondary">
          <ArrowLeftIcon width={16} height={16} />
          Find another match
        </Button>
      </Link>
    </Centered>
  );
}

export default function LobbyRoomPage() {
  return <RequireUsername>{(username) => <Room username={username} />}</RequireUsername>;
}
