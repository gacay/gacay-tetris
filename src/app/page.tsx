"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useUsername } from "@/lib/session/useUsername";
import { useAudio } from "@/lib/audio/useAudio";
import { UsernamePrompt } from "@/components/UsernamePrompt";
import { PlayIcon, TrophyIcon, UsersIcon } from "@/components/icons";
import { cn } from "@/components/ui";

function ModeCard({
  title,
  desc,
  icon,
  accent,
  delay,
  onClick,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
  accent: string;
  delay: number;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 260, damping: 24 }}
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      className="card group relative flex flex-col items-start gap-4 overflow-hidden p-7 text-left"
    >
      <span
        className="grid h-14 w-14 place-items-center rounded-2xl text-white shadow-lg"
        style={{ background: accent }}
      >
        {icon}
      </span>
      <div>
        <h3 className="text-2xl font-bold tracking-tight">{title}</h3>
        <p className="mt-1 text-sm text-muted">{desc}</p>
      </div>
      <span className="mt-1 inline-flex items-center gap-1 font-semibold text-accent">
        Play
        <span className="transition-transform group-hover:translate-x-1">→</span>
      </span>
    </motion.button>
  );
}

export default function Home() {
  const router = useRouter();
  const username = useUsername((s) => s.username);
  const play = useAudio((s) => s.play);

  const [redirect, setRedirect] = useState<string | null>(null);
  const [promptOpen, setPromptOpen] = useState(false);

  const choose = (dest: string) => {
    play("ui");
    if (username) router.push(dest);
    else {
      setRedirect(dest);
      setPromptOpen(true);
    }
  };

  const onComplete = () => {
    setPromptOpen(false);
    const dest = redirect;
    setRedirect(null);
    if (dest) router.push(dest);
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-10 px-4 py-12">
      <motion.div
        className="flex flex-col items-center text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.h1
          className="brand-gradient text-6xl font-extrabold tracking-tighter sm:text-7xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
        >
          Pastel Tetris
        </motion.h1>
        <p className="mt-3 max-w-md text-balance text-muted">
          A cozy, modern take on the classic. Stack solo, or race a friend
          head-to-head in a public 1v1 lobby.
        </p>
      </motion.div>

      <div className="grid w-full gap-4 sm:grid-cols-2">
        <ModeCard
          title="Single Player"
          desc="Chase your best score and climb the leaderboard."
          icon={<PlayIcon width={26} height={26} />}
          accent="linear-gradient(135deg, var(--piece-t), var(--piece-j))"
          delay={0.08}
          onClick={() => choose("/play")}
        />
        <ModeCard
          title="Multiplayer"
          desc="Create or join a public lobby for a timed 1v1 duel."
          icon={<UsersIcon width={26} height={26} />}
          accent="linear-gradient(135deg, var(--piece-z), var(--piece-l))"
          delay={0.16}
          onClick={() => choose("/multiplayer")}
        />
      </div>

      <div className="flex flex-col items-center gap-3">
        <Link
          href="/leaderboard"
          onClick={() => play("ui")}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-4 py-2 font-semibold",
            "text-muted transition-colors hover:bg-surface-2 hover:text-fg",
          )}
        >
          <TrophyIcon width={18} height={18} />
          View leaderboard
        </Link>

        {username && (
          <p className="text-sm text-muted">
            Playing as <span className="font-semibold text-fg">{username}</span>
            {" · "}
            <button
              className="underline decoration-dotted underline-offset-4 hover:text-accent"
              onClick={() => {
                setRedirect(null);
                setPromptOpen(true);
              }}
            >
              change
            </button>
          </p>
        )}
      </div>

      <UsernamePrompt
        open={promptOpen}
        onComplete={onComplete}
        onCancel={() => {
          setPromptOpen(false);
          setRedirect(null);
        }}
      />
    </div>
  );
}
