import { repertoireConfig } from "@/config/repertoire";
import { delayConfigurations, reverbConfigurations } from "@/config/tonebook";
import type { Song } from "@/types/repertoire";

const changeEvent = "tonebook:repertoire-changed";

export function subscribeRepertoire(callback: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === repertoireConfig.storageKey || event.key === null) callback();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(changeEvent, callback);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(changeEvent, callback);
  };
}

export function getRepertoireSnapshot() {
  try {
    return localStorage.getItem(repertoireConfig.storageKey);
  } catch {
    return "unavailable";
  }
}

export function getServerRepertoireSnapshot() {
  return null;
}

export function readRepertoire(raw: string | null): Song[] | null {
  if (raw === null) return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return null;
    const valid = data.every((song) =>
      song && typeof song.id === "string" && typeof song.title === "string" &&
      typeof song.artist === "string" && Array.isArray(song.parts) &&
      song.parts.every((part: unknown) => {
        if (!part || typeof part !== "object") return false;
        const value = part as Record<string, unknown>;
        if (typeof value.id !== "string" || typeof value.name !== "string" ||
          typeof value.presetId !== "string" || typeof value.notes !== "string" ||
          !value.effects || typeof value.effects !== "object") return false;
        const effects = value.effects as Record<string, unknown>;
        if (value.configurations !== undefined) {
          if (!value.configurations || typeof value.configurations !== "object") return false;
          const configurations = value.configurations as Record<string, unknown>;
          if (configurations.delay !== "" && !delayConfigurations.some(({ id }) => id === configurations.delay)) return false;
          if (configurations.reverb !== "" && !reverbConfigurations.some(({ id }) => id === configurations.reverb)) return false;
        }
        return repertoireConfig.effects.every(({ id }) =>
          repertoireConfig.states.some(({ value: state }) => state === effects[id]),
        );
      }),
    );
    if (!valid) return null;
    // Migração aditiva: músicas antigas mantêm trechos, estados e anotações.
    return (data as Song[]).map((song) => ({
      ...song,
      parts: song.parts.map((part) => ({
        ...part,
        configurations: part.configurations ?? {
          delay: part.effects.delay === "on" ? "delay-1" : "",
          reverb: part.effects.reverb === "on" ? "reverb-1" : "",
        },
      })),
    }));
  } catch {
    return null;
  }
}

export function saveRepertoire(songs: Song[]) {
  localStorage.setItem(repertoireConfig.storageKey, JSON.stringify(songs));
  window.dispatchEvent(new Event(changeEvent));
}
