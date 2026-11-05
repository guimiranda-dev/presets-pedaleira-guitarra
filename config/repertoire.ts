import { presets } from "./tonebook";
import type { Song } from "@/types/repertoire";

export const repertoireConfig = {
  storageKey: "tonebook.repertoire.v1",
  partSuggestions: ["Intro", "1ª estrofe", "2ª estrofe", "Pré-refrão", "Refrão", "Ponte", "Solo", "Final"],
  effects: [
    { id: "overdrive", label: "Overdrive", model: "Pure Sky" },
    { id: "delay", label: "Delay", model: "Elemental" },
    { id: "reverb", label: "Reverb", model: "Mini Universe" },
  ],
  states: [
    { value: "unspecified", label: "A definir" },
    { value: "on", label: "Ligado" },
    { value: "off", label: "Desligado" },
  ],
} as const;

// Só reaproveita associações já fornecidas; não inventa arranjos por trecho.
export const initialSongs: Song[] = presets.flatMap((preset) => preset.song ? [{
  id: `reference-${preset.id}`,
  title: preset.song.replace(/\s*\(Refrão\)$/, ""),
  artist: preset.artist ?? "",
  parts: [{
    id: `reference-part-${preset.id}`,
    name: preset.song.endsWith("(Refrão)") ? "Refrão" : "Referência",
    presetId: preset.id,
    effects: {
      overdrive: preset.od ? "on" : "unspecified",
      delay: preset.ambience ? "on" : "unspecified",
      reverb: preset.ambience ? "on" : "unspecified",
    },
    configurations: {
      delay: preset.delayConfigurationId ?? (preset.ambience ? "delay-1" : ""),
      reverb: preset.reverbConfigurationId ?? (preset.ambience ? "reverb-1" : ""),
    },
    notes: "Referência da biblioteca de presets. Edite para detalhar as partes da sua versão.",
  }],
}] : []);
