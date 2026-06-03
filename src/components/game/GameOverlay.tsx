"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function GameOverlay({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-bg/85 p-3 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.92, y: 12, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
        className="card max-h-full w-full max-w-xs overflow-y-auto overflow-x-hidden p-5 text-center"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
