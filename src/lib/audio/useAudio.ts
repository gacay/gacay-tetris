"use client";

import { create } from "zustand";
import { audioEngine, type Sfx } from "./audio";

const MUTE_KEY = "tetris:muted";
const MUSIC_KEY = "tetris:music";

interface AudioState {
  muted: boolean;
  musicOn: boolean;
  unlocked: boolean;
  hydrate: () => void;
  unlock: () => void;
  play: (s: Sfx) => void;
  toggleMute: () => void;
  toggleMusic: () => void;
}

export const useAudio = create<AudioState>((set, get) => ({
  muted: false,
  musicOn: false,
  unlocked: false,
  hydrate: () => {
    let muted = false;
    let musicOn = false;
    try {
      muted = localStorage.getItem(MUTE_KEY) === "1";
    } catch {
      /* ignore */
    }
    try {
      musicOn = localStorage.getItem(MUSIC_KEY) === "1";
    } catch {
      /* ignore */
    }
    audioEngine.setMuted(muted);
    set({ muted, musicOn });
  },
  unlock: () => {
    if (get().unlocked) return;
    audioEngine.unlock();
    audioEngine.setMuted(get().muted);
    audioEngine.setMusicOn(get().musicOn);
    set({ unlocked: true });
  },
  play: (s) => {
    audioEngine.play(s);
  },
  toggleMute: () => {
    const muted = !get().muted;
    audioEngine.setMuted(muted);
    try {
      localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    } catch {
      /* ignore */
    }
    set({ muted });
  },
  toggleMusic: () => {
    const musicOn = !get().musicOn;
    audioEngine.setMusicOn(musicOn);
    try {
      localStorage.setItem(MUSIC_KEY, musicOn ? "1" : "0");
    } catch {
      /* ignore */
    }
    set({ musicOn });
  },
}));
