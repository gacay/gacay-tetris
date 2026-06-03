import { z } from "zod";
import { DURATIONS, MAX_SCORE } from "@/lib/constants";

export const usernameSchema = z.string().trim().min(1).max(16);
export const modeSchema = z.enum(["SINGLE", "MULTI"]);
export const durationSchema = z
  .number()
  .int()
  .refine((n) => (DURATIONS as readonly number[]).includes(n), {
    message: "duration must be 60, 180 or 300",
  });

export const scorePostSchema = z.object({
  username: usernameSchema,
  points: z.number().int().min(0).max(MAX_SCORE),
  mode: modeSchema,
  lines: z.number().int().min(0).max(100000).optional(),
  level: z.number().int().min(1).max(9999).optional(),
});

export const lobbyCreateSchema = z.object({
  hostUsername: usernameSchema,
  durationSec: durationSchema,
});

export const lobbyJoinSchema = z.object({
  guestUsername: usernameSchema,
});

export const lobbyScoreSchema = z.object({
  username: usernameSchema,
  score: z.number().int().min(0).max(MAX_SCORE),
});

export const lobbyFinishSchema = z.object({
  username: usernameSchema,
});

export type ScorePostInput = z.infer<typeof scorePostSchema>;
export type LobbyCreateInput = z.infer<typeof lobbyCreateSchema>;
