"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { initialSongs, repertoireConfig } from "@/config/repertoire";
import { delayConfigurations, reverbConfigurations } from "@/config/tonebook";
import { getRepertoireSnapshot, getServerRepertoireSnapshot, readRepertoire, saveRepertoire, subscribeRepertoire } from "@/lib/repertoire-storage";
import type { Preset } from "@/types/tonebook";
import type { Song } from "@/types/repertoire";
import { createPart, SongEditor } from "./song-editor";
import styles from "./repertoire.module.css";

function normalize(text: string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
}

export function Repertoire({ presets, onSelectPreset }: {
  presets: readonly Preset[];
  onSelectPreset: (id: string) => void;
}) {
  const raw = useSyncExternalStore(subscribeRepertoire, getRepertoireSnapshot, getServerRepertoireSnapshot);
  const stored = useMemo(() => readRepertoire(raw), [raw]);
  const songs = stored ?? initialSongs;
  const [selectedId, setSelectedId] = useState(initialSongs[0]?.id);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Song | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const visible = songs.filter((song) => normalize(`${song.title} ${song.artist}`).includes(normalize(query)));
  const selected = visible.find(({ id }) => id === selectedId) ?? visible[0];

  function save(song: Song) {
    try {
      saveRepertoire(songs.some(({ id }) => id === song.id)
        ? songs.map((current) => current.id === song.id ? song : current)
        : [...songs, song]);
      setSelectedId(song.id);
      setQuery("");
      setDraft(null);
      setError("");
      setMessage(`“${song.title}” salva neste navegador.`);
    } catch {
      setError("Não foi possível salvar neste navegador. Seu formulário foi mantido; confira se o armazenamento está permitido e tente novamente.");
    }
  }

  return (
    <section id="repertoire" className={styles.section} aria-labelledby="repertoire-title">
      <div className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>DO ENSAIO AO PALCO</span>
          <h3 id="repertoire-title">Cada música, seu caminho.</h3>
          <p>Organize os timbres de cada parte e saiba o que ligar na próxima entrada.</p>
        </div>
        <button type="button" className={styles.primary} onClick={() => {
          setError("");
          setMessage("");
          setDraft({ id: crypto.randomUUID(), title: "", artist: "", parts: [{ ...createPart(), name: "Intro" }] });
        }} disabled={draft !== null}>+ Nova música</button>
      </div>
      <div className={styles.workspace}>
        <aside className={styles.library} aria-label="Músicas do repertório">
          <div className={styles["library-top"]}><span>MEU REPERTÓRIO</span><b>{String(songs.length).padStart(2, "0")}</b></div>
          <input type="search" className={styles.search} aria-label="Buscar músicas" placeholder="Buscar música ou artista…" value={query} onChange={(event) => setQuery(event.target.value)} />
          <div className={styles["song-list"]}>
            {visible.map((song, index) => (
              <button type="button" key={song.id} disabled={draft !== null} className={`${styles.song} ${selected?.id === song.id ? styles.selected : ""}`} aria-pressed={selected?.id === song.id} onClick={() => { setSelectedId(song.id); setMessage(""); }}>
                <span className={styles.number}>{String(index + 1).padStart(2, "0")}</span>
                <span><strong>{song.title}</strong><small>{song.artist || "Artista não informado"}</small></span>
                <span className={styles["part-count"]}>{song.parts.length} {song.parts.length === 1 ? "parte" : "partes"}</span>
              </button>
            ))}
            {!visible.length && <p className={styles.empty} role="status">{songs.length ? "Nenhuma música encontrada." : "Seu próximo som começa com uma nova música."}</p>}
          </div>
          <p className={styles["storage-note"]}>Suas edições ficam salvas neste navegador.</p>
        </aside>
        <div className={styles.detail}>
          {raw !== null && stored === null && <p className={styles.warning}>O repertório salvo não pôde ser lido. As referências iniciais estão sendo exibidas.</p>}
          {error && <p className={styles.warning} role="alert">{error}</p>}
          {draft ? <SongEditor key={draft.id} song={draft} presets={presets} onSave={save} onCancel={() => { setDraft(null); setError(""); }} /> : selected ? (
            <>
              <div className={styles["song-heading"]}>
                <div><span className={styles.eyebrow}>ROTEIRO DE TIMBRES</span><h4>{selected.title}</h4><p>{selected.artist || "Artista não informado"}</p></div>
                <button type="button" className={styles.secondary} onClick={() => { setDraft(selected); setMessage(""); }}>Editar música</button>
              </div>
              <ol className={styles.timeline}>
                {selected.parts.map((part, index) => {
                  const preset = presets.find(({ id }) => id === part.presetId);
                  return (
                    <li className={styles.part} key={part.id}>
                      <span className={styles.step}>{String(index + 1).padStart(2, "0")}</span>
                      <div className={styles["part-content"]}>
                        <div className={styles["part-heading"]}>
                          <h5>{part.name}</h5>
                          {preset ? <button type="button" className={styles["preset-link"]} onClick={() => onSelectPreset(preset.id)} aria-label={`Consultar preset ${preset.id}, ${preset.name}, para ${part.name}`}>{preset.id} · {preset.name} <span aria-hidden="true">↗</span></button>
                            : <span className={styles.unassigned}>{part.presetId ? `${part.presetId} · Preset indisponível` : "Preset a definir"}</span>}
                        </div>
                        <div className={styles.effects}>
                          {repertoireConfig.effects.map((effect) => {
                            const configuration = effect.id === "overdrive" ? undefined
                              : (effect.id === "delay" ? delayConfigurations : reverbConfigurations)
                                .find(({ id }) => id === part.configurations[effect.id as "delay" | "reverb"]);
                            const active = part.effects[effect.id] === "on";
                            return (
                              <span key={effect.id} className={`${styles.effect} ${styles[part.effects[effect.id]]}`}>
                                <i aria-hidden="true" />{active && configuration ? configuration.label : effect.label}
                                <span>{repertoireConfig.states.find(({ value }) => value === part.effects[effect.id])?.label}</span>
                                {active && configuration?.controls === null && <span className={styles["pending-configuration"]}>Valores pendentes</span>}
                              </span>
                            );
                          })}
                        </div>
                        {part.notes && <p className={styles.notes}>{part.notes}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
              <div className={styles.legend}><span><i className={styles["on-dot"]} />Ligado</span><span><i className={styles["off-dot"]} />Desligado</span><span>Você decide o timbre de cada trecho.</span></div>
            </>
          ) : <div className={styles.empty}>Adicione uma música ou ajuste a busca para consultar seu roteiro.</div>}
        </div>
      </div>
      <p role="status" className={styles["save-message"]}>{message}</p>
    </section>
  );
}
