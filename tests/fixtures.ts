import type { Song } from "@/types/repertoire";

export function song(): Song {
  return {
    id: "test-song", title: "Minha música", artist: "Meu artista",
    parts: [{
      id: "intro", name: "Intro", presetId: "2B",
      effects: { overdrive: "off", delay: "on", reverb: "on" },
      configurations: { delay: "delay-2", reverb: "reverb-1" },
      notes: "Entrada suave",
    }],
  };
}
