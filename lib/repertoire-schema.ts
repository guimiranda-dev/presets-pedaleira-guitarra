import { z } from "zod";
import { presets } from "@/config/tonebook";

const id = z.string().min(1).max(150).regex(/^[A-Za-z0-9_-]+$/);
const state = z.enum(["on", "off", "unspecified"]);

export const songSchema = z.object({
  id,
  title: z.string().trim().min(1).max(150),
  artist: z.string().trim().max(150),
  parts: z.array(z.object({
    id,
    name: z.string().trim().min(1).max(80),
    presetId: z.string().refine((value) => value === "" || presets.some(({ id }) => id === value)),
    effects: z.object({ overdrive: state, delay: state, reverb: state }).strict(),
    configurations: z.object({
      delay: z.enum(["", "delay-1", "delay-2"]),
      reverb: z.enum(["", "reverb-1", "reverb-2"]),
    }).strict(),
    notes: z.string().trim().max(1500),
  }).strict()).min(1).max(100)
    .refine((parts) => new Set(parts.map(({ id }) => id)).size === parts.length),
}).strict();

export const songIdSchema = id;
export const saveSongSchema = z.object({
  song: songSchema,
  revision: z.string().regex(/^\d+:\d+$/).nullable(),
}).strict();
