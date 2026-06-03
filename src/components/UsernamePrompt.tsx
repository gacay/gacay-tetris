"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "./Modal";
import { Button, TextInput } from "./ui";
import { UserIcon } from "./icons";
import {
  MAX_USERNAME_LEN,
  sanitizeUsername,
  useUsername,
} from "@/lib/session/useUsername";
import { useAudio } from "@/lib/audio/useAudio";

export function UsernamePrompt({
  open,
  onComplete,
  onCancel,
}: {
  open: boolean;
  onComplete: (name: string) => void;
  onCancel?: () => void;
}) {
  const setUsername = useUsername((s) => s.setUsername);
  const current = useUsername((s) => s.username);
  const play = useAudio((s) => s.play);
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(current ?? "");

  // Reset the field to the current username whenever the modal (re)opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setValue(current ?? "");
  }

  useEffect(() => {
    if (open) {
      // focus shortly after the entrance animation begins
      const id = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(id);
    }
  }, [open]);

  const clean = sanitizeUsername(value);
  const valid = clean.length >= 1;

  const submit = () => {
    if (!valid) return;
    setUsername(clean);
    play("ui");
    onComplete(clean);
  };

  return (
    <Modal open={open} onClose={onCancel}>
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent/15 text-accent">
            <UserIcon />
          </span>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Choose a username</h2>
            <p className="text-sm text-muted">
              We&apos;ll remember it on this device for the rest of your session.
            </p>
          </div>
        </div>

        <div>
          <TextInput
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            maxLength={MAX_USERNAME_LEN}
            placeholder="e.g. PastelPro"
            aria-label="Username"
          />
          <div className="mt-1.5 flex justify-between text-xs text-muted">
            <span>Up to {MAX_USERNAME_LEN} characters</span>
            <span>
              {clean.length}/{MAX_USERNAME_LEN}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button onClick={submit} disabled={!valid}>
            Continue
          </Button>
        </div>
      </div>
    </Modal>
  );
}
