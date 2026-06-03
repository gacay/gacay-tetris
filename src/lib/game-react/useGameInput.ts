"use client";

import { useEffect, useRef } from "react";
import type { TetrisController } from "./useTetris";

const DAS = 130; // delayed auto-shift (ms before repeat)
const ARR = 28; // auto-repeat rate (ms between moves)
const SOFT = 28; // soft-drop repeat (ms)

type Dir = "left" | "right";

export function useGameInput(controller: TetrisController, enabled = true) {
  const ctrlRef = useRef(controller);
  const enabledRef = useRef(enabled);
  useEffect(() => {
    ctrlRef.current = controller;
    enabledRef.current = enabled;
  });

  useEffect(() => {
    const held = new Set<string>();
    let dasTimer: ReturnType<typeof setTimeout> | null = null;
    let arrTimer: ReturnType<typeof setInterval> | null = null;
    let softTimer: ReturnType<typeof setInterval> | null = null;
    let activeDir: Dir | null = null;

    const clearHoriz = () => {
      if (dasTimer) clearTimeout(dasTimer);
      if (arrTimer) clearInterval(arrTimer);
      dasTimer = arrTimer = null;
    };
    const startHoriz = (dir: Dir) => {
      activeDir = dir;
      ctrlRef.current.doAction(dir);
      clearHoriz();
      dasTimer = setTimeout(() => {
        arrTimer = setInterval(() => ctrlRef.current.doAction(dir), ARR);
      }, DAS);
    };
    const stopSoft = () => {
      if (softTimer) clearInterval(softTimer);
      softTimer = null;
    };
    const startSoft = () => {
      ctrlRef.current.doAction("softDrop");
      stopSoft();
      softTimer = setInterval(() => ctrlRef.current.doAction("softDrop"), SOFT);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      )
        return;

      const code = e.code;
      if (code === "KeyP" || code === "Escape") {
        e.preventDefault();
        ctrlRef.current.pause();
        return;
      }
      if (!enabledRef.current) return;
      if (
        code === "ArrowLeft" ||
        code === "ArrowRight" ||
        code === "ArrowDown" ||
        code === "ArrowUp" ||
        code === "Space"
      )
        e.preventDefault();
      if (e.repeat || held.has(code)) return;
      held.add(code);

      switch (code) {
        case "ArrowLeft":
          startHoriz("left");
          break;
        case "ArrowRight":
          startHoriz("right");
          break;
        case "ArrowDown":
          startSoft();
          break;
        case "Space":
          ctrlRef.current.doAction("hardDrop");
          break;
        case "ArrowUp":
        case "KeyX":
          ctrlRef.current.doAction("rotateCW");
          break;
        case "KeyZ":
        case "ControlLeft":
        case "ControlRight":
          ctrlRef.current.doAction("rotateCCW");
          break;
        case "KeyA":
          ctrlRef.current.doAction("rotate180");
          break;
        case "KeyC":
        case "ShiftLeft":
        case "ShiftRight":
          ctrlRef.current.doAction("hold");
          break;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      held.delete(code);
      if (code === "ArrowLeft" || code === "ArrowRight") {
        const dir: Dir = code === "ArrowLeft" ? "left" : "right";
        if (activeDir === dir) {
          clearHoriz();
          const otherCode = code === "ArrowLeft" ? "ArrowRight" : "ArrowLeft";
          if (held.has(otherCode))
            startHoriz(otherCode === "ArrowLeft" ? "left" : "right");
          else activeDir = null;
        }
      }
      if (code === "ArrowDown") stopSoft();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      clearHoriz();
      stopSoft();
    };
  }, []);
}
