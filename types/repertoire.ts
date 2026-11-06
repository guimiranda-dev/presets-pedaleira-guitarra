import type { DelayConfigurationId, ReverbConfigurationId } from "./tonebook";

export type EffectState = "on" | "off" | "unspecified";
export type EffectId = "overdrive" | "delay" | "reverb";

export interface SongPart {
  id: string;
  name: string;
  presetId: string;
  effects: Record<EffectId, EffectState>;
  configurations: {
    delay: DelayConfigurationId | "";
    reverb: ReverbConfigurationId | "";
  };
  notes: string;
}

export interface Song {
  /** Revisão do documento para detectar edições concorrentes. */
  revision?: string;
  id: string;
  title: string;
  artist: string;
  parts: SongPart[];
}
