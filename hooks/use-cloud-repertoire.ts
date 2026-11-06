"use client";

import { useEffect, useState } from "react";
import type { AuthUser } from "@/types/auth";
import type { Song } from "@/types/repertoire";

const songCollator = new Intl.Collator("pt-BR", { sensitivity: "base", numeric: true });

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    cache: "no-store",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Não foi possível acessar o repertório.");
  return body as T;
}

interface CloudState {
  key: string;
  songs: Song[];
  error: string;
}

export function useCloudRepertoire(user: AuthUser) {
  const [refresh, setRefresh] = useState(0);
  const [state, setState] = useState<CloudState>({ key: "", songs: [], error: "" });
  const key = `${user.uid}:${refresh}`;

  useEffect(() => {
    const controller = new AbortController();
    api<{ songs: Song[] }>("/api/repertoire", { signal: controller.signal }).then(({ songs }) => {
      if (!controller.signal.aborted) setState({ key, songs, error: "" });
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setState({ key, songs: [], error: error instanceof Error ? error.message : "Erro ao carregar as músicas." });
    });
    return () => controller.abort();
  }, [key, user]);

  async function saveSong(song: Song) {
    const { revision, ...data } = song;
    const result = await api<{ song: Song }>(`/api/repertoire/songs/${encodeURIComponent(song.id)}`, {
      method: "PUT", body: JSON.stringify({ song: data, revision: revision ?? null }),
    });
    setState((current) => ({
      key,
      error: "",
      songs: current.songs.some(({ id }) => id === result.song.id)
        ? current.songs.map((existing) => existing.id === result.song.id ? result.song : existing)
        : [...current.songs, result.song],
    }));
  }

  return {
    songs: state.key === key
      ? [...state.songs].sort((a, b) => songCollator.compare(a.title, b.title)
        || songCollator.compare(a.artist, b.artist) || a.id.localeCompare(b.id))
      : [],
    loading: state.key !== key,
    loadError: state.key === key ? state.error : "",
    saveSong,
    reload: () => setRefresh((current) => current + 1),
  };
}
