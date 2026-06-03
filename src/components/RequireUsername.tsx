"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useUsername } from "@/lib/session/useUsername";
import { UsernamePrompt } from "./UsernamePrompt";

/** Renders children with the session username, prompting once if it's missing. */
export function RequireUsername({
  children,
}: {
  children: (username: string) => ReactNode;
}) {
  const router = useRouter();
  const username = useUsername((s) => s.username);
  const hydrated = useUsername((s) => s.hydrated);

  if (!hydrated) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted">
        Loading…
      </div>
    );
  }
  if (!username) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <UsernamePrompt
          open
          onComplete={() => {}}
          onCancel={() => router.push("/")}
        />
      </div>
    );
  }
  return <>{children(username)}</>;
}
