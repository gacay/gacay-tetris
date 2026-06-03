"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createLobby } from "@/lib/api";
import { RequireUsername } from "@/components/RequireUsername";
import { DurationPicker } from "@/components/DurationPicker";
import { Button, IconButton } from "@/components/ui";
import { ArrowLeftIcon } from "@/components/icons";
import { useAudio } from "@/lib/audio/useAudio";

function CreateLobby({ username }: { username: string }) {
  const router = useRouter();
  const play = useAudio((s) => s.play);
  const [duration, setDuration] = useState<number>(180);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    setCreating(true);
    setError(null);
    play("ui");
    try {
      const { id } = await createLobby(username, duration);
      router.push(`/multiplayer/${id}`);
    } catch (e) {
      setError((e as Error).message);
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex items-center gap-3">
        <Link href="/multiplayer" aria-label="Back to lobbies">
          <IconButton>
            <ArrowLeftIcon />
          </IconButton>
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight">Create Lobby</h1>
      </div>

      <div className="card flex flex-col gap-5 p-6">
        <div>
          <h2 className="font-bold">Match duration</h2>
          <p className="text-sm text-muted">
            Whoever scores the most points before time runs out wins.
          </p>
        </div>
        <DurationPicker value={duration} onChange={setDuration} />

        {error && <p className="text-sm text-[#e08585]">{error}</p>}

        <Button onClick={create} disabled={creating} size="lg">
          {creating ? "Creating…" : "Create & wait for opponent"}
        </Button>
        <p className="text-center text-xs text-muted">
          Your lobby will appear in the public list as{" "}
          <span className="font-semibold text-fg">{username}</span>.
        </p>
      </div>
    </div>
  );
}

export default function CreateLobbyPage() {
  return (
    <RequireUsername>{(username) => <CreateLobby username={username} />}</RequireUsername>
  );
}
