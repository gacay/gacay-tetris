"use client";

import { useAudio } from "@/lib/audio/useAudio";
import { IconButton, cn } from "./ui";
import { MusicIcon, VolumeOffIcon, VolumeOnIcon } from "./icons";

export function MuteToggle() {
  const muted = useAudio((s) => s.muted);
  const toggleMute = useAudio((s) => s.toggleMute);
  const unlock = useAudio((s) => s.unlock);

  return (
    <IconButton
      aria-label={muted ? "Unmute sound" : "Mute sound"}
      title={muted ? "Unmute" : "Mute"}
      onClick={() => {
        unlock();
        toggleMute();
      }}
    >
      {muted ? <VolumeOffIcon /> : <VolumeOnIcon />}
    </IconButton>
  );
}

export function MusicToggle() {
  const musicOn = useAudio((s) => s.musicOn);
  const toggleMusic = useAudio((s) => s.toggleMusic);
  const unlock = useAudio((s) => s.unlock);

  return (
    <IconButton
      aria-label={musicOn ? "Turn music off" : "Turn music on"}
      title={musicOn ? "Music: on" : "Music: off"}
      onClick={() => {
        unlock();
        toggleMusic();
      }}
      className={cn(musicOn ? "text-accent" : "text-fg/40")}
    >
      <MusicIcon />
    </IconButton>
  );
}
